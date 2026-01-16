import { useState, useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import { DropZone } from './components/Ingest/DropZone';
import { SettingsPanel, PROFILES } from './components/Settings/SettingsPanel';
import { Comparator } from './components/Preview/Comparator';
import { ProcessingStatus } from './components/Output/ProcessingStatus';
import { getProcessableFiles, updateMetadata, saveZip } from './utils/zipHandler';
import ProcessorWorker from './workers/processor.worker.js?worker';

function App() {
  // State
  const [zip, setZip] = useState(null);
  const [zipName, setZipName] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, processing, complete
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Settings
  const [settings, setSettings] = useState({
    type: 'protanopia', // Default
    mode: 'simulate',   // simulate | daltonize
    enableOverlays: false,
    enabledOverlayCategories: { ores: true, wool: true, logs: true, potions: true }
  });

  // Preview State
  const [previewFile, setPreviewFile] = useState(null); // { path: string, content: Blob }
  const [previewOriginalUrl, setPreviewOriginalUrl] = useState(null);
  const [previewProcessedUrl, setPreviewProcessedUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Worker Ref
  const workerRef = useRef(null);
  const processingQueue = useRef([]);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new ProcessorWorker();

    workerRef.current.onmessage = handleWorkerMessage;

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  // Update preview when settings change or file is loaded
  useEffect(() => {
    if (previewFile && workerRef.current) {
      generatePreview();
    }
  }, [settings, previewFile]);

  const handleWorkerMessage = (e) => {
    const { jobId, success, data, error } = e.data;

    if (jobId === 'preview') {
      if (success) {
        const url = URL.createObjectURL(new Blob([data]));
        setPreviewProcessedUrl(prev => {
          if (prev) URL.revokeObjectURL(prev); // Cleanup
          return url;
        });
      }
      setIsPreviewLoading(false);
    } else if (jobId.startsWith('job-')) {
      // Handle batch processing results
      // We resolve the promise associated with this job in the queue logic, 
      // but since we are using a simpler queue here, we'll update state directly.
      // Actually, for a robust queue we might need a Map of resolvers. 
      // For simplicity, we'll handle progress here.

      const jobIndex = processingQueue.current.findIndex(j => j.id === jobId);
      if (jobIndex !== -1) {
        const { resolve } = processingQueue.current[jobIndex];
        processingQueue.current.splice(jobIndex, 1);
        resolve({ success, data, error });
      }
    }
  };

  // Helper to promisify worker calls
  const processImage = (id, bitmap, filename, currentSettings) => {
    return new Promise((resolve, reject) => {
      processingQueue.current.push({ id, resolve, reject });
      workerRef.current.postMessage({
        jobId: id,
        bitmap,
        filename,
        settings: currentSettings
      }, [bitmap]); // Transfer bitmap
    });
  };

  const onFileLoaded = async (loadedZip, name) => {
    setStatus('loading');
    setZip(loadedZip);
    setZipName(name);
    setProgress({ current: 0, total: 0 });

    // Find a good candidate for preview
    // Priorities: diamond_ore, wool_red, any ore, any png
    let candidatePath = null;
    const candidates = [
      /.*diamond_ore\.png$/,
      /.*gold_ore\.png$/,
      /.*wool_red\.png$/,
      /.*_ore\.png$/,
      /.*\.png$/
    ];

    for (const pattern of candidates) {
      const match = Object.keys(loadedZip.files).find(path => pattern.test(path) && !loadedZip.files[path].dir);
      if (match) {
        candidatePath = match;
        break;
      }
    }

    if (candidatePath) {
      const content = await loadedZip.file(candidatePath).async('blob');
      setPreviewFile({ path: candidatePath, content });
      setPreviewOriginalUrl(URL.createObjectURL(content));
    } else {
      setPreviewFile(null);
    }

    setStatus('idle');
  };

  const generatePreview = async () => {
    if (!previewFile || !workerRef.current) return;
    setIsPreviewLoading(true);

    const bitmap = await createImageBitmap(previewFile.content);
    workerRef.current.postMessage({
      jobId: 'preview',
      bitmap,
      filename: previewFile.path,
      settings
    }, [bitmap]);
  };

  const handleStartProcessing = async () => {
    if (!zip) return;
    setStatus('processing');

    const filesToProcess = getProcessableFiles(zip);
    const total = filesToProcess.length;
    setProgress({ current: 0, total });

    // Process in chunks to avoid OOM or queuing too much
    // Although Web Worker is async, too many postMessages can block
    const CONCURRENCY = 4;

    for (let i = 0; i < total; i += CONCURRENCY) {
      const chunk = filesToProcess.slice(i, i + CONCURRENCY);

      await Promise.all(chunk.map(async ({ path, file }) => {
        try {
          const blob = await file.async('blob');
          const bitmap = await createImageBitmap(blob);

          const result = await processImage(`job-${path}`, bitmap, path, settings);

          if (result.success) {
            // Update Zip in place
            zip.file(path, result.data);
          } else {
            console.error(`Failed to process ${path}:`, result.error);
          }
        } catch (e) {
          console.error(`Error handling ${path}`, e);
        } finally {
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
      }));
    }

    // Update Metadata
    await updateMetadata(zip);

    setStatus('complete');
  };

  const handleDownload = () => {
    if (zip && status === 'complete') {
      saveZip(zip, zipName);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            Minecraft Daltonizer Suite
          </h1>
          <p className="text-xl text-stone-400 max-w-2xl mx-auto">
            Make your resource packs accessible. Upload, configure, and daltonize textures automatically.
          </p>
        </header>

        {/* Ingest */}
        {!zip && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <DropZone onFileLoaded={onFileLoaded} />
          </section>
        )}

        {/* Main Workspace */}
        {zip && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-500">

            {/* Left Column: Settings and Controls */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-stone-800 p-4 rounded-xl border border-stone-700 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold truncate max-w-[200px]" title={zipName}>{zipName}</h4>
                  <p className="text-xs text-stone-500">Resource Pack Loop Loaded</p>
                </div>
                <button
                  onClick={() => { setZip(null); setStatus('idle'); setPreviewFile(null); }}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Reset
                </button>
              </div>

              <SettingsPanel
                settings={settings}
                onChange={setSettings}
                disabled={status === 'processing'}
              />

              {status === 'idle' && (
                <button
                  onClick={handleStartProcessing}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Process All Textures
                </button>
              )}

              <ProcessingStatus
                status={status}
                progress={progress.current}
                total={progress.total}
                onDownload={handleDownload}
              />
            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-8">
              <div className="bg-stone-800/30 border border-stone-700/50 rounded-2xl p-6 h-full min-h-[500px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Live Preview</h2>
                  {previewFile && (
                    <span className="text-sm font-mono text-stone-500 bg-stone-900 px-3 py-1 rounded-full">
                      {previewFile.path.split('/').pop()}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex items-center justify-center">
                  {previewOriginalUrl ? (
                    <Comparator
                      originalSrc={previewOriginalUrl}
                      processedSrc={previewProcessedUrl}
                      className="w-full max-w-lg shadow-2xl rounded-xl"
                    />
                  ) : (
                    <div className="text-stone-500">No preview available for this pack</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default App;

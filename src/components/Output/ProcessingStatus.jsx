import React from 'react';
import { Loader2, CheckCircle, Download } from 'lucide-react';

export function ProcessingStatus({ status, progress, total, onDownload }) {
    if (status === 'idle') return null;

    const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

    return (
        <div className="w-full bg-stone-800/80 border border-stone-700 rounded-xl p-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    {status === 'processing' && <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />}
                    {status === 'complete' && <CheckCircle className="w-5 h-5 text-emerald-400" />}

                    {status === 'loading' && "Reading Zip File..."}
                    {status === 'processing' && "Processing Textures..."}
                    {status === 'complete' && "Processing Complete!"}
                </h3>
                <span className="text-stone-400 font-mono text-sm">
                    {progress} / {total}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-stone-900 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {status === 'complete' && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onDownload}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Download className="w-5 h-5" />
                        Download Processed Pack
                    </button>
                </div>
            )}
        </div>
    );
}

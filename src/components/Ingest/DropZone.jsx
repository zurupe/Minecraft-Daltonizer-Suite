import React, { useState, useCallback } from 'react';
import { Upload, AlertTriangle, FileArchive } from 'lucide-react';
import clsx from 'clsx';
import { loadAndValidateZip } from '../../utils/zipHandler';

const MAX_SIZE_MB = 100;

export function DropZone({ onFileLoaded }) {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const [warning, setWarning] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const processFile = async (file) => {
        setError(null);
        setWarning(null);
        setIsLoading(true);

        // Memory Warning
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setWarning(`This file is large (${(file.size / 1024 / 1024).toFixed(1)}MB). Processing might slow down your browser.`);
        }

        try {
            const zip = await loadAndValidateZip(file);
            onFileLoaded(zip, file.name);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, [onFileLoaded]);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                className={clsx(
                    "relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200 ease-in-out gap-4 group",
                    dragActive ? "border-emerald-500 bg-emerald-500/10" : "border-stone-600 bg-stone-800/30 hover:border-stone-500 hover:bg-stone-800/50",
                    isLoading && "opacity-50 pointer-events-none"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleChange}
                    accept=".zip"
                    disabled={isLoading}
                />

                <div className="p-4 rounded-full bg-stone-800 ring-1 ring-stone-700 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-emerald-400" />
                </div>

                <div className="text-center">
                    <h3 className="text-lg font-medium text-stone-200">
                        {isLoading ? 'Reading Resource Pack...' : 'Drag & drop your Resource Pack'}
                    </h3>
                    <p className="text-sm text-stone-400 mt-1">
                        or click to browse (.zip)
                    </p>
                </div>

                {warning && (
                    <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-4 py-2 rounded-lg text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        {warning}
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

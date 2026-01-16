import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, Image as ImageIcon } from 'lucide-react';

export function Comparator({ originalSrc, processedSrc, className }) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef(null);
    const isDragging = useRef(false);

    const handleMove = (x) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pos = ((x - rect.left) / rect.width) * 100;
        setSliderPosition(Math.min(100, Math.max(0, pos)));
    };

    const handleMouseDown = () => { isDragging.current = true; };
    const handleMouseUp = () => { isDragging.current = false; };
    const handleMouseMove = (e) => { if (isDragging.current) handleMove(e.clientX); };

    const handleTouchMove = (e) => {
        if (isDragging.current) handleMove(e.touches[0].clientX);
    }

    useEffect(() => {
        const up = () => isDragging.current = false;
        window.addEventListener('mouseup', up);
        window.addEventListener('touchend', up);
        return () => {
            window.removeEventListener('mouseup', up);
            window.removeEventListener('touchend', up);
        }
    }, []);

    if (!originalSrc) {
        return (
            <div className="w-full h-64 bg-stone-800 rounded-xl flex flex-col items-center justify-center text-stone-500 border border-stone-700">
                <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                <p>No preview available</p>
            </div>
        )
    }

    return (
        <div className={className}>
            <div
                ref={containerRef}
                className="relative w-full aspect-square bg-stone-900 rounded-xl overflow-hidden border border-stone-700 select-none cursor-ew-resize group"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onTouchStart={handleMouseDown}
                onTouchMove={handleTouchMove}
            >
                {/* Background Image (Processed - Right Side) */}
                <img
                    src={processedSrc || originalSrc}
                    alt="Processed"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />

                {/* Foreground Image (Original - Left Side) */}
                {/* Clamped by clip-path */}
                <div
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                    <img
                        src={originalSrc}
                        alt="Original"
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Slider Handle */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ left: `${sliderPosition}%` }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-stone-900 group-hover:scale-110 transition-transform">
                        <ArrowLeftRight className="w-4 h-4" />
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                    Original
                </div>
                <div className="absolute top-4 right-4 bg-emerald-500/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                    Daltonized
                </div>
            </div>
            <p className="text-center text-stone-500 text-sm mt-2">
                Drag slider to compare
            </p>
        </div>
    );
}

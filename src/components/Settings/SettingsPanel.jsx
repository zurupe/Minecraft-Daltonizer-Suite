import React from 'react';
import { Settings, Eye, Palette, Layers, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export const PROFILES = [
    { id: 'protanopia', label: 'Protanopia', desc: 'Red-Blind (L-Cone)' },
    { id: 'deuteranopia', label: 'Deuteranopia', desc: 'Green-Blind (M-Cone)' },
    { id: 'tritanopia', label: 'Tritanopia', desc: 'Blue-Blind (S-Cone)' },
    { id: 'achromatopsia', label: 'Achromatopsia', desc: 'Monochromacy' },
];

export function SettingsPanel({ settings, onChange, disabled }) {
    const handleChange = (key, value) => {
        onChange({ ...settings, [key]: value });
    };

    const handleOverlayToggle = (key) => {
        const current = settings.enabledOverlayCategories || {};
        handleChange('enabledOverlayCategories', {
            ...current,
            [key]: !current[key]
        });
    };

    return (
        <div className={clsx("space-y-8 pointer-events-auto", disabled && "opacity-50 pointer-events-none")}>

            {/* 1. Color Profile */}
            <section className="bg-stone-800/50 border border-stone-700 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <Eye className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Vision Deficiency</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PROFILES.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handleChange('type', p.id)}
                            className={clsx(
                                "flex flex-col text-left p-4 rounded-lg border transition-all",
                                settings.type === p.id
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-100"
                                    : "bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-500 hover:bg-stone-700"
                            )}
                        >
                            <span className="font-medium">{p.label}</span>
                            <span className="text-xs opacity-70">{p.desc}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* 2. Algorithm Mode */}
            <section className="bg-stone-800/50 border border-stone-700 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4 text-cyan-400">
                    <Settings className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Processing Mode</h3>
                </div>
                <div className="flex bg-stone-900 p-1 rounded-lg">
                    <button
                        onClick={() => handleChange('mode', 'simulate')}
                        className={clsx(
                            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                            settings.mode === 'simulate' ? "bg-stone-700 text-white shadow-sm" : "text-stone-500 hover:text-stone-300"
                        )}
                    >
                        Simulation (Preview)
                    </button>
                    <button
                        onClick={() => handleChange('mode', 'daltonize')}
                        className={clsx(
                            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                            settings.mode === 'daltonize' ? "bg-cyan-600 text-white shadow-sm" : "text-stone-500 hover:text-stone-300"
                        )}
                    >
                        Daltonization (Correction)
                    </button>
                </div>
                <p className="text-sm text-stone-500 mt-3">
                    {settings.mode === 'simulate'
                        ? "See how the world looks to someone with the selected condition."
                        : "Shift colors to improve distinction for the selected condition."}
                </p>
            </section>

            {/* 3. Overlays */}
            <section className="bg-stone-800/50 border border-stone-700 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-purple-400">
                        <Layers className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">Assistive Overlays</h3>
                    </div>
                    <button
                        onClick={() => handleChange('enableOverlays', !settings.enableOverlays)}
                        className={clsx(
                            "w-12 h-6 rounded-full transition-colors relative",
                            settings.enableOverlays ? "bg-purple-500" : "bg-stone-700"
                        )}
                    >
                        <div className={clsx("absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm", settings.enableOverlays ? "left-7" : "left-1")} />
                    </button>
                </div>

                {settings.enableOverlays && (
                    <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                        {[
                            { id: 'ores', label: 'Minerals (Fe, Au)' },
                            { id: 'wool', label: 'Wool Colors' },
                            { id: 'logs', label: 'Wood Types' },
                            { id: 'potions', label: 'Potions' }
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleOverlayToggle(cat.id)}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border",
                                    (settings.enabledOverlayCategories?.[cat.id] ?? true)
                                        ? "bg-purple-500/20 border-purple-500/50 text-purple-100"
                                        : "bg-stone-900 border-stone-800 text-stone-500 hover:border-stone-600"
                                )}
                            >
                                <CheckCircle className={clsx("w-4 h-4", (settings.enabledOverlayCategories?.[cat.id] ?? true) ? "opacity-100" : "opacity-0")} />
                                {cat.label}
                            </button>
                        ))}
                        <p className="text-xs text-stone-500 col-span-2 mt-2">
                            Overlays add high-contrast symbols to indistinguishable textures.
                        </p>
                    </div>
                )}
            </section>

        </div>
    );
}

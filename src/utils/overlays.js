/**
 * Minecraft Daltonizer Suite - Overlay Logic
 * Handles detection of file types and application of visual overlays
 */

const OVERLAY_CONFIG = [
    {
        category: 'ores',
        regex: /.*_ore\.png$/,
        // Function to derive overlay content from filename
        getContent: (filename) => {
            if (filename.includes('diamond')) return { text: 'Di', color: '#00ffff' }; // Cyan
            if (filename.includes('gold')) return { text: 'Au', color: '#ffd700' }; // Gold
            if (filename.includes('iron')) return { text: 'Fe', color: '#d8d8d8' }; // Iron
            if (filename.includes('coal')) return { text: 'C', color: '#333333' }; // Dark Grey
            if (filename.includes('lapis')) return { text: 'La', color: '#0000ff' }; // Blue
            if (filename.includes('redstone')) return { text: 'Re', color: '#ff0000' }; // Red
            if (filename.includes('emerald')) return { text: 'Em', color: '#50c878' }; // Emerald
            if (filename.includes('copper')) return { text: 'Cu', color: '#b87333' }; // Copper
            if (filename.includes('nether_quartz')) return { text: 'Q', color: '#ffffff' };
            if (filename.includes('nether_gold')) return { text: 'Au', color: '#ffd700' };
            return null;
        }
    },
    {
        category: 'wool',
        regex: /wool_.*\.png$/,
        getContent: (filename) => {
            // Extract color name from wool_red.png
            const match = filename.match(/wool_(.*)\.png$/);
            if (!match) return null;
            const colorName = match[1];
            return { text: colorName.charAt(0).toUpperCase(), color: '#ffffff', position: 'corner' };
        }
    },
    {
        category: 'logs',
        regex: /log_.*\.png$/,
        getContent: (filename) => {
            const match = filename.match(/log_(.*)\.png$/);
            if (!match) return null;
            const type = match[1];
            return { text: type.charAt(0).toUpperCase(), color: '#ffffff', scale: 0.5 };
        }
    }
    // Potions usually need icons, skipping for text-only MVP or adding symbols later
];

/**
 * Determine if a file needs an overlay and what it should be
 */
export function getOverlayForFile(filename) {
    for (const config of OVERLAY_CONFIG) {
        if (config.regex.test(filename)) {
            const content = config.getContent(filename);
            if (content) {
                return {
                    category: config.category,
                    ...content
                };
            }
        }
    }
    return null;
}

/**
 * Draw the overlay onto a Canvas Context
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Number} width 
 * @param {Number} height 
 * @param {Object} overlay 
 */
export function applyOverlay(ctx, width, height, overlay) {
    if (!overlay) return;

    ctx.save();

    // Settings defaults
    const fontSize = overlay.scale ? height * overlay.scale : height * 0.8;
    const color = overlay.color || '#ffffff';

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Stroke for contrast
    ctx.lineWidth = width * 0.05;
    ctx.strokeStyle = '#000000';

    // Position
    let x = width / 2;
    let y = height / 2;

    if (overlay.position === 'corner') {
        x = width * 0.75;
        y = height * 0.75;
        ctx.font = `bold ${height * 0.5}px sans-serif`;
    }

    // Draw
    if (overlay.text) {
        ctx.fillStyle = color;
        ctx.strokeText(overlay.text, x, y + (height * 0.05)); // Slight Y correction
        ctx.fillText(overlay.text, x, y + (height * 0.05));
    }

    // TODO: Icon logic for non-text overlays

    ctx.restore();
}

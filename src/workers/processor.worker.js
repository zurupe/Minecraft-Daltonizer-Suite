/**
 * Minecraft Daltonizer Suite - Image Processor Worker
 * Handles off-main-thread image manipulation
 */

import { processPixel } from '../utils/color.js';
import { getOverlayForFile, applyOverlay } from '../utils/overlays.js';

self.onmessage = async (e) => {
    const { jobId, bitmap, filename, settings } = e.data;

    try {
        if (!bitmap) throw new Error('No bitmap provided');

        // 1. Setup OffscreenCanvas
        const width = bitmap.width;
        const height = bitmap.height;
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // 2. Draw original image to get pixel data
        ctx.drawImage(bitmap, 0, 0);

        // We can release the bitmap now
        bitmap.close();

        // 3. Get Pixel Data for Daltonization
        // Optimization: Check if we actually need to process color
        const needsColorProcessing = settings.type !== 'normal';

        if (needsColorProcessing) {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            const len = data.length;

            // Daltonize loop
            for (let i = 0; i < len; i += 4) {
                // Skip fully transparent pixels optimization
                if (data[i + 3] === 0) continue;

                const original = [data[i], data[i + 1], data[i + 2]];

                // Apply Color Algorithm
                // settings.mode should be 'simulate' or 'correct'
                // processPixel(color, type, simulateOnly)
                // If mode is 'simulate', simulateOnly = true
                // If mode is 'daltonize' (correct), simulateOnly = false

                const isSimulate = settings.mode === 'simulate';
                const result = processPixel(original, settings.type, isSimulate);

                data[i] = result[0];
                data[i + 1] = result[1];
                data[i + 2] = result[2];
                // Alpha (data[i+3]) remains untouched
            }

            // Put modified pixels back
            ctx.putImageData(imageData, 0, 0);
        }

        // 4. Apply Overlays
        // Only if enabled in settings
        if (settings.enableOverlays) {
            const overlay = getOverlayForFile(filename);
            if (overlay) {
                // Check if this category is enabled
                if (settings.enabledOverlayCategories && settings.enabledOverlayCategories[overlay.category]) {
                    applyOverlay(ctx, width, height, overlay);
                } else if (!settings.enabledOverlayCategories) {
                    // Default to true if not specified? Or safe fail. 
                    // Assuming enabled if checking generic enabling.
                    applyOverlay(ctx, width, height, overlay);
                }
            }
        }

        // 5. Convert back to Blob/Buffer
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        const arrayBuffer = await blob.arrayBuffer();

        // 6. Respond
        self.postMessage({
            jobId,
            success: true,
            data: arrayBuffer,
            filename // Return filename to help re-assembling
        }, [arrayBuffer]); // Transferable

    } catch (error) {
        self.postMessage({
            jobId,
            success: false,
            error: error.message
        });
    }
};

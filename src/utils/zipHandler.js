/**
 * Minecraft Daltonizer Suite - Zip Handler
 * Facade for JSZip to handle Resource Pack structure
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Validates if the file is a Minecraft Resource Pack
 * @param {File} file 
 * @returns {Promise<JSZip>}
 */
export async function loadAndValidateZip(file) {
    try {
        const zip = await JSZip.loadAsync(file);

        // Validation: Check for pack.mcmeta
        if (!zip.file("pack.mcmeta")) {
            throw new Error("Invalid Resource Pack: pack.mcmeta not found at root.");
        }

        return zip;
    } catch (err) {
        throw new Error(err.message || "Failed to load Zip file.");
    }
}

/**
 * Updates the pack.mcmeta description
 * @param {JSZip} zip 
 */
export async function updateMetadata(zip) {
    const metaFile = zip.file("pack.mcmeta");
    if (!metaFile) return;

    try {
        const text = await metaFile.async("text");
        const json = JSON.parse(text);

        if (json.pack) {
            json.pack.description = (json.pack.description || "") + " (Daltonized by MC-Suite)";
        }

        zip.file("pack.mcmeta", JSON.stringify(json, null, 2));
    } catch (e) {
        console.warn("Failed to update pack.mcmeta", e);
    }
}

/**
 * Filter available files for processing
 * @param {JSZip} zip 
 * @returns {Array<{path: string, file: JSZip.JSZipObject}>}
 */
export function getProcessableFiles(zip) {
    const files = [];
    zip.forEach((relativePath, file) => {
        if (file.dir) return;
        if (!relativePath.endsWith('.png')) return;

        // Scope to textures/block and textures/item as per SRS
        // SRS: ".*\/textures\/block\/.*_ore.png" etc.
        // Actually SRS says "El sistema no debe procesar todas las imágenes. Debe filtrar..."
        // But for GENERAL daltonization, we usually process ALL textures in assets/minecraft/textures?
        // SRS 4.B.3 says: 
        // Is .png? Yes.
        // In assets/minecraft/textures? Yes.
        // Is block or item? Yes.
        // So we filter narrowly.

        if (relativePath.match(/assets\/minecraft\/textures\/(block|item)\/.*\.png$/)) {
            files.push({ path: relativePath, file });
        }
    });
    return files;
}

/**
 * Generating and Downloading the new Zip
 * @param {JSZip} zip 
 * @param {String} filename 
 */
export async function saveZip(zip, filename) {
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, filename.replace('.zip', '_daltonized.zip'));
}

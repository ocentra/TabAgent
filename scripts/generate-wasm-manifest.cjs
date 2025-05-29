#!/usr/bin/env node
/* eslint-disable */
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../dist/assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

function findWasmFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findWasmFiles(fullPath, fileList);
        } else if (file.endsWith('.wasm') || file.endsWith('.mjs')) {
            // Store relative path from assetsDir
            fileList.push(path.relative(assetsDir, fullPath).replace(/\\/g, '/'));
        }
    }
    return fileList;
}

const wasmFiles = findWasmFiles(assetsDir);

fs.writeFileSync(
    path.join(assetsDir, 'wasm-manifest.json'),
    JSON.stringify(wasmFiles, null, 2)
);
console.log('[generate-wasm-manifest] Manifest written with files:', wasmFiles); 
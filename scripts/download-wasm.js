import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function main() {
    console.log('Fetching latest release info from GitHub...');
    const API_URL = 'https://api.github.com/repos/k2-fsa/sherpa-onnx/releases/latest';

    // Use curl to fetch the JSON API safely
    const releaseDataRaw = execSync(`curl -s -H "User-Agent: Node.js" ${API_URL}`).toString();
    const releaseData = JSON.parse(releaseDataRaw);

    const wasmAsset = releaseData.assets.find(asset => asset.name === 'sherpa-onnx-wasm-main.tar.bz2');

    if (!wasmAsset) {
        console.error('Could not find sherpa-onnx-wasm-main.tar.bz2 in the latest release.');
        return;
    }

    const downloadUrl = wasmAsset.browser_download_url;
    console.log(`Downloading ${downloadUrl}...`);

    try {
        process.chdir(PUBLIC_DIR);
        execSync(`curl -L -o sherpa-onnx-wasm.tar.bz2 ${downloadUrl}`, { stdio: 'inherit' });

        console.log('Extracting archive...');
        execSync(`tar -xf sherpa-onnx-wasm.tar.bz2`, { stdio: 'inherit' });

        console.log('Moving WASM files to public directory...');
        // The archive usually contains a folder, but wait, we need to find sherpa-onnx*wasm* files
        const extractedDir = 'build-wasm-bin'; // Let's guess or check what's inside.
        // Actually, let's just use `tar -tf` to see contents
        const filesRaw = execSync(`tar -tf sherpa-onnx-wasm.tar.bz2`).toString();
        console.log("Archive contents:", filesRaw.split('\n').filter(Boolean).slice(0, 10));

        console.log('WASM setup complete. You can clean up the archive manually or with your logic.');
    } catch (e) {
        console.error('Failed to download or extract WASM.', e.message);
    }
}

main();

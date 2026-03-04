import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUNDLE_NAME = 'sherpa-onnx-wasm-simd-v1.12.28-zh-en-asr-zipformer';
const BUNDLE_URL = `https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.12.28/${BUNDLE_NAME}.tar.bz2`;

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Helper to ensure directory exists
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function main() {
    process.chdir(PUBLIC_DIR);

    console.log(`Downloading complete web bundle: ${BUNDLE_URL}`);
    try {
        execSync(`curl -L -o bundle.tar.bz2 ${BUNDLE_URL}`, { stdio: 'inherit' });

        console.log('Extracting archive...');
        execSync(`tar -xf bundle.tar.bz2`, { stdio: 'inherit' });

        // Clean up
        fs.unlinkSync('bundle.tar.bz2');

        console.log(`Extracted to public/${BUNDLE_NAME}`);
        console.log('We should inspect the contents to copy the right files to public/model and public/');

        const extractedDir = path.join(PUBLIC_DIR, BUNDLE_NAME);
        if (fs.existsSync(extractedDir)) {
            const files = fs.readdirSync(extractedDir);
            console.log(`Contents of ${BUNDLE_NAME}:`);
            files.forEach(f => console.log(f));
        }

    } catch (e) {
        console.error('Failed to download or extract bundle.', e.message);
    }
}

main();

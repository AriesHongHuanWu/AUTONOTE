import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_NAME = 'sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20';
const MODEL_URL = `https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/${MODEL_NAME}.tar.bz2`;

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MODEL_DIR = path.join(PUBLIC_DIR, 'model');

// Helper to ensure directory exists
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function copyWasmFiles() {
    console.log("Copying WebAssembly files from node_modules...");
    const nodeModulesSherpa = path.join(__dirname, '..', 'node_modules', 'sherpa-onnx');
    if (!fs.existsSync(nodeModulesSherpa)) {
        throw new Error('sherpa-onnx is not installed. Run npm install sherpa-onnx first.');
    }

    const wasmFiles = ['sherpa-onnx.js', 'sherpa-onnx.wasm'];
    for (const file of wasmFiles) {
        const src = path.join(nodeModulesSherpa, file);
        const dest = path.join(PUBLIC_DIR, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`Copied ${file} to public/`);
        } else {
            console.warn(`Warning: Could not find ${file} in node_modules/sherpa-onnx`);
        }
    }
}

async function main() {
    ensureDir(MODEL_DIR);

    // 1. Copy WASM files
    try {
        await copyWasmFiles();
    } catch (e) {
        console.error("Error copying WASM files:", e);
    }

    // 2. Download Model
    const onnxFile = path.join(MODEL_DIR, 'encoder_jit_trace-pnnx.onnx');
    if (fs.existsSync(onnxFile)) {
        console.log('Model files already exist in public/model. Skipping download.');
        return;
    }

    console.log('We will use curl and tar to download and extract the model...');
    try {
        // Change working directory to public
        process.chdir(PUBLIC_DIR);

        console.log(`Fetching ${MODEL_URL}`);
        execSync(`curl -L -o model.tar.bz2 ${MODEL_URL}`, { stdio: 'inherit' });

        console.log('Extracting archive...');
        execSync(`tar -xf model.tar.bz2`, { stdio: 'inherit' });

        const extractedDir = path.join(PUBLIC_DIR, MODEL_NAME);

        if (fs.existsSync(extractedDir)) {
            const files = fs.readdirSync(extractedDir);
            for (const file of files) {
                fs.renameSync(path.join(extractedDir, file), path.join(MODEL_DIR, file));
            }
            fs.rmdirSync(extractedDir);
        }

        fs.unlinkSync('model.tar.bz2');
        console.log('Model setup complete!');
    } catch (e) {
        console.error('Failed to download or extract model.', e.message);
        console.log('Please download the model manually from:', MODEL_URL);
        console.log('And extract it to public/model/');
    }
}

main();

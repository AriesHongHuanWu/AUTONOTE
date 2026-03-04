import { execSync } from 'child_process';
const releaseDataRaw = execSync('curl -s -H "User-Agent: Node.js" https://api.github.com/repos/k2-fsa/sherpa-onnx/releases/latest').toString();
const releaseData = JSON.parse(releaseDataRaw);
const wasmAssets = releaseData.assets.filter(a => a.name.includes('wasm'));
console.log("Found WASM assets:");
wasmAssets.forEach(a => console.log(a.name));

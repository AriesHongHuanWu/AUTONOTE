const CACHE_NAME = 'autonote-models-cache-v1';

// We want to aggressively cache these heavy Sherpa-ONNX payload URLs
const MODEL_URLS = [
    'https://huggingface.co/spaces/k2-fsa/web-assembly-asr-sherpa-onnx-zh-en/resolve/main/sherpa-onnx-wasm-main-asr.data',
    'https://huggingface.co/spaces/k2-fsa/web-assembly-asr-sherpa-onnx-zh-en/resolve/main/sherpa-onnx-wasm-main-asr.wasm',
    'https://huggingface.co/spaces/k2-fsa/web-assembly-asr-sherpa-onnx-zh-en/resolve/main/sherpa-onnx-asr.js',
    'https://huggingface.co/spaces/k2-fsa/web-assembly-asr-sherpa-onnx-zh-en/resolve/main/sherpa-onnx-wasm-main-asr.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Clearing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Intercept requests to the known heavy model files
    if (MODEL_URLS.some(modelUrl => url.includes(modelUrl))) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[Service Worker] Returning cached model file:', url);
                    // Optional: Return cached immediately, could re-fetch in background if we suspect an update is needed
                    return cachedResponse;
                }

                console.log('[Service Worker] Fetching model file from network:', url);
                return fetch(event.request).then((networkResponse) => {
                    // Check if we received a valid response
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'cors') {
                        return networkResponse; // Don't cache errors or opaque responses
                    }

                    // Clone the response because the stream can only be consumed once
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        console.log('[Service Worker] Caching downloaded model file:', url);
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                }).catch((err) => {
                    console.error('[Service Worker] Fetch failed for', url, err);
                    throw err;
                });
            })
        );
    } else {
        // For all other requests (like local React files), just pass them through normally. 
        // In a full PWA you might also cache the JS bundles.
        return;
    }
});

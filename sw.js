const CACHE_VERSION = 'v1';
const CACHE_NAME = `calc-pwa-${CACHE_VERSION}`;

const ASSETS = [
    '/',
    '/index.html',
    '/about',
    '/about.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(k => k.startsWith('calc-pwa-') && k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) return;

    event.respondWith(
        caches.match(req).then(cached => {
            if (cached) return cached;

            return fetch(req)
                .then(response => {
                    if (!response || response.status !== 200 || response.type === 'opaque') {
                        return response;
                    }
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
                    return response;
                })
                .catch(() => {
                    if (req.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return new Response('Offline', { status: 503, statusText: 'Offline' });
                });
        })
    );
});
const CACHE_NAME = "version-3";
const urlsToCache = ['/', '/index.html', '/offline.html', '/manifest.json'];

const self = this;

// Install SW
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
           .then((cache) => {
               console.log('Opened cache');
               return cache.addAll(urlsToCache);
           })
    );
    self.skipWaiting();
});

// Activate SW
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames.map((cacheName) => {
                if(cacheName !== CACHE_NAME) {
                    return caches.delete(cacheName);
                }
            })
        ))
    );
    self.clients.claim();
});

// Fetching
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) return;

    // IMPORTANT: Let the network handle ALL JavaScript files during development
    // This prevents "Loading chunk failed" errors
    if (event.request.url.includes('.js') || event.request.url.includes('static/js')) {
        return; 
    }

    if (
        event.request.url.includes('/video/') || 
        event.request.url.includes(':5000') || 
        event.request.url.includes('cloudinary.com') ||
        event.request.url.includes('firebasestorage.googleapis.com')
    ) {
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match('/offline.html'))
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    return response || fetch(event.request);
                })
        );
    }
});
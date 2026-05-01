const CACHE_NAME = "version-4";
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

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Default URL if not specified
    const urlToOpen = event.notification.data?.url || '/alert';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // If a window is already open, focus it and navigate
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if ('focus' in client) {
                        return client.focus().then(() => {
                            if (client.url !== urlToOpen) {
                                return client.navigate(urlToOpen);
                            }
                        });
                    }
                }
                // If no window is open, open a new one
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});
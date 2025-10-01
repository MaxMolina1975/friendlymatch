// Service Worker for offline functionality
const CACHE_NAME = 'friendly-match-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/src/main.js',
    '/src/styles/main.css',
    '/src/game/GameEngine.js',
    '/src/audio/AudioManager.js',
    '/src/i18n/translations.js',
    '/src/storage/ProgressManager.js',
    'https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            }
        )
    );
});

// Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
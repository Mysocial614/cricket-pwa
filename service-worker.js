const REPO_NAME = 'cricket-pwa'; // Replace with your repository name
const CACHE_NAME = 'cricket-pwa-v1';
const urlsToCache = [
  '/' + REPO_NAME + '/',
  '/' + REPO_NAME + '/index.html',
  '/' + REPO_NAME + '/css/style.css',
  '/' + REPO_NAME + '/js/app.js',
  '/' + REPO_NAME + '/js/db.js',
  '/' + REPO_NAME + '/js/api.js',
  '/' + REPO_NAME + '/js/components/score-board.js',
  '/' + REPO_NAME + '/js/components/team-card.js',
  '/' + REPO_NAME + '/js/components/match-editor.js',
  '/' + REPO_NAME + '/js/components/invite-link.js',
  '/' + REPO_NAME + '/js/components/stats-panel.js',
  '/' + REPO_NAME + '/manifest.json',
  '/' + REPO_NAME + '/icon-192.png',
  '/' + REPO_NAME + '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
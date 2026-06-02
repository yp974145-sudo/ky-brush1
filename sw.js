// 考研刷题 - Service Worker
// 缓存核心文件，支持离线访问

const CACHE = 'ky-brush-v2';
const ASSETS = [
  '/408-brush/',
  '/408-brush/index.html',
  '/408-brush/css/style.css',
  '/408-brush/js/app.js',
  '/408-brush/js/storage.js',
  '/408-brush/js/search.js',
  '/408-brush/js/subjects.js',
  '/408-brush/js/data.js',
  '/408-brush/js/data-408.js',
  '/408-brush/js/data-math.js',
  '/408-brush/js/data-politics.js',
  '/408-brush/js/data-english.js',
  '/408-brush/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      })
    )
  );
});

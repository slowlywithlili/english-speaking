/* ============================================================
   離線功能（Service Worker）
   策略：有網路時一律抓最新版並順便存一份；沒網路時改用存下來的那份。
   所以修改程式後，不需要動這個檔案。
   新增檔案（例如新的獎勵圖片）時，可順手加進下方 PRECACHE 清單，
   讓它在第一次開啟時就先存好；沒加也沒關係，用過一次就會存下來。
   ============================================================ */

importScripts('js/settings.js');

const CACHE_NAME = 'english-speaking-' + SETTINGS.appVersion;

const PRECACHE = [
    './',
    'index.html',
    'manifest.webmanifest',
    'css/style.css',
    'js/settings.js',
    'js/app.js',
    'js/pwa.js',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/apple-touch-icon.png',
    ...SETTINGS.rewards.map(reward => reward.image)
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key.startsWith('english-speaking-') && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

    event.respondWith(
        // 用網址重新建立請求，避免 Safari／Chrome 對頁面請求加上選項時報錯
        fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
            .then(response => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                }
                return response;
            })
            .catch(() =>
                caches.match(request, { ignoreSearch: true })
                    .then(cached => cached || (request.mode === 'navigate' ? caches.match('index.html') : undefined))
                    .then(cached => cached || new Response('目前離線，且這個檔案尚未存在裝置上。', {
                        status: 503,
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    }))
            )
    );
});

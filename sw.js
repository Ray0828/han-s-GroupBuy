const CACHE_NAME = 'groupbuy-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 預先快取關鍵檔案
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      // 策略：快取優先 (Stale-while-revalidate 的變體)
      // 這對於 CDN 資源特別重要，因為我們要讓它離線能跑
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);

      // 如果有快取，先回傳快取
      if (cachedResponse) {
        // 背景偷偷更新快取 (若是主要程式碼)
        if(event.request.url.includes('index.html') || event.request.url.includes('index.tsx')) {
             fetch(event.request).then(networkResponse => {
                if(networkResponse.ok) cache.put(event.request, networkResponse);
             }).catch(err => console.log('Background update failed', err));
        }
        return cachedResponse;
      }

      // 沒快取，去網路抓
      try {
        const networkResponse = await fetch(event.request);
        // 如果抓成功了，存入快取 (包含 CDN 檔案)
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        console.log('Fetch failed', error);
        throw error;
      }
    })()
  );
});
// My X Service Worker（歌詞アプリ方式に統一：版管理キャッシュ＋必須ファイルの先読み）
// ★ index.html を更新して配る時は、ここの版を myx-v4, myx-v4 と上げていきます
const CACHE_NAME = 'myx-v4';

// アプリの動作に必須のもの：インストール時に先読みして、初回からオフラインでも開けるようにする
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// インストール時：必須をキャッシュ ＋ 即座に適用準備
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

// アクティベート時：古い版のキャッシュを自動削除 ＋ 画面の制御開始
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ネットワーク優先（Network First）：常に最新を取得し、オフライン時のみキャッシュを利用
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

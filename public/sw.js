// Minimal offline-support service worker.
// Caches the app shell + visited note pages so previously opened notes
// remain readable without a connection. Static-first strategy: build
// assets are cache-busted by Next.js filenames, so caching them
// aggressively is safe; HTML pages use network-first so edits show up
// as soon as you're back online.

const CACHE = "restik-notes-v1";
const APP_SHELL = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStaticAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");

  if (isStaticAsset) {
    // Cache-first for immutable build assets.
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Network-first for pages/API so content stays fresh; fall back to
  // cache (previously visited note pages) when offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});

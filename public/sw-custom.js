// RadShield-MX Service Worker — Offline cache + background sync
const CACHE_NAME = 'radshield-mx-v12-1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install: cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls (tRPC)
  if (request.url.includes('/trpc')) {
    return; // Let network handle API calls
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed — return cached if available
        return cached || new Response('Offline', { status: 503 });
      });

      // Return cached immediately, refresh in background
      return cached || fetchPromise;
    })
  );
});

// Background sync for MC jobs
self.addEventListener('sync', (event) => {
  if (event.tag === 'radshield-mc-sync') {
    event.waitUntil(syncPendingMCJobs());
  }
});

async function syncPendingMCJobs() {
  // Notify all clients to sync pending MC jobs
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_MC_JOBS' });
  }
}

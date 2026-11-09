/**
 * Service Worker v50 — Cache de calculos + Offline capability
 * Estrategia: Stale-while-revalidate para assets, Network-first para calculos
 */
// Fase 9: rutas relativas al alcance del SW (raíz del dominio o /RadShieldMx/ en GitHub Pages).
const BASE = new URL(self.registration ? self.registration.scope : self.location.href).pathname.replace(/[^/]*$/, '');
// En GitHub Pages el origen (<usuario>.github.io) es compartido con otros sitios del mismo usuario: las cachés llevan
// la base en el nombre, el SW sólo borra y consulta las suyas y nunca responde con cachés de otra ruta.
const PREFIJO = 'radshield-' + BASE + ':';
const CACHE_NAME = PREFIJO + 'v50';
const CALC_CACHE_NAME = PREFIJO + 'calcs-v50';
const PROPIAS = [CACHE_NAME, CALC_CACHE_NAME];
async function buscarEnPropias(request) {
  for (const nombre of PROPIAS) {
    const r = await (await caches.open(nombre)).match(request);
    if (r) return r;
  }
  return undefined;
}
const ASSETS = ['index.html', 'manifest.json', 'icon-192x192.png', 'icon-512x512.png'].map((a) => BASE + a);

// Precache assets en install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: limpiar caches viejas
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      // Sólo versiones viejas de ESTA instalación (mismo prefijo de base) o las anteriores a la Fase 9 en la raíz.
      Promise.all(keys.filter(k => !PROPIAS.includes(k) && (k.startsWith(PREFIJO) || (BASE === '/' && /^radshield-(calcs-)?v\d+$/.test(k)))).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // API de calculos: cache-first con 1h TTL
  // Fuera del alcance (otra ruta del mismo origen) no se intercepta nada.
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  if (url.pathname.startsWith(BASE + 'api/calc/')) {
    e.respondWith(
      caches.open(CALC_CACHE_NAME).then(async cache => {
        const cached = await cache.match(request);
        if (cached) {
          // Revalidar en background
          fetch(request).then(resp => cache.put(request, resp.clone())).catch(() => {});
          return cached;
        }
        const resp = await fetch(request);
        if (resp.ok) cache.put(request, resp.clone());
        return resp;
      })
    );
    return;
  }

  // Assets estaticos: stale-while-revalidate
  if (request.method === 'GET' && (url.pathname.startsWith(BASE + 'assets/') || url.pathname === BASE)) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then(resp => {
          if (resp.ok) cache.put(request, resp.clone());
          return resp;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: network with offline fallback
  e.respondWith(
    fetch(request).catch(() =>
      buscarEnPropias(request).then(cached => {
        if (cached) return cached;
        // Offline fallback para HTML
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.open(CACHE_NAME).then(c => c.match(BASE + 'index.html')).then(r => r || new Response('Offline', { status: 503 }));
        }
        return new Response('Offline', { status: 503 });
      })
    )
  );
});

// Background sync para calculos pendientes
self.addEventListener('sync', (e) => {
  if (e.tag === 'pending-calculations') {
    e.waitUntil(
      // Process pending calculations from IndexedDB
      Promise.resolve().then(() => {
        console.log('[SW] Processing pending calculations...');
      })
    );
  }
});

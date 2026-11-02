/* Offline application shell only. Never cache public API responses or map tiles. */
const CACHE = 'lbf-shell-v1.0.0';
const SHELL = ['/', '/index.html', '/css/main.css', '/css/layout.css', '/css/components.css', '/css/dashboard.css', '/css/search.css', '/css/map.css', '/css/responsive.css', '/assets/icons/sprite.svg', '/assets/icons/favicon.svg', '/assets/vendor/leaflet/leaflet.js', '/assets/vendor/leaflet/leaflet.css', '/assets/vendor/leaflet/images/marker-icon.png', '/assets/vendor/leaflet/images/marker-shadow.png', '/assets/vendor/markercluster/leaflet.markercluster.js', '/assets/vendor/markercluster/MarkerCluster.css', '/assets/vendor/markercluster/MarkerCluster.Default.css', '/js/app.js', '/js/config/settings.js', '/js/core/events.js', '/js/core/state.js', '/js/core/router.js', '/js/core/storage.js', '/js/database/indexeddb.js', '/js/services/http.js', '/js/services/cache.js', '/js/services/nominatim.service.js', '/js/services/overpass.service.js', '/js/services/osm.service.js', '/js/services/commons.service.js', '/js/services/search-service.js', '/js/utils/helpers.js', '/js/utils/validators.js', '/js/utils/formatters.js', '/js/utils/deduplication.js', '/js/modules/ui.js', '/js/modules/dashboard.js', '/js/modules/search.js', '/js/modules/results.js', '/js/modules/map.js', '/js/modules/company-details.js', '/js/modules/favorites.js', '/js/modules/history.js', '/js/modules/settings.js', '/js/modules/export.js'];
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('lbf-shell-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Network first keeps development updates fresh; cached shell works without Internet.
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && !url.pathname.startsWith('/docs/')) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy))); }
    return response;
  }).catch(async () => (await caches.match(event.request)) || (event.request.mode === 'navigate' ? caches.match('/index.html') : Response.error())));
});

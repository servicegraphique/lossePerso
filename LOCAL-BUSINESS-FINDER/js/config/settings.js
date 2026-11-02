export const SETTINGS = Object.freeze({
  appName: 'Local Business Finder',
  version: '1.0.0',
  pageSize: 6,
  maxResults: 100,
  historyLimit: 50,
  recentLimit: 20,
  cacheLimit: 100,
  geocodeCacheMs: 7 * 24 * 60 * 60 * 1000,
  searchCacheMs: 24 * 60 * 60 * 1000,
  defaultRadius: 5000,
  defaultCenter: [-18.8792, 47.5079],
  endpoints: {
    nominatim: 'https://nominatim.openstreetmap.org/search',
    overpass: 'https://overpass-api.de/api/interpreter',
    commons: 'https://commons.wikimedia.org/w/api.php',
    tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
});

export const ACTIVITIES = Object.freeze({
  bakery: { label: 'Boulangerie', selector: '["shop"="bakery"]' },
  restaurant: { label: 'Restaurant', selector: '["amenity"="restaurant"]' },
  pharmacy: { label: 'Pharmacie', selector: '["amenity"="pharmacy"]' },
  hotel: { label: 'Hôtel', selector: '["tourism"="hotel"]' },
  bank: { label: 'Banque', selector: '["amenity"="bank"]' },
  office: { label: 'Bureau / entreprise', selector: '["office"]' },
  shop: { label: 'Commerce', selector: '["shop"]' },
  health: { label: 'Santé', selector: '["healthcare"]' },
});

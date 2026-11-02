import { SETTINGS } from '../config/settings.js';
import { requestJson } from './http.js';
import { cached } from './cache.js';
import { validCoordinates } from '../utils/validators.js';

export async function geocode(criteria, signal) {
  const params = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', extratags: '1', limit: '1', 'accept-language': 'fr' });
  if (criteria.address) params.set('q', [criteria.address, criteria.postcode, criteria.city, criteria.country].filter(Boolean).join(', '));
  else {
    if (criteria.city) params.set('city', criteria.city);
    if (criteria.postcode) params.set('postalcode', criteria.postcode);
    if (criteria.country) params.set('country', criteria.country);
  }
  const key = `geocode:${params.toString()}`;
  return cached(key, SETTINGS.geocodeCacheMs, async () => {
    const places = await requestJson(`${SETTINGS.endpoints.nominatim}?${params}`, { signal, minInterval: 1100 });
    if (!Array.isArray(places)) throw new Error('Réponse de géolocalisation invalide.');
    const place = places[0];
    if (!place || !validCoordinates(place.lat, place.lon)) return null;
    return { lat: Number(place.lat), lng: Number(place.lon), osmType: place.osm_type, osmId: Number(place.osm_id), label: place.display_name, importance: place.importance };
  });
}

export async function searchByName(criteria, signal) {
  const params = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', extratags: '1', limit: '30', 'accept-language': 'fr', q: [criteria.name, criteria.country].filter(Boolean).join(', ') });
  return cached(`nominatim:${params}`, SETTINGS.searchCacheMs, async () => {
    const data = await requestJson(`${SETTINGS.endpoints.nominatim}?${params}`, { signal, minInterval: 1100 });
    if (!Array.isArray(data)) throw new Error('Réponse de recherche invalide.');
    return data;
  });
}

import { SETTINGS } from '../config/settings.js';
import { requestJson } from './http.js';
import { buildOverpassQuery } from './osm.service.js';
export async function queryBusinesses(criteria, location, signal) {
  const query = buildOverpassQuery(criteria, location, SETTINGS.maxResults);
  const data = await requestJson(SETTINGS.endpoints.overpass, { method: 'POST', body: new URLSearchParams({ data: query }), signal, timeout: 35000, minInterval: 1200 });
  if (!Array.isArray(data?.elements)) throw new Error('La réponse OpenStreetMap est invalide. Aucun résultat fictif ne lui a été substitué.');
  return { elements: data.elements, remark: data.remark || '' };
}

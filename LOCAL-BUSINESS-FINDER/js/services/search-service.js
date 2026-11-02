import { SETTINGS } from '../config/settings.js';
import { validateSearch } from '../utils/validators.js';
import { distanceKm } from '../utils/helpers.js';
import { deduplicate } from '../utils/deduplication.js';
import { geocode, searchByName } from './nominatim.service.js';
import { queryBusinesses } from './overpass.service.js';
import { normalizeOsmElement, normalizeNominatimPlace, isBusinessPlace } from './osm.service.js';
import { cached } from './cache.js';

export async function findBusinesses(input, signal) {
  const { valid, criteria, errors } = validateSearch(input);
  if (!valid) throw new Error(Object.values(errors)[0]);
  const result = await cached(`search:v1:${JSON.stringify(criteria)}`, SETTINGS.searchCacheMs, async () => {
    let companies = [], origin = null, warning = '', provider = 'OpenStreetMap · Overpass';
    const hasLocation = Boolean(criteria.city || criteria.postcode || criteria.address);
    if (hasLocation) {
      const located = await geocode(criteria, signal);
      if (!located.value) return { companies, origin, warning: 'Localisation introuvable. Vérifiez la ville, le code postal et le pays.', provider, fromCache: located.cached };
      origin = located.value;
      const response = await queryBusinesses(criteria, origin, signal);
      companies = response.elements.map((element) => normalizeOsmElement(element)).filter(Boolean);
      if (response.remark) warning = 'Le service a limité ou interrompu cette recherche. Les résultats peuvent être incomplets.';
      if (origin.osmType === 'node') warning ||= 'Recherche dans un rayon de 5 km autour du point de référence trouvé, et non sur toute la ville.';
    } else {
      provider = 'OpenStreetMap · Nominatim';
      const response = await searchByName(criteria, signal);
      const businesses = response.value.filter(isBusinessPlace);
      companies = businesses.map((place) => normalizeNominatimPlace(place)).filter(Boolean);
      if (!companies.length && response.value.length) warning = 'Des lieux portent ce nom, mais aucun établissement correspondant n’a été identifié. Ajoutez une ville pour préciser la recherche.';
    }
    return { companies: deduplicate(companies).slice(0, SETTINGS.maxResults), origin, warning, provider, fromCache: false };
  });
  const companies = result.value.companies.map((company) => ({ ...company, distanceKm: result.value.origin ? distanceKm(result.value.origin, company) : null }));
  return { ...result.value, companies, criteria, fromCache: result.cached };
}

import { validCoordinates } from '../utils/validators.js';
import { safeUrl } from '../utils/helpers.js';
import { ACTIVITIES } from '../config/settings.js';

export function escapeOverpassRegex(value) {
  return String(value).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&').replace(/"/g, '\\"');
}

export function buildOverpassQuery(criteria, location, limit = 100) {
  const relationArea = location.osmType === 'relation' || location.osmType === 'way';
  const areaId = Number(location.osmId) + (location.osmType === 'relation' ? 3600000000 : 2400000000);
  const scope = relationArea ? `(area.${areaId})` : '';
  const area = relationArea ? `area(${areaId})->.searchArea;` : '';
  const around = relationArea ? 'area.searchArea' : `around:5000,${Number(location.lat)},${Number(location.lng)}`;
  const activity = ACTIVITIES[criteria.activity];
  const selectors = activity ? [activity.selector] : ['["shop"]', '["office"]', '["craft"]', '["healthcare"]', '["amenity"~"^(restaurant|cafe|fast_food|bar|pharmacy|bank|cinema|fuel|clinic|hospital|doctors|dentist|veterinary)$"]', '["tourism"~"^(hotel|guest_house|museum|gallery)$"]'];
  const name = criteria.name ? `["name"~"${escapeOverpassRegex(criteria.name)}",i]` : '';
  const statements = selectors.map((selector) => `nwr["name"]${name}${selector}(${around});`).join('');
  return `[out:json][timeout:25];${area}(${statements});out center ${Math.min(100, Math.max(1, limit))};`;
}

export function normalizeOsmElement(element, retrievedAt = new Date().toISOString()) {
  const tags = element.tags || {};
  const lat = Number(element.lat ?? element.center?.lat), lng = Number(element.lon ?? element.center?.lon);
  if (!['node', 'way', 'relation'].includes(element.type) || !Number.isSafeInteger(Number(element.id)) || !tags.name || !validCoordinates(lat, lng)) return null;
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const activityKey = Object.entries(ACTIVITIES).find(([, value]) => {
    const match = value.selector.match(/\["([^"]+)"(?:="([^"]+)")?\]/);
    return match && tags[match[1]] && (!match[2] || tags[match[1]] === match[2]);
  })?.[0];
  const image = safeUrl(tags.image, ['https:']);
  const commons = /^File:/i.test(tags.wikimedia_commons || '') ? tags.wikimedia_commons : '';
  return {
    id: `${element.type}/${element.id}`, osmType: element.type, osmId: Number(element.id),
    name: String(tags.name), address: street, postcode: tags['addr:postcode'] || '', city: tags['addr:city'] || '',
    country: tags['addr:country'] || '', lat, lng, phone: tags.phone || tags['contact:phone'] || '',
    website: safeUrl(tags.website || tags['contact:website']), openingHours: tags.opening_hours || '',
    activity: activityKey ? ACTIVITIES[activityKey].label : (tags.shop ? `Commerce · ${tags.shop}` : tags.office ? `Bureau · ${tags.office}` : tags.amenity ? `Service · ${tags.amenity}` : tags.craft ? `Artisanat · ${tags.craft}` : tags.healthcare ? `Santé · ${tags.healthcare}` : tags.tourism ? `Tourisme · ${tags.tourism}` : 'Activité non précisée'),
    precision: element.type === 'node' ? 'Point OSM · précision non garantie' : 'Centre de l’emprise OSM · position approximative',
    source: 'OpenStreetMap · Overpass', sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    retrievedAt, image, commons, tags: Object.fromEntries(Object.entries(tags).filter(([key]) => /^(name|addr:|phone|contact:|website|opening_hours|shop|office|amenity|craft|healthcare|tourism|image|wikimedia_commons)/.test(key))),
  };
}

export function normalizeNominatimPlace(place, retrievedAt = new Date().toISOString()) {
  const type = { N: 'node', W: 'way', R: 'relation' }[place.osm_type] || place.osm_type;
  const company = normalizeOsmElement({ type, id: place.osm_id, lat: place.lat, lon: place.lon, tags: { name: place.name || place.display_name?.split(',')[0], ...(place.extratags || {}), 'addr:housenumber': place.address?.house_number, 'addr:street': place.address?.road, 'addr:postcode': place.address?.postcode, 'addr:city': place.address?.city || place.address?.town || place.address?.village, 'addr:country': place.address?.country_code?.toUpperCase() } }, retrievedAt);
  if (!company) return null;
  return { ...company, source: 'OpenStreetMap · Nominatim', precision: 'Point de géocodage Nominatim · précision non garantie' };
}

export function isBusinessPlace(place) {
  return ['shop', 'amenity', 'office', 'craft', 'healthcare', 'tourism', 'leisure'].includes(place.class) || ['commercial', 'retail', 'office'].includes(place.type);
}

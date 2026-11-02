import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSearch, normalizeCriteria, validCoordinates } from '../js/utils/validators.js';
import { escapeHtml, safeUrl, distanceKm } from '../js/utils/helpers.js';
import { csvCell, toCsv, fullAddress } from '../js/utils/formatters.js';
import { deduplicate, sortAndFilter } from '../js/utils/deduplication.js';
import { buildOverpassQuery, escapeOverpassRegex, normalizeOsmElement, normalizeNominatimPlace, isBusinessPlace } from '../js/services/osm.service.js';

// Synthetic fixtures for assertions only. Never loaded by the application.
const node = { type: 'node', id: 1, lat: 48.85, lon: 2.35, tags: { name: 'Épicerie <test>', shop: 'bakery', 'addr:street': 'Rue de Test', 'addr:housenumber': '12', 'addr:postcode': '75001', 'addr:city': 'Paris', phone: '+33 1 00 00 00 00', website: 'javascript:alert(1)' } };

test('criteria normalize and combine without mutating input', () => {
  const input = { name: '  Test  ', city: 'Paris', activity: 'bakery' };
  const result = validateSearch(input);
  assert.equal(result.valid, true); assert.equal(result.criteria.name, 'Test'); assert.equal(input.name, '  Test  ');
  assert.equal(normalizeCriteria().country, '');
});
test('empty, activity-only, country-only and malformed postal searches are rejected', () => {
  assert.equal(validateSearch({}).valid, false);
  assert.equal(validateSearch({ activity: 'bakery' }).valid, false);
  assert.equal(validateSearch({ country: 'France' }).valid, false);
  assert.equal(validateSearch({ postcode: '<bad!>' }).valid, false);
  assert.equal(validateSearch({ postcode: 'SW1A 1AA', country: 'United Kingdom' }).valid, true);
});
test('coordinates reject NaN, out-of-range and null island', () => {
  assert.equal(validCoordinates(48.85, 2.35), true); assert.equal(validCoordinates('48.85', '2.35'), true);
  for (const [lat, lng] of [[NaN, 2], [91, 2], [0, 0], [48, 181]]) assert.equal(validCoordinates(lat, lng), false);
});
test('HTML and dangerous URL protocols are neutralized', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(safeUrl('javascript:alert(1)'), ''); assert.equal(safeUrl('data:text/html,test'), '');
  assert.equal(safeUrl('https://example.org/a'), 'https://example.org/a');
});
test('OSM normalization preserves missing fields and blocks unsafe website', () => {
  const company = normalizeOsmElement(node, '2026-01-01T00:00:00Z');
  assert.equal(company.id, 'node/1'); assert.equal(company.address, '12 Rue de Test'); assert.equal(company.website, '');
  assert.equal(company.openingHours, ''); assert.equal(company.activity, 'Boulangerie');
  assert.match(company.precision, /précision non garantie/); assert.equal(company.sourceUrl, 'https://www.openstreetmap.org/node/1');
});
test('way centroid is explicitly approximate, invalid records are rejected', () => {
  const company = normalizeOsmElement({ type: 'way', id: 2, center: { lat: 48, lon: 2 }, tags: { name: 'Test', office: 'company' } });
  assert.match(company.precision, /approximative/); assert.equal(company.address, '');
  assert.equal(normalizeOsmElement({ ...node, lat: 100 }), null); assert.equal(normalizeOsmElement({ ...node, tags: {} }), null);
});
test('Nominatim attribution is distinct from Overpass', () => {
  const company = normalizeNominatimPlace({ osm_type: 'node', osm_id: 1, lat: 48, lon: 2, name: 'Test', extratags: { shop: 'bakery' }, address: { country_code: 'fr' } });
  assert.match(company.source, /Nominatim/); assert.equal(company.country, 'FR');
  assert.equal(isBusinessPlace({ class: 'place', type: 'city' }), false); assert.equal(isBusinessPlace({ class: 'shop', type: 'bakery' }), true);
});
test('Overpass name cannot inject query syntax', () => {
  const query = buildOverpassQuery({ name: 'Test"];out body;["x', activity: 'bakery' }, { osmType: 'relation', osmId: 123 });
  assert.ok(query.includes('area(3600000123)')); assert.ok(query.includes('\\"')); assert.ok(query.endsWith('out center 100;'));
  assert.equal(escapeOverpassRegex('A(b)+.*'), 'A\\(b\\)\\+\\.\\*');
});
test('node reference uses bounded around query, not city boundary', () => {
  const query = buildOverpassQuery({ activity: 'pharmacy' }, { osmType: 'node', osmId: 1, lat: 48, lng: 2 });
  assert.ok(query.includes('(around:5000,48,2)')); assert.ok(!query.includes('area('));
});
test('deduplication uses source IDs and filters/sorts without mutation', () => {
  const companies = [{ id: 'node/1', name: 'Zinc', city: 'Paris', phone: '', website: '' }, { id: 'node/2', name: 'Alpha', city: 'Lyon', phone: '123', website: '' }];
  assert.equal(deduplicate([...companies, companies[0]]).length, 2);
  assert.equal(sortAndFilter(companies, { sort: 'name' })[0].name, 'Alpha'); assert.equal(companies[0].name, 'Zinc');
  assert.equal(sortAndFilter(companies, { filter: 'contact' }).length, 1); assert.equal(sortAndFilter(companies, { query: 'lyon' }).length, 1);
});
test('distance is finite and zero at identical coordinates', () => { assert.equal(distanceKm({ lat: 48, lng: 2 }, { lat: 48, lng: 2 }), 0); assert.ok(distanceKm({ lat: 48, lng: 2 }, { lat: 49, lng: 2 }) > 110); assert.equal(distanceKm(null, {}), null); });
test('CSV escapes quotes and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell('=1+1'), '"\'=1+1"'); assert.equal(csvCell('+cmd'), '"\'+cmd"'); assert.equal(csvCell('a"b'), '"a""b"');
  const csv = toCsv([normalizeOsmElement(node)]); assert.ok(csv.startsWith('\uFEFF')); assert.ok(csv.includes('Latitude')); assert.ok(csv.includes('48.85'));
});
test('missing address is explicit, never replaced by map center', () => { assert.equal(fullAddress({}), 'Adresse complète non disponible'); });

import test from 'node:test';
import assert from 'node:assert/strict';
import { requestJson } from '../js/services/http.js';
import { findBusinesses } from '../js/services/search-service.js';

const place = { osm_type: 'relation', osm_id: 71525, lat: '48.8566', lon: '2.3522', display_name: 'Paris, France' };
const element = { type: 'node', id: 123, lat: 48.85, lon: 2.35, tags: { name: 'Établissement de test', shop: 'bakery', 'addr:city': 'Paris' } };

test('HTTP 429 is surfaced without automatic retry', async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('', { status: 429 }); };
  try { await assert.rejects(requestJson('https://example.org/limited', { minInterval: 0 }), /limite gratuite/); assert.equal(calls, 1); }
  finally { globalThis.fetch = original; }
});
test('HTTP requests on same host are serialized', async () => {
  const original = globalThis.fetch; let active = 0, max = 0;
  globalThis.fetch = async () => { active++; max = Math.max(max, active); await new Promise((r) => setTimeout(r, 15)); active--; return Response.json({ ok: true }); };
  try { await Promise.all([1, 2, 3].map((n) => requestJson(`https://example.org/${n}`, { minInterval: 0 }))); assert.equal(max, 1); }
  finally { globalThis.fetch = original; }
});
test('combined search uses real provider adapters, deduplicates and labels cache', async () => {
  const original = globalThis.fetch; const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push(String(url));
    if (String(url).includes('nominatim')) return Response.json([place]);
    return Response.json({ elements: [element, element, { ...element, id: 124 }] });
  };
  try {
    const criteria = { name: 'Établissement', city: 'Paris', country: 'France', activity: 'bakery' };
    const result = await findBusinesses(criteria);
    assert.equal(result.companies.length, 2); assert.equal(result.fromCache, false); assert.equal(calls.length, 2);
    assert.ok(calls[1].includes('overpass')); assert.ok(result.companies[0].distanceKm > 0);
    const again = await findBusinesses(criteria); assert.equal(again.fromCache, true); assert.equal(calls.length, 2);
  } finally { globalThis.fetch = original; }
});
test('unknown location yields an honest empty result', async () => {
  const original = globalThis.fetch; globalThis.fetch = async () => Response.json([]);
  try { const result = await findBusinesses({ city: 'LieuInexistantDeTest' }); assert.equal(result.companies.length, 0); assert.match(result.warning, /introuvable/); }
  finally { globalThis.fetch = original; }
});
test('malformed provider response is not replaced with fabricated results', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => String(url).includes('nominatim') ? Response.json([place]) : Response.json({ elements: null });
  try { await assert.rejects(findBusinesses({ city: 'VilleDeTestInvalide' }), /invalide/); }
  finally { globalThis.fetch = original; }
});

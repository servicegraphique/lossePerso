import { database } from '../database/indexeddb.js';
import { SETTINGS } from '../config/settings.js';
export async function cached(key, ttl, loader) {
  try {
    const entry = await database.get('cache', key);
    if (entry && entry.expires > Date.now()) return { value: entry.value, cached: true };
  } catch { /* A cache failure must not prevent a live request. */ }
  const value = await loader();
  try {
    await database.put('cache', { key, value, expires: Date.now() + ttl });
    const entries = await database.all('cache');
    const now = Date.now();
    for (const entry of entries) if (entry.expires < now) await database.remove('cache', entry.key);
    const fresh = entries.filter((entry) => entry.expires >= now).sort((a, b) => a.expires - b.expires);
    for (const entry of fresh.slice(0, Math.max(0, fresh.length - SETTINGS.cacheLimit))) await database.remove('cache', entry.key);
  } catch { /* Private browsing / quota: live results still work. */ }
  return { value, cached: false };
}

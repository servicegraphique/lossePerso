import { database } from '../database/indexeddb.js';
import { store } from './state.js';
import { SETTINGS } from '../config/settings.js';
import { uid } from '../utils/helpers.js';
import { validCoordinates, normalizeCriteria } from '../utils/validators.js';

export function isCompany(value) {
  return value && typeof value.id === 'string' && typeof value.name === 'string' && validCoordinates(value.lat, value.lng) && typeof value.source === 'string';
}
export const storage = {
  async init() {
    const persistent = await database.init();
    const [favorites, history, recent, cache] = await Promise.all(['favorites', 'history', 'recent', 'cache'].map((name) => database.all(name)));
    store.set({ persistent, favorites: favorites.filter(isCompany), history: history.filter((item) => item?.criteria && item?.id).sort((a, b) => b.date.localeCompare(a.date)), recent: recent.filter(isCompany).sort((a, b) => b.viewedAt.localeCompare(a.viewedAt)), storageCount: cache.length });
  },
  async toggleFavorite(company) {
    if (!isCompany(company)) throw new Error('Fiche invalide : enregistrement impossible.');
    const exists = store.get().favorites.some((item) => item.id === company.id);
    if (exists) await database.remove('favorites', company.id);
    else await database.put('favorites', { ...company, savedAt: new Date().toISOString() });
    const favorites = await database.all('favorites');
    store.set({ favorites: favorites.filter(isCompany) });
    return !exists;
  },
  async removeFavorite(id) { await database.remove('favorites', id); store.set({ favorites: store.get().favorites.filter((item) => item.id !== id) }); },
  async rememberView(company) {
    if (!isCompany(company)) return;
    await database.put('recent', { ...company, viewedAt: new Date().toISOString() });
    let recent = (await database.all('recent')).filter(isCompany).sort((a, b) => b.viewedAt.localeCompare(a.viewedAt));
    for (const item of recent.slice(SETTINGS.recentLimit)) await database.remove('recent', item.id);
    store.set({ recent: recent.slice(0, SETTINGS.recentLimit) });
  },
  async rememberSearch(criteria, count) {
    const item = { id: uid(), criteria: normalizeCriteria(criteria), count, date: new Date().toISOString() };
    await database.put('history', item);
    const history = (await database.all('history')).filter((entry) => entry?.id && entry?.criteria).sort((a, b) => b.date.localeCompare(a.date));
    for (const entry of history.slice(SETTINGS.historyLimit)) await database.remove('history', entry.id);
    store.set({ history: history.slice(0, SETTINGS.historyLimit) });
  },
  async deleteHistory(id) { await database.remove('history', id); store.set({ history: store.get().history.filter((item) => item.id !== id) }); },
  async clearHistory() { await database.clear('history'); store.set({ history: [] }); },
  async clearCache() { await database.clear('cache'); store.set({ storageCount: 0 }); },
  async refreshCacheCount() { store.set({ storageCount: (await database.all('cache')).length }); },
  async clearAll() { await database.clearAll(); store.set({ favorites: [], history: [], recent: [], results: [], criteria: null, searched: false, origin: null, selectedId: null, storageCount: 0 }); },
  async getPhotos(id) { const record = await database.get('photos', id); return Array.isArray(record?.photos) ? record.photos.filter((photo) => photo?.blob instanceof Blob) : []; },
  async addPhoto(id, blob, name) {
    const photos = await this.getPhotos(id);
    if (photos.length >= 5) throw new Error('Maximum de 5 photos personnelles par fiche.');
    photos.push({ id: uid(), blob, name, addedAt: new Date().toISOString() });
    await database.put('photos', { id, photos });
  },
  async removePhoto(companyId, photoId) { await database.put('photos', { id: companyId, photos: (await this.getPhotos(companyId)).filter((photo) => photo.id !== photoId) }); },
};

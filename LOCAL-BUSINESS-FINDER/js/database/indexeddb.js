const DB_NAME = 'local-business-finder';
const STORES = ['favorites', 'history', 'recent', 'cache', 'photos', 'settings'];
let dbPromise;
let memoryMode = false;
const memory = new Map(STORES.map((name) => [name, new Map()]));

function open() {
  if (memoryMode) return Promise.resolve(null);
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('IndexedDB indisponible'));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      for (const name of STORES) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: name === 'cache' || name === 'settings' ? 'key' : 'id' });
    };
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Base ouverte dans une autre version. Fermez les autres onglets.'));
  }).catch((error) => { memoryMode = true; dbPromise = null; throw error; });
  return dbPromise;
}

async function transaction(store, mode, action) {
  const db = await open();
  if (!db) {
    const map = memory.get(store);
    if (mode === 'readwrite' && action === 'clear') map.clear();
    return action === 'all' ? [...map.values()] : undefined;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const objectStore = tx.objectStore(store);
    const request = typeof action === 'function' ? action(objectStore) : objectStore[action]();
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error || request?.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction annulée'));
  });
}

export const database = {
  get isMemory() { return memoryMode; },
  async init() { try { await open(); } catch { /* The application remains usable, with a visible warning. */ } return !memoryMode; },
  async all(store) {
    if (memoryMode) return [...memory.get(store).values()];
    try { return await transaction(store, 'readonly', 'getAll'); }
    catch { memoryMode = true; return [...memory.get(store).values()]; }
  },
  async get(store, key) {
    if (memoryMode) return memory.get(store).get(key);
    return transaction(store, 'readonly', (s) => s.get(key));
  },
  async put(store, value) {
    if (memoryMode) { memory.get(store).set(value[store === 'cache' || store === 'settings' ? 'key' : 'id'], value); return; }
    try { await transaction(store, 'readwrite', (s) => s.put(value)); }
    catch (error) { if (error?.name === 'QuotaExceededError') throw new Error('Stockage plein. Supprimez des photos ou des données dans les paramètres.'); throw error; }
  },
  async remove(store, key) {
    if (memoryMode) { memory.get(store).delete(key); return; }
    await transaction(store, 'readwrite', (s) => s.delete(key));
  },
  async clear(store) {
    if (memoryMode) memory.get(store).clear();
    else await transaction(store, 'readwrite', 'clear');
  },
  async clearAll() { for (const store of STORES) await this.clear(store); },
};

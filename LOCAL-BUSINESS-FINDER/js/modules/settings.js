import { store } from '../core/state.js';
import { storage } from '../core/storage.js';
import { SETTINGS } from '../config/settings.js';
import { icon, toast, confirmAction } from './ui.js';
export const settings = {
  init() {
    document.querySelector('#clear-cache').addEventListener('click', async () => { try { await storage.clearCache(); toast('Cache supprimé. Les favoris et photos sont conservés.'); } catch (error) { toast(error.message, 'error'); } });
    document.querySelector('#clear-all').addEventListener('click', async () => {
      if (!confirmAction('Supprimer définitivement les favoris, photos personnelles, recherches, fiches récentes et cache de cet ordinateur ?')) return;
      try { await storage.clearAll(); toast('Toutes les données locales ont été supprimées.'); } catch (error) { toast(error.message, 'error'); }
    });
  },
  render() {
    const state = store.get();
    document.querySelector('#storage-mode').textContent = state.persistent ? 'IndexedDB · stockage persistant local' : 'Mémoire temporaire · stockage indisponible';
    document.querySelector('#storage-mode').classList.toggle('danger-text', !state.persistent);
    document.querySelector('#storage-favorites').textContent = state.favorites.length;
    document.querySelector('#storage-history').textContent = state.history.length;
    document.querySelector('#storage-cache').textContent = state.storageCount;
    document.querySelector('#app-version').textContent = SETTINGS.version;
  },
};

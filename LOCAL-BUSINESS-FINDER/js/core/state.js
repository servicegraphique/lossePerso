import { events } from './events.js';
const state = {
  route: 'dashboard', results: [], favorites: [], history: [], recent: [], criteria: null,
  loading: false, error: '', warning: '', searched: false, page: 1, sort: 'relevance',
  filter: 'all', resultQuery: '', selectedId: null, origin: null, online: navigator.onLine,
  persistent: true, fromCache: false, storageCount: 0,
};
export const store = {
  get: () => state,
  set(patch) { Object.assign(state, patch); events.emit('state:changed', state); },
};

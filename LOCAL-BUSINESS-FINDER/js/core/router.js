import { store } from './state.js';
import { events } from './events.js';
const routes = new Set(['dashboard', 'search', 'map', 'favorites', 'history', 'settings']);
export const router = {
  init() {
    const update = () => {
      const requested = location.hash.replace(/^#\/?/, '') || 'dashboard';
      const route = routes.has(requested) ? requested : 'dashboard';
      store.set({ route });
      events.emit('route:changed', route);
    };
    window.addEventListener('hashchange', update); update();
  },
  go(route) {
    if (!routes.has(route)) return;
    if (location.hash === `#${route}`) { store.set({ route }); events.emit('route:changed', route); }
    else location.hash = route;
  },
};

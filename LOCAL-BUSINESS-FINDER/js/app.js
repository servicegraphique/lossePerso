import { store } from './core/state.js';
import { events } from './core/events.js';
import { router } from './core/router.js';
import { storage } from './core/storage.js';
import { dashboard } from './modules/dashboard.js';
import { search, activityOptions } from './modules/search.js';
import { results, filteredResults } from './modules/results.js';
import { businessMap } from './modules/map.js';
import { details } from './modules/company-details.js';
import { favorites } from './modules/favorites.js';
import { history } from './modules/history.js';
import { settings } from './modules/settings.js';
import { exportData } from './modules/export.js';
import { toast, confirmAction } from './modules/ui.js';

const titles = { dashboard: 'Tableau de bord', search: 'Rechercher une entreprise', map: 'Carte interactive', favorites: 'Mes favoris', history: 'Historique', settings: 'Paramètres' };
function renderRoute(route) {
  document.querySelectorAll('.page').forEach((page) => { page.hidden = page.id !== `page-${route === 'map' ? 'search' : route}`; });
  document.querySelectorAll('[data-nav]').forEach((link) => { const active = link.dataset.nav === route; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  document.querySelector('#page-search').classList.toggle('map-full', route === 'map');
  document.querySelector('#breadcrumb-current').textContent = titles[route];
  document.querySelector('#search-title').textContent = route === 'map' ? 'Un nouveau point de vue sur vos découvertes.' : 'Où commence votre prochaine découverte ?';
  document.title = `${titles[route]} — Local Business Finder`;
  closeMenu();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function render() {
  const state = store.get();
  dashboard.render(); results.render(); favorites.render(); history.render(); settings.render(); search.renderStatus();
  document.querySelector('#storage-warning').hidden = state.persistent;
  if (document.querySelector('#company-dialog').open) details.renderActions();
}
function closeMenu() { document.querySelector('#sidebar').classList.remove('open'); document.querySelector('#sidebar-backdrop').classList.remove('visible'); document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false'); }
function updateConnection() {
  store.set({ online: navigator.onLine });
  const badge = document.querySelector('#connection-status');
  badge.innerHTML = `<span class="tiny-dot"></span>${navigator.onLine ? 'Connecté' : 'Hors connexion'}`;
  badge.classList.toggle('offline', !navigator.onLine);
  badge.title = navigator.onLine ? 'Réseau détecté ; les services publics peuvent rester indisponibles.' : 'Vos favoris et fiches récentes restent consultables.';
}

async function init() {
  document.querySelector('#activity-select').innerHTML = activityOptions();
  await storage.init();
  search.init(); results.init(); businessMap.init(); details.init(); settings.init();
  events.on('state:changed', render);
  events.on('route:changed', renderRoute);
  document.querySelector('#cancel-search').addEventListener('click', () => search.cancel());
  document.querySelector('#export-csv').addEventListener('click', () => exportData.run(filteredResults(), 'csv'));
  document.querySelector('#export-json').addEventListener('click', () => exportData.run(filteredResults(), 'json'));
  document.querySelector('#export-favorites').addEventListener('click', () => exportData.run(favorites.render(), 'json'));
  document.querySelector('#favorites-search').addEventListener('input', () => favorites.render());
  document.querySelector('#clear-favorites').addEventListener('click', async () => {
    if (!confirmAction('Retirer toutes les fiches des favoris ? Les photos personnelles seront conservées.')) return;
    try { for (const company of store.get().favorites) await storage.removeFavorite(company.id); toast('Favoris supprimés.'); } catch (error) { toast(error.message, 'error'); }
  });
  document.querySelector('#clear-history').addEventListener('click', async () => { if (confirmAction('Effacer toutes les recherches de l’historique ?')) { try { await storage.clearHistory(); toast('Historique effacé.'); } catch (error) { toast(error.message, 'error'); } } });
  document.querySelector('#menu-toggle').addEventListener('click', () => { const open = document.querySelector('#sidebar').classList.toggle('open'); document.querySelector('#sidebar-backdrop').classList.toggle('visible', open); document.querySelector('#menu-toggle').setAttribute('aria-expanded', String(open)); });
  document.querySelector('#sidebar-backdrop').addEventListener('click', closeMenu);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]'); if (!button) return;
    const { action, id, route, photo } = button.dataset;
    try {
      if (action === 'navigate') router.go(route);
      else if (action === 'focus-search') { router.go('search'); document.querySelector('#search-form input').focus(); }
      else if (action === 'details') await details.open(id);
      else if (action === 'favorite') { const company = details.find(id); if (company) { const saved = await storage.toggleFavorite(company); toast(saved ? 'Ajouté à votre carnet local.' : 'Retiré de vos favoris.'); } }
      else if (action === 'locate' || action === 'locate-detail') {
        const company = details.find(id);
        if (action === 'locate-detail') document.querySelector('#company-dialog').close();
        if (!store.get().results.some((item) => item.id === id) && company) { store.set({ results: [company], searched: true, criteria: null, origin: null, warning: 'Fiche enregistrée : la carte affiche cette entreprise seule.' }); }
        router.go('map'); setTimeout(() => businessMap.locate(id), 150);
      } else if (action === 'replay') { const item = store.get().history.find((entry) => entry.id === id); if (item) search.run(item.criteria); }
      else if (action === 'delete-history') { await storage.deleteHistory(id); toast('Recherche supprimée.'); }
      else if (action === 'delete-photo') { if (confirmAction('Supprimer cette photo personnelle ?')) { await storage.removePhoto(id, photo); await details.renderPhotos(details.find(id)); toast('Photo supprimée.'); } }
    } catch (error) { toast(error.message || 'Cette action n’a pas pu être effectuée.', 'error'); }
  });
  window.addEventListener('online', updateConnection); window.addEventListener('offline', updateConnection);
  render(); updateConnection(); router.init();
  document.documentElement.dataset.ready = 'true';
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('./sw.js').catch(() => { /* Local server still provides offline access while running. */ });
}
init().catch((error) => { console.error(error); const banner = document.querySelector('#storage-warning'); banner.hidden = false; banner.textContent = `L’application n’a pas pu démarrer : ${error.message}. Ouvrez-la avec start.bat, dans un navigateur récent.`; });

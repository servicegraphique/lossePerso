import { store } from '../core/state.js';
import { events } from '../core/events.js';
import { SETTINGS } from '../config/settings.js';
import { sortAndFilter } from '../utils/deduplication.js';
import { escapeHtml } from '../utils/helpers.js';
import { fullAddress, formatDistance } from '../utils/formatters.js';
import { icon, emptyState } from './ui.js';

export function filteredResults() {
  const state = store.get();
  return sortAndFilter(state.results, { sort: state.sort, filter: state.filter, query: state.resultQuery, origin: state.origin });
}
export function companyCard(company, { favorite = false } = {}) {
  const saved = store.get().favorites.some((item) => item.id === company.id);
  return `<article class="company-card ${store.get().selectedId === company.id ? 'selected' : ''}" data-company-id="${escapeHtml(company.id)}">
    <div class="company-card-top"><div class="company-avatar">${icon('building')}</div><div class="company-heading"><button class="company-name" data-action="details" data-id="${escapeHtml(company.id)}">${escapeHtml(company.name)}</button><span class="activity-label">${escapeHtml(company.activity)}</span></div><button class="icon-button favorite-button ${saved ? 'saved' : ''}" data-action="favorite" data-id="${escapeHtml(company.id)}" aria-label="${saved ? 'Retirer des' : 'Ajouter aux'} favoris" title="${saved ? 'Retirer des' : 'Ajouter aux'} favoris">${icon('bookmark')}</button></div>
    <div class="company-address">${icon('pin')}<span>${escapeHtml(fullAddress(company))}</span></div>
    <div class="company-meta"><span class="source-mini"><span class="tiny-dot"></span>OpenStreetMap</span>${company.distanceKm != null ? `<span title="Distance à vol d’oiseau depuis le point de référence de la recherche">${formatDistance(company.distanceKm)} · à vol d’oiseau</span>` : '<span>GPS disponible</span>'}</div>
    <div class="company-card-actions"><button class="text-button" data-action="locate" data-id="${escapeHtml(company.id)}">${icon('map')}Voir sur la carte</button><button class="small-button" data-action="details" data-id="${escapeHtml(company.id)}">Voir la fiche ${icon('arrow-right')}</button></div>
  </article>`;
}
export const results = {
  init() {
    document.querySelector('#result-filter').addEventListener('change', (event) => store.set({ filter: event.target.value, page: 1 }));
    document.querySelector('#result-sort').addEventListener('change', (event) => store.set({ sort: event.target.value, page: 1 }));
    document.querySelector('#result-search').addEventListener('input', (event) => store.set({ resultQuery: event.target.value, page: 1 }));
    document.querySelector('#previous-page').addEventListener('click', () => store.set({ page: store.get().page - 1 }));
    document.querySelector('#next-page').addEventListener('click', () => store.set({ page: store.get().page + 1 }));
    events.on('results:loaded', () => this.render());
  },
  render() {
    const state = store.get(), filtered = filteredResults();
    const pages = Math.max(1, Math.ceil(filtered.length / SETTINGS.pageSize));
    const page = Math.max(1, Math.min(state.page, pages));
    const list = document.querySelector('#results-list');
    document.querySelector('#results-count').textContent = `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}`;
    document.querySelector('#export-csv').disabled = !filtered.length;
    document.querySelector('#export-json').disabled = !filtered.length;
    if (state.loading) list.innerHTML = `<div class="loading-cards">${Array.from({ length: 3 }, () => '<div class="skeleton-card"><div></div><div></div><div></div></div>').join('')}</div>`;
    else if (!filtered.length) list.innerHTML = emptyState(state.searched ? 'Aucun établissement trouvé' : 'Votre prochaine découverte commence ici', state.searched ? 'Essayez une autre activité ou élargissez la zone. Une absence de résultat ne signifie pas qu’aucune entreprise existe.' : 'Lancez une recherche pour afficher des entreprises réelles et leur emplacement.', !state.searched ? '<button class="text-button" data-action="focus-search">Commencer une recherche →</button>' : '');
    else list.innerHTML = filtered.slice((page - 1) * SETTINGS.pageSize, page * SETTINGS.pageSize).map((company) => companyCard(company)).join('');
    document.querySelector('#pagination').hidden = filtered.length <= SETTINGS.pageSize;
    document.querySelector('#page-label').textContent = `Page ${page} sur ${pages}`;
    document.querySelector('#previous-page').disabled = page <= 1;
    document.querySelector('#next-page').disabled = page >= pages;
    events.emit('results:filtered', filtered);
  },
};

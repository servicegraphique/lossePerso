import { store } from '../core/state.js';
import { escapeHtml } from '../utils/helpers.js';
import { formatDate } from '../utils/formatters.js';
import { search } from './search.js';
import { icon, emptyState } from './ui.js';
export function criteriaLabel(criteria) { return [criteria.name, criteria.activity, criteria.city, criteria.postcode, criteria.country].filter(Boolean).join(' · ') || 'Recherche'; }
export const dashboard = {
  render() {
    const state = store.get();
    document.querySelector('#stat-results').textContent = state.results.length;
    document.querySelector('#stat-located').textContent = state.results.filter((company) => Number.isFinite(company.lat) && Number.isFinite(company.lng)).length;
    document.querySelector('#stat-favorites').textContent = state.favorites.length;
    document.querySelector('#favorite-count').textContent = state.favorites.length;
    document.querySelector('#dashboard-recent-searches').innerHTML = state.history.length ? state.history.slice(0, 3).map((item) => `<button class="recent-search-row" data-action="replay" data-id="${escapeHtml(item.id)}"><span class="row-icon">${icon('search')}</span><span><strong>${escapeHtml(criteriaLabel(item.criteria))}</strong><small>${formatDate(item.date)} · ${item.count} résultat${item.count > 1 ? 's' : ''}</small></span>${icon('arrow-up-right')}</button>`).join('') : emptyState('Tout commence par une recherche', 'Vos dernières recherches apparaîtront ici.');
    const recent = [...state.recent, ...state.favorites].filter((company, index, all) => all.findIndex((item) => item.id === company.id) === index).slice(0, 3);
    document.querySelector('#dashboard-recent-companies').innerHTML = recent.length ? recent.map((company) => `<button class="recent-search-row" data-action="details" data-id="${escapeHtml(company.id)}"><span class="row-icon blue">${icon('building')}</span><span><strong>${escapeHtml(company.name)}</strong><small>${escapeHtml(company.city || company.activity)} · OpenStreetMap</small></span>${icon('chevron-right')}</button>`).join('') : emptyState('Votre carnet est encore vide', 'Consultez une fiche ou enregistrez un favori pour la retrouver ici.');
  },
};

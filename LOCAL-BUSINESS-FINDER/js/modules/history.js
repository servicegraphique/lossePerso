import { store } from '../core/state.js';
import { escapeHtml } from '../utils/helpers.js';
import { formatDate } from '../utils/formatters.js';
import { criteriaLabel } from './dashboard.js';
import { icon, emptyState } from './ui.js';
export const history = {
  render() {
    const state = store.get();
    document.querySelector('#clear-history').disabled = !state.history.length;
    document.querySelector('#history-list').innerHTML = state.history.length ? `<div class="history-table"><div class="history-table-head"><span>Recherche</span><span>Date</span><span>Résultats</span><span>Actions</span></div>${state.history.map((item) => `<div class="history-row"><span><strong>${escapeHtml(criteriaLabel(item.criteria))}</strong><small>${escapeHtml([item.criteria.address, item.criteria.country].filter(Boolean).join(' · '))}</small></span><span>${formatDate(item.date)}</span><span class="badge blue">${item.count}</span><span class="row-actions"><button class="icon-button" data-action="replay" data-id="${escapeHtml(item.id)}" title="Relancer cette recherche" aria-label="Relancer cette recherche">${icon('refresh')}</button><button class="icon-button" data-action="delete-history" data-id="${escapeHtml(item.id)}" title="Supprimer cette recherche" aria-label="Supprimer cette recherche">${icon('trash')}</button></span></div>`).join('')}</div>` : emptyState('Un historique qui vous appartient', 'Vos 50 dernières recherches seront conservées uniquement dans ce navigateur.', '<button class="primary-button" data-action="navigate" data-route="search">Lancer une recherche</button>');
    document.querySelector('#viewed-list').innerHTML = state.recent.length ? state.recent.slice(0, 8).map((company) => `<button class="recent-search-row" data-action="details" data-id="${escapeHtml(company.id)}"><span class="row-icon blue">${icon('building')}</span><span><strong>${escapeHtml(company.name)}</strong><small>${escapeHtml(company.city || company.activity)} · Consulté le ${formatDate(company.viewedAt)}</small></span>${icon('chevron-right')}</button>`).join('') : '<p class="muted panel-padding">Aucune fiche consultée pour le moment.</p>';
  },
};

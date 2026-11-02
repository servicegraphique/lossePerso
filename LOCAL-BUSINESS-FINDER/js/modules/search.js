import { store } from '../core/state.js';
import { router } from '../core/router.js';
import { events } from '../core/events.js';
import { storage } from '../core/storage.js';
import { findBusinesses } from '../services/search-service.js';
import { validateSearch } from '../utils/validators.js';
import { ACTIVITIES } from '../config/settings.js';
import { escapeHtml } from '../utils/helpers.js';
import { icon, toast } from './ui.js';
let controller;

export function activityOptions() { return `<option value="">Toutes les activités</option>${Object.entries(ACTIVITIES).map(([key, value]) => `<option value="${key}">${value.label}</option>`).join('')}`; }
export const search = {
  init() {
    document.querySelector('#search-form').addEventListener('submit', (event) => { event.preventDefault(); this.run(Object.fromEntries(new FormData(event.currentTarget))); });
    document.querySelector('#quick-search-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const input = Object.fromEntries(new FormData(event.currentTarget));
      if (/^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/.test(input.city?.trim() || '') && /\d/.test(input.city)) { input.postcode = input.city; input.city = ''; }
      this.run(input);
    });
    document.querySelector('#search-form').addEventListener('reset', () => { setTimeout(() => this.showErrors({}), 0); });
    document.querySelectorAll('[data-example]').forEach((button) => button.addEventListener('click', () => {
      const example = JSON.parse(button.dataset.example); this.fill(example); this.run(example);
    }));
  },
  fill(criteria) {
    router.go('search');
    const form = document.querySelector('#search-form');
    for (const key of ['name', 'postcode', 'city', 'country', 'activity', 'address']) if (form.elements[key]) form.elements[key].value = criteria[key] || '';
    form.elements.activity.value = ACTIVITIES[criteria.activity] ? criteria.activity : '';
    this.showErrors({});
  },
  showErrors(errors) {
    const form = document.querySelector('#search-form');
    form.querySelectorAll('[data-error]').forEach((element) => { element.textContent = errors[element.dataset.error] || ''; element.closest('.field')?.classList.toggle('invalid', Boolean(errors[element.dataset.error])); });
    const banner = document.querySelector('#form-error'); banner.textContent = errors.form || ''; banner.hidden = !errors.form;
  },
  cancel() { controller?.abort(); },
  async run(input) {
    const { valid, errors, criteria } = validateSearch(input);
    this.fill(criteria); this.showErrors(errors);
    if (!valid) return;
    controller?.abort(); controller = new AbortController();
    const current = controller;
    store.set({ loading: true, error: '', warning: '', page: 1, resultQuery: '', filter: 'all', selectedId: null });
    try {
      const result = await findBusinesses(criteria, current.signal);
      if (current.signal.aborted) return;
      store.set({ results: result.companies, criteria: result.criteria, origin: result.origin, warning: result.warning, fromCache: result.fromCache, searched: true, loading: false });
      events.emit('results:loaded', result);
      try { await storage.rememberSearch(criteria, result.companies.length); await storage.refreshCacheCount(); }
      catch { toast('Résultats affichés, mais l’historique n’a pas pu être enregistré.', 'error'); }
    } catch (error) {
      if (current.signal.aborted || error.name === 'AbortError') { if (store.get().loading) store.set({ loading: false }); return; }
      store.set({ loading: false, error: error.message || 'La recherche a échoué.', searched: false, results: [], origin: null, fromCache: false });
    }
  },
  renderStatus() {
    const state = store.get();
    const status = document.querySelector('#search-status');
    document.querySelector('#cancel-search').hidden = !state.loading;
    document.querySelectorAll('.search-submit').forEach((button) => { button.disabled = state.loading; });
    if (state.loading) status.innerHTML = `<span class="spinner"></span><span>Recherche dans OpenStreetMap… <small>Interrogation respectueuse des services publics.</small></span>`;
    else if (state.error) status.innerHTML = `${icon('alert')}<span>${escapeHtml(state.error)}</span>`;
    else if (state.searched) status.innerHTML = `${icon(state.fromCache ? 'database' : 'check')}<span>${state.results.length} établissement${state.results.length > 1 ? 's' : ''} trouvé${state.results.length > 1 ? 's' : ''}<small>${state.fromCache ? 'Résultats du cache local · moins de 24 h' : 'Données publiques · couverture variable selon les régions'}</small></span>`;
    else status.innerHTML = `${icon('info')}<span>Les données proviennent d’OpenStreetMap. Leur présence et leur exhaustivité ne sont pas garanties.</span>`;
    status.className = `search-status ${state.error ? 'error' : ''}`;
    const warning = document.querySelector('#search-warning'); warning.hidden = !state.warning; warning.textContent = state.warning;
  },
};

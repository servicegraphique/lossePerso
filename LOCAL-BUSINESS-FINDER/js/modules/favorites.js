import { store } from '../core/state.js';
import { companyCard } from './results.js';
import { emptyState } from './ui.js';
export const favorites = {
  render() {
    const state = store.get();
    const query = document.querySelector('#favorites-search').value.toLocaleLowerCase('fr');
    const companies = state.favorites.filter((company) => `${company.name} ${company.city}`.toLocaleLowerCase('fr').includes(query)).sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
    document.querySelector('#favorites-summary').textContent = `${companies.length} fiche${companies.length > 1 ? 's' : ''} enregistrée${companies.length > 1 ? 's' : ''} sur cet ordinateur`;
    document.querySelector('#favorites-list').innerHTML = companies.length ? companies.map((company) => companyCard(company, { favorite: true })).join('') : emptyState(query ? 'Aucun favori correspondant' : 'Gardez les bonnes adresses à portée de main', query ? 'Essayez un autre nom ou une autre ville.' : 'Cliquez sur le marque-page d’une entreprise pour l’enregistrer. Elle restera consultable hors connexion.', '<button class="primary-button" data-action="navigate" data-route="search">Rechercher une entreprise</button>');
    document.querySelector('#export-favorites').disabled = !companies.length;
    document.querySelector('#clear-favorites').disabled = !state.favorites.length;
    return companies;
  },
};

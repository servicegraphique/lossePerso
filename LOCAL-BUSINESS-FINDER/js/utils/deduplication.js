export function deduplicate(companies) {
  const unique = new Map();
  for (const company of companies) {
    if (!company?.id || !unique.has(company.id)) unique.set(company.id, company);
  }
  return [...unique.values()];
}

export function sortAndFilter(companies, { sort = 'relevance', filter = 'all', query = '', origin = null } = {}) {
  const term = query.toLocaleLowerCase('fr');
  const result = companies.filter((company) => {
    if (filter === 'contact' && !company.phone && !company.website) return false;
    if (filter === 'address' && !company.address) return false;
    return !term || [company.name, company.city, company.activity].join(' ').toLocaleLowerCase('fr').includes(term);
  });
  const compareName = (a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
  if (sort === 'name') result.sort(compareName);
  else if (sort === 'city') result.sort((a, b) => a.city.localeCompare(b.city, 'fr') || compareName(a, b));
  else if (sort === 'distance' && origin) result.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || compareName(a, b));
  return result;
}

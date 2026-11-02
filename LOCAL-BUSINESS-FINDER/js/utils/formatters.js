export function formatDate(value) {
  if (!value) return 'Non disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Non disponible' : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatDistance(km) {
  if (km == null || !Number.isFinite(km)) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}

export function fullAddress(company) {
  return [company.address, [company.postcode, company.city].filter(Boolean).join(' '), company.country].filter(Boolean).join(', ') || 'Adresse complète non disponible';
}

export function csvCell(value) {
  let text = String(value ?? '');
  // Prevent spreadsheet formula execution when opening an exported CSV.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(companies) {
  const columns = [['name', 'Nom'], ['address', 'Adresse'], ['postcode', 'Code postal'], ['city', 'Ville'], ['country', 'Pays'], ['lat', 'Latitude'], ['lng', 'Longitude'], ['phone', 'Téléphone'], ['website', 'Site internet'], ['activity', 'Activité'], ['precision', 'Précision'], ['sourceUrl', 'Source'], ['retrievedAt', 'Récupéré le']];
  return '\uFEFF' + [columns.map(([, label]) => csvCell(label)).join(';'), ...companies.map((company) => columns.map(([key]) => csvCell(company[key])).join(';'))].join('\r\n');
}

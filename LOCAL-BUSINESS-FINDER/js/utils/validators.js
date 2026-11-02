export function normalizeCriteria(input = {}) {
  const result = {};
  for (const key of ['name', 'postcode', 'city', 'country', 'activity', 'address']) {
    result[key] = String(input[key] ?? '').trim().slice(0, 160);
  }
  return result;
}

export function validateSearch(input) {
  const criteria = normalizeCriteria(input);
  const errors = {};
  if (!criteria.name && !criteria.postcode && !criteria.city && !criteria.address && !criteria.activity) {
    errors.form = 'Renseignez au moins un nom, une activité ou une localisation.';
  }
  if (criteria.country && !criteria.name && !criteria.postcode && !criteria.city && !criteria.address && !criteria.activity) {
    errors.form = 'Ajoutez un nom, une activité ou une ville au pays.';
  }
  if (criteria.activity && !criteria.postcode && !criteria.city && !criteria.address) {
    errors.city = 'Pour rechercher par activité, précisez une ville, une adresse ou un code postal.';
  }
  if (criteria.postcode && !/^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/.test(criteria.postcode)) {
    errors.postcode = 'Saisissez un code postal valide (chiffres ou lettres selon le pays).';
  }
  for (const key of ['name', 'city', 'country', 'address']) {
    if (criteria[key] && criteria[key].length < 2) errors[key] = 'Saisissez au moins deux caractères.';
  }
  return { valid: Object.keys(errors).length === 0, errors, criteria };
}

export function validCoordinates(lat, lng) {
  const a = Number(lat), b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a >= -90 && a <= 90 && b >= -180 && b <= 180 && !(a === 0 && b === 0);
}

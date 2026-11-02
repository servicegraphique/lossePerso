import { SETTINGS } from '../config/settings.js';
import { requestJson } from './http.js';
import { cached } from './cache.js';
import { safeUrl } from '../utils/helpers.js';

export function plainMetadata(value = '') {
  // Parse without inserting into the document; return text only, never executable HTML.
  const doc = new DOMParser().parseFromString(String(value), 'text/html');
  return doc.body.textContent?.trim() || '';
}

export async function loadLinkedPhoto(company, signal) {
  if (company.commons) {
    const title = company.commons.replace(/^File:/i, 'File:');
    const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '900', titles: title });
    const { value } = await cached(`commons:${title}`, SETTINGS.geocodeCacheMs, () => requestJson(`${SETTINGS.endpoints.commons}?${params}`, { signal, minInterval: 500 }));
    const page = Object.values(value?.query?.pages || {})[0];
    const info = page?.imageinfo?.[0];
    const url = safeUrl(info?.thumburl || info?.url, ['https:']);
    if (!url) return null;
    const meta = info.extmetadata || {};
    return { url, sourceUrl: safeUrl(info.descriptionurl) || `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`, title, author: plainMetadata(meta.Artist?.value) || 'Auteur non précisé', license: plainMetadata(meta.LicenseShortName?.value) || 'Licence à vérifier sur la source', licenseUrl: safeUrl(meta.LicenseUrl?.value), source: 'Wikimedia Commons · image liée à la fiche OSM' };
  }
  if (company.image) return { url: company.image, sourceUrl: company.sourceUrl, title: company.name, author: 'Auteur à vérifier sur la source', license: 'Licence à vérifier sur la source', source: 'Image explicitement liée à la fiche OSM' };
  return null;
}

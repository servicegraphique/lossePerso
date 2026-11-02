import { store } from '../core/state.js';
import { storage } from '../core/storage.js';
import { events } from '../core/events.js';
import { loadLinkedPhoto } from '../services/commons.service.js';
import { escapeHtml, safeUrl } from '../utils/helpers.js';
import { formatDate, fullAddress } from '../utils/formatters.js';
import { icon, toast } from './ui.js';
let activeCompany, photoUrls = [], photoController, photoRenderVersion = 0;
const dialog = () => document.querySelector('#company-dialog');
function field(label, value, extra = '') { return `<div class="detail-field"><dt>${label}</dt><dd>${value || '<span class="unavailable">Non disponible dans la source</span>'}${extra}</dd></div>`; }
const text = (value) => value ? escapeHtml(value) : '';

export const details = {
  init() {
    document.querySelector('#close-details').addEventListener('click', () => dialog().close());
    dialog().addEventListener('click', (event) => { if (event.target === dialog()) { const rect = dialog().getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right) dialog().close(); } });
    dialog().addEventListener('close', () => { photoController?.abort(); photoUrls.forEach(URL.revokeObjectURL); photoUrls = []; });
    document.querySelector('#detail-save').addEventListener('click', async () => { try { const saved = await storage.toggleFavorite(activeCompany); this.renderActions(); toast(saved ? 'Fiche enregistrée sur cet ordinateur.' : 'Fiche retirée des favoris.'); } catch (error) { toast(error.message, 'error'); } });
    document.querySelector('#detail-print').addEventListener('click', () => { document.body.classList.add('printing-company'); window.print(); });
    window.addEventListener('afterprint', () => document.body.classList.remove('printing-company'));

    events.on('company:open', (id) => this.open(id));
  },
  find(id) { const state = store.get(); return [...state.results, ...state.favorites, ...state.recent].find((company) => company.id === id); },
  async open(id) {
    const company = this.find(id); if (!company) return;
    activeCompany = company; photoRenderVersion++; photoController?.abort(); photoController = new AbortController();
    const signal = photoController.signal;
    const website = safeUrl(company.website), phone = String(company.phone || '').replace(/[^+\d*#(),.; -]/g, '');
    document.querySelector('#detail-content').innerHTML = `<div class="detail-hero"><div class="detail-avatar">${icon('building')}</div><span class="eyebrow">FICHE ENTREPRISE</span><h2 id="detail-title">${escapeHtml(company.name)}</h2><span class="badge blue">${escapeHtml(company.activity)}</span></div>
      <div class="detail-body"><div class="photo-gallery" id="detail-photos"><p class="muted">Aucune photographie disponible</p></div>
      <div class="photo-import"><label class="text-button" for="photo-upload">${icon('upload')}Importer ma photo</label><input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only"><small>JPEG, PNG, WebP · 5 Mo max. · 5 photos par fiche.<br>Importez uniquement une image dont vous détenez les droits.</small></div>
      <div class="source-notice">${icon('info')}<span>Données déclaratives de la source, non vérifiées sur place. Les champs absents ne sont pas déduits.</span></div>
      <dl class="detail-grid">${field('Adresse', text(fullAddress(company)))}${field('Code postal', text(company.postcode))}${field('Ville', text(company.city))}${field('Pays', text(company.country))}${field('Téléphone', phone ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(company.phone)}</a>` : '')}${field('Site internet', website ? `<a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(new URL(website).hostname)} ↗</a>` : '')}${field('Horaires', text(company.openingHours))}${field('Activité', text(company.activity))}</dl>
      <section class="detail-section"><h3>${icon('pin')}Géolocalisation</h3><div class="coordinates"><span>${company.lat.toFixed(6)}, ${company.lng.toFixed(6)}</span><span class="badge amber">Précision à confirmer</span></div><p class="muted">${escapeHtml(company.precision)}</p><button class="secondary-button" data-action="locate-detail" data-id="${escapeHtml(company.id)}">${icon('map')}Centrer sur la carte</button></section>
      <section class="detail-section source-section"><h3>${icon('database')}Traçabilité des données</h3><p>Source : <a href="${escapeHtml(safeUrl(company.sourceUrl))}" target="_blank" rel="noopener noreferrer">${escapeHtml(company.source)}</a></p><p>Dernière récupération : ${formatDate(company.retrievedAt)}</p><p>Informations complémentaires : ${company.tags?.['contact:email'] ? escapeHtml(company.tags['contact:email']) : 'aucune autre information exploitable.'}</p><a class="text-button" href="${escapeHtml(safeUrl(company.sourceUrl))}" target="_blank" rel="noopener noreferrer">Ouvrir dans OpenStreetMap ${icon('external')}</a></section></div>`;
    document.querySelector('#photo-upload').addEventListener('change', async (event) => {
      const file = event.target.files[0]; event.target.value = ''; if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return toast('Image acceptée : JPEG, PNG ou WebP, moins de 5 Mo.', 'error');
      try { const bitmap = await createImageBitmap(file); bitmap.close(); await storage.addPhoto(company.id, file, file.name); await this.renderPhotos(company); toast('Photo personnelle enregistrée localement.'); }
      catch (error) { toast(error.message || 'Image illisible ou stockage impossible.', 'error'); }
    });
    this.renderActions();
    if (!dialog().open) dialog().showModal();
    try { await storage.rememberView(company); } catch { toast('La fiche n’a pas pu être ajoutée aux consultations récentes.', 'error'); }
    await this.renderPhotos(company, signal);
  },
  renderActions() {
    const saved = store.get().favorites.some((item) => item.id === activeCompany?.id);
    document.querySelector('#detail-save').innerHTML = `${icon('bookmark')}${saved ? 'Retirer des favoris' : 'Enregistrer la fiche'}`;
    document.querySelector('#detail-save').classList.toggle('saved', saved);
  },
  async renderPhotos(company, signal) {
    const version = ++photoRenderVersion;
    const gallery = document.querySelector('#detail-photos'); if (!gallery || activeCompany?.id !== company.id) return;
    photoUrls.forEach(URL.revokeObjectURL); photoUrls = [];
    const personal = await storage.getPhotos(company.id);
    if (activeCompany?.id !== company.id || version !== photoRenderVersion) return;
    gallery.innerHTML = personal.map((photo) => { const url = URL.createObjectURL(photo.blob); photoUrls.push(url); return `<figure><img src="${url}" alt="Photo importée par l’utilisateur pour ${escapeHtml(company.name)}"><figcaption>Saisie manuelle · ${escapeHtml(photo.name)}<button class="icon-button" data-action="delete-photo" data-id="${escapeHtml(company.id)}" data-photo="${escapeHtml(photo.id)}" aria-label="Supprimer cette photo">${icon('trash')}</button></figcaption></figure>`; }).join('');
    if (!personal.length) gallery.innerHTML = `<div class="photo-placeholder">${icon('image')}<span>Aucune photographie disponible</span></div>`;
    if (!company.commons && !company.image) return;
    try {
      const photo = await loadLinkedPhoto(company, signal);
      if (!photo || activeCompany?.id !== company.id || signal?.aborted || version !== photoRenderVersion) return;
      const figure = document.createElement('figure');
      figure.innerHTML = `<img alt="Photographie liée à la fiche OpenStreetMap de ${escapeHtml(company.name)}"><figcaption>${escapeHtml(photo.source)} · ${escapeHtml(photo.author)} · <a href="${escapeHtml(safeUrl(photo.sourceUrl))}" target="_blank" rel="noopener noreferrer">${escapeHtml(photo.license)}</a></figcaption>`;
      const img = figure.querySelector('img'); img.src = photo.url;
      img.addEventListener('error', () => figure.remove(), { once: true });
      if (!personal.length) gallery.innerHTML = '';
      gallery.append(figure);
    } catch { if (personal.length === 0 && activeCompany?.id === company.id && version === photoRenderVersion) gallery.innerHTML = `<div class="photo-placeholder">${icon('image')}<span>Aucune photographie disponible hors connexion</span></div>`; }
  },
};

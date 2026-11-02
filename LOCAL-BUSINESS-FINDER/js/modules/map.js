import { store } from '../core/state.js';
import { events } from '../core/events.js';
import { SETTINGS } from '../config/settings.js';
import { escapeHtml } from '../utils/helpers.js';
import { fullAddress } from '../utils/formatters.js';
let map, cluster, markers = new Map(), currentCompanies = [], tileErrors = 0, lastSignature = null;

function createIcon(selected = false) {
  return L.divIcon({ className: `business-marker ${selected ? 'active' : ''}`, html: '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V5l8-3v19M12 8h8v13M2 21h20M8 7v1m0 3v1m0 3v1m8-4h1m-1 4h1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>', iconSize: [36, 44], iconAnchor: [18, 42], popupAnchor: [0, -38] });
}
export const businessMap = {
  init() {
    map = L.map('business-map', { zoomControl: false, scrollWheelZoom: false }).setView(SETTINGS.defaultCenter, 12);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const tiles = L.tileLayer(SETTINGS.endpoints.tiles, { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' });
    tiles.on('tileerror', () => { tileErrors++; if (tileErrors >= 4) document.querySelector('#map-offline-note').hidden = false; });
    tiles.on('tileload', () => { tileErrors = 0; document.querySelector('#map-offline-note').hidden = true; });
    tiles.addTo(map);
    cluster = L.markerClusterGroup({ maxClusterRadius: 45, showCoverageOnHover: false, spiderfyOnMaxZoom: true });
    map.addLayer(cluster);
    document.querySelector('#fit-map').addEventListener('click', () => this.fit());
    document.querySelector('#toggle-map-scroll').addEventListener('click', (event) => {
      const enabled = !map.scrollWheelZoom.enabled();
      map.scrollWheelZoom[enabled ? 'enable' : 'disable']();
      event.currentTarget.setAttribute('aria-pressed', String(enabled));
      event.currentTarget.title = enabled ? 'Désactiver le zoom à la molette' : 'Activer le zoom à la molette';
      event.currentTarget.classList.toggle('active', enabled);
    });
    events.on('results:filtered', (companies) => this.setCompanies(companies));
    events.on('state:changed', (state) => this.highlight(state.selectedId));
    events.on('route:changed', () => setTimeout(() => map.invalidateSize(), 80));
    window.addEventListener('resize', () => map.invalidateSize());
  },
  setCompanies(companies) {
    const signature = companies.map((company) => company.id).join('|');
    if (signature === lastSignature) { this.highlight(store.get().selectedId); return; }
    lastSignature = signature;
    currentCompanies = companies; cluster.clearLayers(); markers.clear();
    for (const company of companies) {
      const marker = L.marker([company.lat, company.lng], { icon: createIcon(), title: company.name, alt: company.name });
      const popup = document.createElement('div'); popup.className = 'map-popup';
      popup.innerHTML = `<strong>${escapeHtml(company.name)}</strong><p>${escapeHtml(fullAddress(company))}</p><small>${company.lat.toFixed(6)}, ${company.lng.toFixed(6)}</small><button class="small-button" type="button">Voir la fiche →</button>`;
      popup.querySelector('button').addEventListener('click', () => events.emit('company:open', company.id));
      marker.bindPopup(popup);
      marker.on('click', () => store.set({ selectedId: company.id }));
      markers.set(company.id, marker); cluster.addLayer(marker);
    }
    document.querySelector('#map-result-count').textContent = `${companies.length} établissement${companies.length > 1 ? 's' : ''}`;
    document.querySelector('#map-empty').hidden = companies.length > 0;
    this.fit();
  },
  fit() {
    if (currentCompanies.length) map.fitBounds(L.latLngBounds(currentCompanies.map((company) => [company.lat, company.lng])), { padding: [45, 45], maxZoom: 16, animate: false });
    else map.setView(SETTINGS.defaultCenter, 12);
  },
  locate(id) {
    const company = [...store.get().results, ...store.get().favorites, ...store.get().recent].find((item) => item.id === id);
    const marker = markers.get(id);
    if (!company || !marker) return;
    store.set({ selectedId: id });
    cluster.zoomToShowLayer(marker, () => { map.setView(marker.getLatLng(), Math.max(map.getZoom(), 16), { animate: false }); marker.openPopup(); });
  },
  highlight(id) { for (const [key, marker] of markers) marker.setIcon(createIcon(key === id)); },
};

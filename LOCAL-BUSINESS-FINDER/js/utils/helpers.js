export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function safeUrl(value, protocols = ['https:', 'http:']) {
  if (!value) return '';
  try {
    const url = new URL(String(value).trim());
    return protocols.includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export function debounce(fn, delay = 250) {
  let timer;
  const wrapped = (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  wrapped.cancel = () => clearTimeout(timer);
  return wrapped;
}

export function uid() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function distanceKm(a, b) {
  if (!a || !b) return null;
  const rad = (n) => n * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

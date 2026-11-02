import { escapeHtml } from '../utils/helpers.js';
export function icon(name, className = '') { return `<svg class="icon ${className}" aria-hidden="true"><use href="assets/icons/sprite.svg#${name}"></use></svg>`; }
let toastTimer;
export function toast(message, type = 'success') {
  const element = document.querySelector('#toast');
  element.innerHTML = `${icon(type === 'error' ? 'alert' : 'check')}<span>${escapeHtml(message)}</span>`;
  element.className = `toast visible ${type}`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove('visible'), 5000);
}
export function emptyState(title, text, action = '') {
  return `<div class="empty-state"><div class="empty-icon">${icon('building')}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>${action}</div>`;
}
export function confirmAction(message) { return window.confirm(message); }

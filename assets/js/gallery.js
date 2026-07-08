/**
 * gallery.js — filterable photo grid + accessible lightbox.
 *
 * Markup contract (gallery.html):
 *  - Filter buttons: .gallery__filters button[data-filter="regions|daily-life|…|all"]
 *  - Items: button.gallery__item[data-category] > img (caption via data-i18n-alt)
 *  - Lightbox: #lightbox with .lightbox__img/.lightbox__caption/.lightbox__close/prev/next
 */

import { t } from './i18n.js';

const items = () => Array.from(document.querySelectorAll('.gallery__item'));

let visibleItems = [];
let currentIndex = -1;
let lastFocused = null;

/* ------------------------------- Filters -------------------------------- */

function initFilters() {
  const filterBar = document.querySelector('.gallery__filters');
  if (!filterBar) return;

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;

    filterBar.querySelectorAll('[data-filter]').forEach((other) => {
      other.setAttribute('aria-pressed', String(other === btn));
      other.classList.toggle('btn--primary', other === btn);
      other.classList.toggle('btn--ghost', other !== btn);
    });

    const filter = btn.dataset.filter;
    items().forEach((item) => {
      item.hidden = filter !== 'all' && item.dataset.category !== filter;
    });
  });
}

/* ------------------------------- Lightbox ------------------------------- */

function lightboxEls() {
  const box = document.getElementById('lightbox');
  if (!box) return null;
  return {
    box,
    img: box.querySelector('.lightbox__img'),
    caption: box.querySelector('.lightbox__caption'),
    close: box.querySelector('.lightbox__close'),
    prev: box.querySelector('.lightbox__prev'),
    next: box.querySelector('.lightbox__next'),
  };
}

function show(index) {
  const els = lightboxEls();
  if (!els || !visibleItems.length) return;
  currentIndex = (index + visibleItems.length) % visibleItems.length;
  const source = visibleItems[currentIndex].querySelector('img');
  // Prefer a full-size URL if provided, else reuse the grid image.
  els.img.src = source.dataset.full || source.src;
  els.img.alt = source.alt;
  els.caption.textContent = source.alt;
}

function openLightbox(item) {
  const els = lightboxEls();
  if (!els) return;
  visibleItems = items().filter((el) => !el.hidden);
  lastFocused = item;
  els.box.hidden = false;
  document.body.style.overflow = 'hidden';
  show(visibleItems.indexOf(item));
  els.close.focus();
}

function closeLightbox() {
  const els = lightboxEls();
  if (!els) return;
  els.box.hidden = true;
  document.body.style.overflow = '';
  if (lastFocused) lastFocused.focus();
}

function initLightbox() {
  const els = lightboxEls();
  if (!els) return;

  document.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery__item');
    if (item) openLightbox(item);
  });

  els.close.addEventListener('click', closeLightbox);
  els.prev.addEventListener('click', () => show(currentIndex - 1));
  els.next.addEventListener('click', () => show(currentIndex + 1));

  // Click on the dark backdrop closes.
  els.box.addEventListener('click', (e) => {
    if (e.target === els.box) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (els.box.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') show(currentIndex - 1);
    if (e.key === 'ArrowRight') show(currentIndex + 1);

    // Simple focus trap between the three controls.
    if (e.key === 'Tab') {
      const focusables = [els.close, els.prev, els.next];
      const i = focusables.indexOf(document.activeElement);
      if (i !== -1) {
        e.preventDefault();
        const nextIndex = e.shiftKey ? (i - 1 + 3) % 3 : (i + 1) % 3;
        focusables[nextIndex].focus();
      }
    }
  });

  // Localized control labels, kept in sync on language change.
  function label() {
    els.close.setAttribute('aria-label', t('a11y.closeLightbox', 'Fermer'));
    els.prev.setAttribute('aria-label', t('common.previous', 'Précédent'));
    els.next.setAttribute('aria-label', t('common.next', 'Suivant'));
  }
  label();
  document.addEventListener('tb:langchange', label);
}

document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  initLightbox();
});

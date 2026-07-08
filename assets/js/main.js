/**
 * main.js — app entry point.
 *
 * Responsibilities:
 *  - Inject shared header/footer from /_layouts (with hardcoded fallback)
 *  - Mobile nav drawer toggle
 *  - Dark/light theme toggle (localStorage + prefers-color-scheme)
 *  - Active nav link highlighting
 *  - Generic accessible tabs + accordion components
 *  - "Word of the day" widget (homepage)
 *  - Front-end form validation (contact + newsletter)
 *  - Story share buttons
 *  - Service worker registration
 */

import { initI18n, applyTranslations, t, getLang } from './i18n.js';

const THEME_KEY = 'tb-theme';

/* --------------------------------------------------------------------------
 * Shared layout injection
 * ------------------------------------------------------------------------ */

/** Minimal fallback markup used when fetch() fails (e.g. file:// protocol). */
const FALLBACK_HEADER = `
<div class="container site-header__inner">
  <a class="site-logo" href="/index.html"><span class="site-logo__mark" aria-hidden="true">TB</span> Tribu Beti</a>
  <nav class="site-nav" id="site-nav" aria-label="Navigation principale">
    <ul class="site-nav__list">
      <li class="site-nav__item"><a class="site-nav__link" href="/index.html">Accueil</a></li>
      <li class="site-nav__item"><a class="site-nav__link" href="/pages/history.html">Histoire</a></li>
      <li class="site-nav__item"><a class="site-nav__link" href="/pages/languages.html">Langues</a></li>
      <li class="site-nav__item"><a class="site-nav__link" href="/pages/traditions.html">Traditions</a></li>
      <li class="site-nav__item"><a class="site-nav__link" href="/pages/stories.html">Contes</a></li>
      <li class="site-nav__item"><a class="site-nav__link" href="/pages/contact.html">Contact</a></li>
    </ul>
  </nav>
</div>`;

const FALLBACK_FOOTER = `
<div class="container">
  <p class="site-footer__bottom">© Tribu Beti — tribubeti.org</p>
</div>`;

async function injectLayout(id, url, fallback) {
  const host = document.getElementById(id);
  if (!host) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    host.innerHTML = await res.text();
  } catch (err) {
    console.warn('[layout] using fallback for', id, err);
    host.innerHTML = fallback;
  }
}

/* --------------------------------------------------------------------------
 * Navigation
 * ------------------------------------------------------------------------ */

function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('site-nav--open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Close drawer with Escape, restore focus to the toggle.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('site-nav--open')) {
      nav.classList.remove('site-nav--open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}

function highlightActiveLink() {
  const path = window.location.pathname.replace(/\/$/, '') || '/index.html';
  document.querySelectorAll('.site-nav__link, .site-nav__sub-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const normalized = href.replace(/\/$/, '');
    if (normalized === path || (path === '' && normalized === '/index.html')) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* --------------------------------------------------------------------------
 * Theme
 * ------------------------------------------------------------------------ */

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.textContent = theme === 'dark' ? '☀' : '☾';
    btn.setAttribute('aria-label', t(theme === 'dark' ? 'a11y.themeLight' : 'a11y.themeDark'));
  });
}

function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {
    /* ignore */
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-toggle')) return;
    const next =
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
  });
}

/* --------------------------------------------------------------------------
 * Accessible tabs — markup contract:
 *   [role=tablist] > button[role=tab][aria-controls] ;
 *   panels: [role=tabpanel][id]
 * ------------------------------------------------------------------------ */

function initTabs() {
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = Array.from(list.querySelectorAll('[role="tab"]'));

    function select(tab) {
      tabs.forEach((other) => {
        const selected = other === tab;
        other.setAttribute('aria-selected', String(selected));
        other.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(other.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      tab.focus();
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const i = tabs.indexOf(tab);
        let target = null;
        if (e.key === 'ArrowRight') target = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') target = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') target = tabs[0];
        if (e.key === 'End') target = tabs[tabs.length - 1];
        if (target) {
          e.preventDefault();
          select(target);
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
 * Accessible accordion — markup contract:
 *   .accordion__trigger[aria-expanded][aria-controls] ; panel [id][hidden]
 * ------------------------------------------------------------------------ */

function initAccordions() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.accordion__trigger');
    if (!trigger) return;
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!expanded));
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (panel) panel.hidden = expanded;
  });
}

/* --------------------------------------------------------------------------
 * Word of the day (homepage widget) — rotates daily through i18n entries
 * wordOfDay.words.N.{word,phonetic,translation}
 * ------------------------------------------------------------------------ */

const WORD_COUNT = 7;

function renderWordOfDay() {
  const widget = document.querySelector('[data-word-of-day]');
  if (!widget) return;
  const dayIndex = Math.floor(Date.now() / 86400000) % WORD_COUNT;
  const base = `wordOfDay.words.${dayIndex}`;
  widget.querySelector('.word-of-day__word').textContent = t(`${base}.word`);
  widget.querySelector('.word-of-day__phonetic').textContent = t(`${base}.phonetic`);
  widget.querySelector('.word-of-day__translation').textContent = t(`${base}.translation`);
}

/* --------------------------------------------------------------------------
 * Forms — front-end validation only (no backend yet; see README)
 * ------------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(group) {
  const field = group.querySelector('input, textarea');
  if (!field) return true;
  let valid = field.value.trim().length > 0;
  if (valid && field.type === 'email') valid = EMAIL_RE.test(field.value.trim());
  group.classList.toggle('form__group--invalid', !valid);
  field.setAttribute('aria-invalid', String(!valid));
  return valid;
}

function initForms() {
  document.querySelectorAll('form[data-validate]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const groups = Array.from(form.querySelectorAll('.form__group'));
      const allValid = groups.map(validateField).every(Boolean);
      if (!allValid) {
        const firstInvalid = form.querySelector('.form__group--invalid input, .form__group--invalid textarea');
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      // Placeholder success — backend handling to be added later.
      form.hidden = true;
      const success = document.getElementById(form.dataset.success);
      if (success) {
        success.hidden = false;
        success.focus();
      }
    });
  });
}

/* --------------------------------------------------------------------------
 * Story share buttons
 * ------------------------------------------------------------------------ */

function initShareButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-share-copy]');
    if (!btn) return;
    const url = `${window.location.origin}${window.location.pathname}#${btn.dataset.shareCopy}`;
    try {
      await navigator.clipboard.writeText(url);
      btn.textContent = t('common.linkCopied', 'Lien copié !');
      setTimeout(() => {
        btn.textContent = t('common.copyLink', 'Copier le lien');
      }, 2000);
    } catch {
      window.prompt(t('common.copyLink', 'Copier le lien'), url);
    }
  });
}

/* --------------------------------------------------------------------------
 * Service worker
 * ------------------------------------------------------------------------ */

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') return;
  navigator.serviceWorker.register('/service-worker.js').catch((err) => {
    console.warn('[sw] registration failed', err);
  });
}

/* --------------------------------------------------------------------------
 * Boot
 * ------------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    injectLayout('header', '/_layouts/header.html', FALLBACK_HEADER),
    injectLayout('footer', '/_layouts/footer.html', FALLBACK_FOOTER),
  ]);

  await initI18n(); // translates the injected layouts too
  applyTranslations();

  initNavToggle();
  highlightActiveLink();
  initTheme();
  initTabs();
  initAccordions();
  initForms();
  initShareButtons();
  renderWordOfDay();
  registerServiceWorker();

  document.addEventListener('tb:langchange', () => {
    renderWordOfDay();
    // Keep theme toggle aria-label in the right language.
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  });

  // Set copyright year.
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
});

export { getLang };

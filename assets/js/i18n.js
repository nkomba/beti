/**
 * i18n.js — JSON-based internationalization.
 *
 * - Loads /locales/{lang}.json and injects strings into elements carrying
 *   data-i18n (text) or data-i18n-<attr> attributes (alt, placeholder,
 *   aria-label, content, title).
 * - Default language: French. Choice persisted in localStorage ("tb-lang").
 * - Updates <html lang> and dispatches a "tb:langchange" event so other
 *   modules (audio player, lessons, word-of-day) can re-render.
 */

const I18N_STORAGE_KEY = 'tb-lang';
const DEFAULT_LANG = 'fr';
const SUPPORTED = ['fr', 'en'];

/** Attribute-targeting variants: data-i18n-alt="key" → alt="…", etc. */
const ATTR_TARGETS = ['alt', 'placeholder', 'aria-label', 'content', 'title'];

const state = {
  lang: DEFAULT_LANG,
  dict: {},
};

/** Resolve a dotted key path ("home.heroTitle") in the loaded dictionary. */
function lookup(key) {
  return key.split('.').reduce(
    (node, part) => (node && typeof node === 'object' ? node[part] : undefined),
    state.dict
  );
}

/** Public translate helper for JS modules. */
export function t(key, fallback = '') {
  const value = lookup(key);
  return typeof value === 'string' ? value : fallback || key;
}

export function getLang() {
  return state.lang;
}

/** Apply the loaded dictionary to the whole document (or a subtree). */
export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = lookup(el.dataset.i18n);
    if (typeof value === 'string') el.textContent = value;
  });

  ATTR_TARGETS.forEach((attr) => {
    const dataAttr = `data-i18n-${attr}`;
    root.querySelectorAll(`[${dataAttr}]`).forEach((el) => {
      const value = lookup(el.getAttribute(dataAttr));
      if (typeof value === 'string') el.setAttribute(attr, value);
    });
  });

  // Toggle inline bilingual blocks (e.g. story bodies) if marked.
  root.querySelectorAll('[data-lang-only]').forEach((el) => {
    el.hidden = el.dataset.langOnly !== state.lang;
  });
}

async function loadDict(lang) {
  const res = await fetch(`/locales/${lang}.json`);
  if (!res.ok) throw new Error(`Locale ${lang} failed: ${res.status}`);
  return res.json();
}

/** Switch language, persist, re-render, notify. */
export async function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  try {
    state.dict = await loadDict(lang);
  } catch (err) {
    console.error('[i18n]', err);
    return;
  }
  state.lang = lang;
  try {
    localStorage.setItem(I18N_STORAGE_KEY, lang);
  } catch {
    /* private mode — non-fatal */
  }
  document.documentElement.setAttribute('lang', lang);
  applyTranslations();
  updateSwitcherUI();
  document.dispatchEvent(new CustomEvent('tb:langchange', { detail: { lang } }));
}

/** Reflect current language on every switcher button (header + fallbacks). */
function updateSwitcherUI() {
  document.querySelectorAll('.lang-switcher__btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === state.lang));
  });
}

/** Wire click handling once via delegation (header is injected late). */
function bindSwitcher() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-switcher__btn');
    if (btn && btn.dataset.lang) setLang(btn.dataset.lang);
  });
}

export async function initI18n() {
  let saved = null;
  try {
    saved = localStorage.getItem(I18N_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const initial = SUPPORTED.includes(saved) ? saved : DEFAULT_LANG;
  bindSwitcher();
  await setLang(initial);
}

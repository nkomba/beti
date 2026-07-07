# Tribu Beti — Héritage & Culture (tribubeti.org)

A bilingual (French / English) cultural heritage website for the **Beti, Bulu, Ewondo, Fang** and related peoples of southern Cameroon. Built with vanilla HTML5, CSS3 and ES6+ JavaScript — no frameworks — and deployable as a static site on Cloudflare Pages.

French is the primary language; English is secondary.

---

## 1. Project overview

The site documents and celebrates:

History and migrations of the Beti-Fang (Beti-Pahuin) peoples, their languages (Ewondo, Bulu, Fang, Eton, Bebele, Mengisa) with interactive learning modules, traditions (Mvett epic, Bikutsi music, dances, rites of passage), traditional games (Songo, Abbia, riddles), a photo gallery, and a library of folktales and oral tradition.

> **Content review:** cultural text was written in good faith from published sources. Anything uncertain is flagged in the HTML with `<!-- VERIFY: ... -->` comments. Please have community elders and scholars review before publishing.

## 2. Run locally

The site uses `fetch()` for layouts, locales and registries, so it needs a local HTTP server (opening `index.html` via `file://` only gives a degraded fallback).

```bash
cd C:\Beti
python -m http.server 8000
# then open http://localhost:8000
```

Or use the VS Code **Live Server** extension (right-click `index.html` → "Open with Live Server").

## 3. Project structure

```
C:\Beti\
├── index.html               Homepage
├── service-worker.js        Offline cache (root scope — see note below)
├── wrangler.toml            Cloudflare Pages config
├── pages/                   All interior pages
├── locales/                 en.json / fr.json translations
├── _layouts/                Shared header/footer fragments (fetched by main.js)
└── assets/
    ├── css/                 reset, variables, base, components, layout, responsive
    ├── js/                  main, i18n, gallery, audio-player, lessons
    ├── img/                 hero, regions, daily-life, ceremonies, portraits, icons
    │   └── registry.json    Image key → URL mapping
    ├── audio/               mvett, drums, songs, lessons
    │   └── registry.json    Audio key → file mapping
    ├── fonts/               (self-hosted subsets, optional)
    └── favicon/
```

**Note on the service worker:** the original spec placed it in `assets/js/`, but a service worker can only control pages within its own directory scope. It therefore lives at the project root (`/service-worker.js`).

## 4. Replacing placeholder images

Every `<img>` carries a `data-image-key`. Keys are resolved in **`assets/img/registry.json`**. To swap a placeholder for a real photo:

1. Drop the photo into the right folder using the naming convention `NN-short-description.jpg` (e.g. `assets/img/regions/01-centre-region.jpg`).
2. Edit `assets/img/registry.json` and change that key's `src` from the picsum URL to the local path, e.g.

```json
"region-centre": { "src": "/assets/img/regions/01-centre-region.jpg" }
```

No HTML changes needed. Alt text is bilingual and lives in the locale files (`data-i18n-alt`).

## 5. Adding audio files

Same pattern: audio elements carry `data-audio-key`, resolved in **`assets/audio/registry.json`**. Entries with an empty `src` display an "Audio coming soon / Audio bientôt disponible" message. To activate a track:

```json
"mvett-01": { "src": "/assets/audio/mvett/track01.mp3", "title": "Mvett — extrait 1" }
```

Use MP3 (broadest support), ideally 128–192 kbps.

## 6. Adding or editing stories & content

Story cards and bodies are in `pages/stories.html`. Each story is an `<article class="story">` with the full French text in a `.story__body--fr` block and English in `.story__body--en`. Copy an existing `<article>` as a template, give it a new `id`, and add its card in the card grid above. Titles/excerpts go through i18n keys (`stories.sN.*` in both locale files).

## 7. Editing translations

All UI strings live in `locales/fr.json` and `locales/en.json` (nested keys, e.g. `home.heroTitle`). Rules: every key must exist in **both** files; keys are referenced in HTML via `data-i18n="key.path"` (text), `data-i18n-alt`, `data-i18n-placeholder`, `data-i18n-aria-label`, `data-i18n-content` (attributes). Validate JSON after editing (e.g. https://jsonlint.com).

## 8. Deploying to Cloudflare Pages

1. Push the project to a Git repository (GitHub/GitLab).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Framework preset: **None**. Build command: *(empty)*. Build output directory: `/`.
4. Deploy, then add the custom domain `tribubeti.org` under the project's **Custom domains** tab.

Direct upload also works: `npx wrangler pages deploy . --project-name=tribubeti`.

## 9. Browser support

Chrome/Edge ≥ 90, Firefox ≥ 88, Safari ≥ 14 (iOS 14+). Uses CSS custom properties, Grid/Flexbox, ES modules, `fetch`, `IntersectionObserver` — all baseline in those versions. No IE support.

## 10. Contributing

Community contributions are the heart of this project.

Photos: send originals with a caption (place, date, context) and confirmation you have the right to share them. Stories & proverbs: send text in any of French, English, Ewondo, Bulu, Fang, Eton — ideally with a recording of an elder narrating. Corrections: anything flagged `<!-- VERIFY -->`, or any error you spot — corrections from native speakers and elders take priority.

Contact details are on the site's Contact page.

## 11. License

Recommended: **CC BY-SA 4.0** for cultural content (text, images, audio) — it keeps community knowledge shareable while requiring attribution. Code may be MIT-licensed. Note that individual storytellers and photographers retain moral rights; always credit narrators and communities by name where they consent.

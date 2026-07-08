/**
 * lessons.js — interactive language lessons (learn-language.html).
 *
 * - Lesson data below (Ewondo, the most widely used Beti lect, as the base).
 *   VERIFY: phrases were compiled from published word lists; tones and
 *   spellings should be reviewed by native speakers before publication.
 * - Progress tracked in localStorage ("tb-lessons").
 * - Quiz mode: multiple-choice matching phrase → translation.
 * - "Phrase of the day" rotating widget.
 */

import { t, getLang } from './i18n.js';

const PROGRESS_KEY = 'tb-lessons';

/**
 * Lesson data. Each item: Beti-language phrase, phonetic guide,
 * French + English translations, and an audio registry key (placeholder).
 */
const LESSONS = {
  greetings: [
    { beti: 'Mbolo', phon: 'm-BO-lo', fr: 'Bonjour / Salut', en: 'Hello / Greetings', audio: 'lesson-greet-01' },
    { beti: 'Mbəmbə kídí', phon: 'mbem-be KI-di', fr: 'Bonjour (le matin)', en: 'Good morning', audio: 'lesson-greet-02' },
    { beti: 'Mbəmbə amos', phon: 'mbem-be A-mos', fr: 'Bonne journée', en: 'Good day', audio: 'lesson-greet-03' },
    { beti: 'Mbəmbə alú', phon: 'mbem-be a-LU', fr: 'Bonne nuit', en: 'Good night', audio: 'lesson-greet-04' },
    { beti: 'Ō ne mvo̱é?', phon: 'o ne MVO-eh', fr: 'Comment vas-tu ?', en: 'How are you?', audio: 'lesson-greet-05' },
    { beti: 'Me ne mvo̱é', phon: 'me ne MVO-eh', fr: 'Je vais bien', en: 'I am well', audio: 'lesson-greet-06' },
    { beti: 'Akiba', phon: 'a-KI-ba', fr: 'Merci', en: 'Thank you', audio: 'lesson-greet-07' },
    { beti: 'Ka yəm', phon: 'ka YEM', fr: 'Au revoir', en: 'Goodbye', audio: 'lesson-greet-08' },
  ],
  numbers: [
    { beti: 'fɔ́ɔ́', phon: 'FOH', fr: 'un (1)', en: 'one (1)', audio: 'lesson-num-01' },
    { beti: 'bɛ̌', phon: 'BEH', fr: 'deux (2)', en: 'two (2)', audio: 'lesson-num-02' },
    { beti: 'lá', phon: 'LAH', fr: 'trois (3)', en: 'three (3)', audio: 'lesson-num-03' },
    { beti: 'nyìnì', phon: 'NYI-ni', fr: 'quatre (4)', en: 'four (4)', audio: 'lesson-num-04' },
    { beti: 'tán', phon: 'TAHN', fr: 'cinq (5)', en: 'five (5)', audio: 'lesson-num-05' },
    { beti: 'saməna', phon: 'sa-me-NA', fr: 'six (6)', en: 'six (6)', audio: 'lesson-num-06' },
    { beti: 'zamgbál', phon: 'zam-GBAL', fr: 'sept (7)', en: 'seven (7)', audio: 'lesson-num-07' },
    { beti: 'mwom', phon: 'MWOM', fr: 'huit (8)', en: 'eight (8)', audio: 'lesson-num-08' },
    { beti: 'ebúl', phon: 'e-BUL', fr: 'neuf (9)', en: 'nine (9)', audio: 'lesson-num-09' },
    { beti: 'awóm', phon: 'a-WOM', fr: 'dix (10)', en: 'ten (10)', audio: 'lesson-num-10' },
  ],
  family: [
    { beti: 'tará', phon: 'ta-RA', fr: 'père / papa', en: 'father / dad', audio: 'lesson-fam-01' },
    { beti: 'naná', phon: 'na-NA', fr: 'mère / maman', en: 'mother / mom', audio: 'lesson-fam-02' },
    { beti: 'mɔ́n', phon: 'MON', fr: 'enfant', en: 'child', audio: 'lesson-fam-03' },
    { beti: 'ndomezaŋ', phon: 'ndo-me-ZANG', fr: 'frère', en: 'brother', audio: 'lesson-fam-04' },
    { beti: 'kál', phon: 'KAL', fr: 'sœur (d’un homme)', en: 'sister (of a man)', audio: 'lesson-fam-05' },
    { beti: 'mbombó', phon: 'mbom-BO', fr: 'grand-parent / homonyme', en: 'grandparent / namesake', audio: 'lesson-fam-06' },
    { beti: 'nnóm', phon: 'NNOM', fr: 'mari', en: 'husband', audio: 'lesson-fam-07' },
    { beti: 'ŋgál', phon: 'NGAL', fr: 'épouse', en: 'wife', audio: 'lesson-fam-08' },
  ],
  phrases: [
    { beti: 'Ma yi mendim', phon: 'ma yi men-DIM', fr: 'Je veux de l’eau', en: 'I want water', audio: 'lesson-phr-01' },
    { beti: 'Ma kə o zaŋ', phon: 'ma ke o ZANG', fr: 'Je vais au marché', en: 'I am going to the market', audio: 'lesson-phr-02' },
    { beti: 'Zaá fá', phon: 'za-A FA', fr: 'Viens ici', en: 'Come here', audio: 'lesson-phr-03' },
    { beti: 'Ma də́ bidí', phon: 'ma de bi-DI', fr: 'Je mange (de la nourriture)', en: 'I am eating (food)', audio: 'lesson-phr-04' },
    { beti: 'Dzóé dama a ne…', phon: 'DZO-eh DA-ma a ne', fr: 'Je m’appelle…', en: 'My name is…', audio: 'lesson-phr-05' },
    { beti: 'Ma yəm kî', phon: 'ma yem KI', fr: 'Je ne sais pas', en: 'I don’t know', audio: 'lesson-phr-06' },
  ],
  proverbs: [
    {
      beti: 'Mɔ́n a yəmələ dzal, a yəmələ fə minlaŋ',
      phon: 'MON a ye-me-le DZAL',
      fr: 'L’enfant qui connaît son village connaît aussi ses histoires. (Qui connaît ses racines connaît sa voie.)',
      en: 'The child who knows the village also knows its stories. (Knowing your roots shows you your path.)',
      audio: 'lesson-prov-01',
    },
    {
      beti: 'Zən ése ya dulu, é ne ndəŋ',
      phon: 'ZEN e-se ya DU-lu',
      fr: 'Le chemin que l’on ne parcourt jamais devient broussaille. (Ce qu’on néglige se perd.)',
      en: 'A path never walked turns to bush. (What is neglected is lost.)',
      audio: 'lesson-prov-02',
    },
    {
      beti: 'Nnám ó së́ ki mbɔ́k',
      phon: 'NNAM o se ki MBOK',
      fr: 'Une seule main ne ficelle pas un paquet. (L’union fait la force.)',
      en: 'One hand alone cannot tie a bundle. (Unity is strength.)',
      audio: 'lesson-prov-03',
    },
  ],
  animals: [
    { beti: 'zɔ̌k', phon: 'ZOK', fr: 'éléphant', en: 'elephant', audio: 'lesson-ani-01' },
    { beti: 'ŋgi', phon: 'NGI', fr: 'gorille', en: 'gorilla', audio: 'lesson-ani-02' },
    { beti: 'kabát', phon: 'ka-BAT', fr: 'chèvre', en: 'goat', audio: 'lesson-ani-03' },
    { beti: 'kú', phon: 'KU', fr: 'poule', en: 'chicken / hen', audio: 'lesson-ani-04' },
    { beti: 'mvú', phon: 'MVU', fr: 'chien', en: 'dog', audio: 'lesson-ani-05' },
    { beti: 'kós', phon: 'KOS', fr: 'poisson', en: 'fish', audio: 'lesson-ani-06' },
  ],
  food: [
    { beti: 'bidí', phon: 'bi-DI', fr: 'nourriture', en: 'food', audio: 'lesson-food-01' },
    { beti: 'mendim', phon: 'men-DIM', fr: 'eau', en: 'water', audio: 'lesson-food-02' },
    { beti: 'fɔ́n', phon: 'FON', fr: 'maïs', en: 'maize / corn', audio: 'lesson-food-03' },
    { beti: 'mbɔ́ŋ', phon: 'MBONG', fr: 'manioc', en: 'cassava', audio: 'lesson-food-04' },
    { beti: 'odzoé', phon: 'o-DZO-eh', fr: 'arachide', en: 'peanut / groundnut', audio: 'lesson-food-05' },
    { beti: 'ekwán', phon: 'e-KWAN', fr: 'légumes (feuilles)', en: 'leafy vegetables', audio: 'lesson-food-06' },
  ],
};

const CATEGORY_ORDER = ['greetings', 'numbers', 'family', 'phrases', 'proverbs', 'animals', 'food'];

/* ------------------------------ Progress -------------------------------- */

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* ignore */
  }
}

function updateProgressBar() {
  const progress = getProgress();
  const done = CATEGORY_ORDER.filter((c) => progress[c]).length;
  const pct = Math.round((done / CATEGORY_ORDER.length) * 100);
  const fill = document.querySelector('.progress-bar__fill');
  const bar = document.querySelector('.progress-bar');
  const label = document.querySelector('[data-progress-label]');
  if (fill) fill.style.width = `${pct}%`;
  if (bar) bar.setAttribute('aria-valuenow', String(pct));
  if (label) {
    label.textContent = `${done} / ${CATEGORY_ORDER.length} — ${pct}%`;
  }
}

/* ------------------------------- Rendering ------------------------------ */

function translationFor(item) {
  return getLang() === 'en' ? item.en : item.fr;
}

function renderCategory(category) {
  const host = document.querySelector(`[data-lesson-list="${category}"]`);
  if (!host) return;
  host.innerHTML = '';

  LESSONS[category].forEach((item) => {
    const card = document.createElement('div');
    card.className = 'lesson-card';

    const beti = document.createElement('p');
    beti.className = 'lesson-card__beti';
    beti.setAttribute('lang', 'ewo');
    beti.textContent = item.beti;

    const phon = document.createElement('p');
    phon.className = 'lesson-card__phonetic';
    phon.textContent = `[${item.phon}]`;

    const row = document.createElement('div');
    row.className = 'lesson-card__row';

    const trans = document.createElement('p');
    trans.textContent = `🇫🇷 ${item.fr} · 🇬🇧 ${item.en}`;

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'btn btn--ghost btn--sm';
    playBtn.textContent = '🔊';
    playBtn.setAttribute('aria-label', t('common.play', 'Lecture'));
    playBtn.addEventListener('click', () => {
      // Placeholder audio path — real files land in /assets/audio/lessons/.
      const audio = new Audio(`/assets/audio/lessons/${item.audio}.mp3`);
      audio.play().catch(() => {
        playBtn.insertAdjacentHTML(
          'afterend',
          `<span class="audio-player__fallback">${t('common.audioComingSoon', 'Audio bientôt disponible')}</span>`
        );
        playBtn.disabled = true;
      });
    });

    row.append(trans, playBtn);
    card.append(beti, phon, row);
    host.appendChild(card);
  });

  // "Mark complete" button state.
  const completeBtn = document.querySelector(`[data-complete="${category}"]`);
  if (completeBtn) {
    const progress = getProgress();
    completeBtn.textContent = progress[category]
      ? t('learn.completed', 'Terminé ✓')
      : t('learn.markComplete', 'Marquer comme terminé');
  }
}

function initCompleteButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-complete]');
    if (!btn) return;
    const category = btn.dataset.complete;
    const progress = getProgress();
    progress[category] = !progress[category];
    saveProgress(progress);
    renderCategory(category);
    updateProgressBar();
  });
}

/* ------------------------------ Phrase of day --------------------------- */

function renderPhraseOfDay() {
  const widget = document.querySelector('[data-phrase-of-day]');
  if (!widget) return;
  const all = CATEGORY_ORDER.flatMap((c) => LESSONS[c]);
  const item = all[Math.floor(Date.now() / 86400000) % all.length];
  widget.querySelector('.word-of-day__word').textContent = item.beti;
  widget.querySelector('.word-of-day__phonetic').textContent = `[${item.phon}]`;
  widget.querySelector('.word-of-day__translation').textContent = translationFor(item);
}

/* --------------------------------- Quiz --------------------------------- */

const quizState = { questions: [], index: 0, score: 0 };

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuiz() {
  const pool = shuffle(CATEGORY_ORDER.flatMap((c) => LESSONS[c])).slice(0, 8);
  quizState.questions = pool.map((item) => {
    const wrong = shuffle(
      CATEGORY_ORDER.flatMap((c) => LESSONS[c]).filter((x) => x !== item)
    ).slice(0, 3);
    return { item, options: shuffle([item, ...wrong]) };
  });
  quizState.index = 0;
  quizState.score = 0;
}

function renderQuizQuestion() {
  const host = document.querySelector('[data-quiz]');
  if (!host) return;
  const q = quizState.questions[quizState.index];

  if (!q) {
    host.innerHTML = `
      <p class="quiz__score">${t('learn.quizScore', 'Score')} : ${quizState.score} / ${quizState.questions.length}</p>
      <button type="button" class="btn btn--primary" data-quiz-restart>${t('learn.quizRestart', 'Recommencer')}</button>`;
    return;
  }

  host.innerHTML = '';
  const prompt = document.createElement('p');
  prompt.innerHTML = `${t('learn.quizPrompt', 'Que signifie')} <strong class="beti-text" lang="ewo">${q.item.beti}</strong> ?`;
  host.appendChild(prompt);

  q.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz__option';
    btn.textContent = translationFor(opt);
    btn.addEventListener('click', () => {
      const correct = opt === q.item;
      btn.classList.add(correct ? 'quiz__option--correct' : 'quiz__option--wrong');
      if (correct) quizState.score += 1;
      host.querySelectorAll('.quiz__option').forEach((b) => {
        b.disabled = true;
        if (b !== btn && b.textContent === translationFor(q.item)) {
          b.classList.add('quiz__option--correct');
        }
      });
      setTimeout(() => {
        quizState.index += 1;
        renderQuizQuestion();
      }, 900);
    });
    host.appendChild(btn);
  });
}

function initQuiz() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-quiz-start]') || e.target.closest('[data-quiz-restart]')) {
      buildQuiz();
      renderQuizQuestion();
    }
  });
}

/* --------------------------------- Boot --------------------------------- */

function renderAll() {
  CATEGORY_ORDER.forEach(renderCategory);
  renderPhraseOfDay();
  updateProgressBar();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('[data-lesson-list]')) return;
  renderAll();
  initCompleteButtons();
  initQuiz();
  document.addEventListener('tb:langchange', renderAll);
});

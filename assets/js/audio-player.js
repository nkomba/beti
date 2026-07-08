/**
 * audio-player.js — custom accessible audio player.
 *
 * Supports two source types via registry.json:
 *   1. Local audio:  { "mvett-01": { "src": "/assets/audio/mvett/track01.mp3" } }
 *   2. YouTube:     { "mvett-01": { "youtube": "13w6XAM1slA", "title": "…" } }
 */

import { t } from './i18n.js';

let registry = {};

async function loadRegistry() {
  try {
    const res = await fetch('/assets/audio/registry.json');
    if (res.ok) registry = await res.json();
  } catch (err) {
    console.warn('[audio] registry unavailable', err);
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function buildPlayer(container) {
  const key = container.dataset.audioKey;
  const entry = registry[key];
  const titleText = (entry && entry.title) || container.dataset.title || '';

  container.innerHTML = '';

  const title = document.createElement('p');
  title.className = 'audio-player__title';
  title.textContent = titleText;
  container.appendChild(title);

  /* --- YouTube source --- */
  if (entry && entry.youtube) {
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '152';
    iframe.frameBorder = '0';
    iframe.src = 'https://www.youtube.com/embed/' + entry.youtube;
    iframe.title = titleText;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.style.borderRadius = 'var(--radius-md, 8px)';
    iframe.style.display = 'block';
    container.appendChild(iframe);
    return;
  }

  /* --- Placeholder state: no source → "coming soon" --- */
  if (!entry || !entry.src) {
    container.classList.add('audio-player--unavailable');
    const note = document.createElement('p');
    note.className = 'audio-player__fallback';
    note.dataset.i18n = 'common.audioComingSoon';
    note.textContent = t('common.audioComingSoon', 'Audio bientôt disponible');
    container.appendChild(note);
    return;
  }

  /* --- Native audio source (.mp3 etc.) --- */
  const audio = new Audio();
  audio.preload = 'none';
  audio.src = entry.src;

  const controls = document.createElement('div');
  controls.className = 'audio-player__controls';

  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'audio-player__play';
  play.textContent = '►';
  play.setAttribute('aria-label', t('common.play', 'Lecture'));

  const current = document.createElement('span');
  current.className = 'audio-player__time';
  current.textContent = '0:00';

  const seek = document.createElement('input');
  seek.type = 'range';
  seek.className = 'audio-player__seek';
  seek.min = '0';
  seek.max = '100';
  seek.value = '0';
  seek.setAttribute('aria-label', t('a11y.seek', 'Position de lecture'));

  const duration = document.createElement('span');
  duration.className = 'audio-player__time';
  duration.textContent = '0:00';

  const volume = document.createElement('input');
  volume.type = 'range';
  volume.className = 'audio-player__volume';
  volume.min = '0';
  volume.max = '1';
  volume.step = '0.05';
  volume.value = '1';
  volume.setAttribute('aria-label', t('a11y.volume', 'Volume'));

  controls.append(play, current, seek, duration, volume);
  container.appendChild(controls);

  play.addEventListener('click', () => {
    if (audio.paused) {
      document.querySelectorAll('audio').forEach((other) => other.pause());
      audio.play().catch(() => {
        container.classList.add('audio-player--unavailable');
        const note = document.createElement('p');
        note.className = 'audio-player__fallback';
        note.textContent = t('common.audioComingSoon', 'Audio bientôt disponible');
        container.appendChild(note);
      });
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => {
    play.textContent = '❚❚';
    play.setAttribute('aria-label', t('common.pause', 'Pause'));
  });

  audio.addEventListener('pause', () => {
    play.textContent = '►';
    play.setAttribute('aria-label', t('common.play', 'Lecture'));
  });

  audio.addEventListener('loadedmetadata', () => {
    duration.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    current.textContent = formatTime(audio.currentTime);
    if (audio.duration) {
      seek.value = String((audio.currentTime / audio.duration) * 100);
    }
  });

  seek.addEventListener('input', () => {
    if (audio.duration) {
      audio.currentTime = (Number(seek.value) / 100) * audio.duration;
    }
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
  });

  audio.addEventListener('error', () => {
    controls.remove();
    container.classList.add('audio-player--unavailable');
    const note = document.createElement('p');
    note.className = 'audio-player__fallback';
    note.textContent = t('common.audioComingSoon', 'Audio bientôt disponible');
    container.appendChild(note);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const players = document.querySelectorAll('[data-audio-key]');
  if (!players.length) return;
  await loadRegistry();
  players.forEach(buildPlayer);

  document.addEventListener('tb:langchange', () => {
    players.forEach(buildPlayer);
  });
});
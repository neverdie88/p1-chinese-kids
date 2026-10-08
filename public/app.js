import { course, lessons } from './curriculum.mjs';
import { createStore } from './progress-store.mjs';
import { speak, stopSpeech, getMandarinVoices, createRecognition, matchesTranscript } from './speech.mjs';
import { activityKeys, wordChoices, sentenceTiles, correctSentence, lessonProgress, nextActivity, reviewWords } from './exercises.mjs';
import { pinyin } from './vendor/pinyin-pro.mjs';

const store = createStore();
const app = document.querySelector('#app');
const dialog = document.querySelector('#word-dialog');
const labels = { learn: 'Learn', write: 'Write', listen: 'Listen', build: 'Build', speak: 'Speak' };
const icons = {
  book: '<path d="M12 6c-3-3-7-3-10-2v15c3-1 7-1 10 2m0-15c3-3 7-3 10-2v15c-3-1-7-1-10 2V6Z"/>',
  review: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  pencil: '<path d="m15 4 5 5M3 21l5-1L21 7a2 2 0 0 0-5-5L3 15v6Z"/>',
  sound: '<path d="M11 4 5 9H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  blocks: '<rect x="3" y="12" width="8" height="8" rx="2"/><rect x="13" y="12" width="8" height="8" rx="2"/><rect x="8" y="2" width="8" height="8" rx="2"/>',
  mic: '<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M4 10v2a8 8 0 0 0 16 0v-2M12 20v3m-4 0h8"/>',
  settings: '<circle cx="12" cy="12" r="4"/><path d="m12 2 2 3 4-1 1 4 3 2-2 3 1 4-4 1-2 3-3-2-4 1-1-4-3-2 2-3-1-4 4-1 2-3Z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
};
const activityIcon = { learn: 'book', write: 'pencil', listen: 'sound', build: 'blocks', speak: 'mic' };
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const zh = text => `<span lang="zh-CN">${esc(text)}</span>`;
const getLesson = id => lessons.find(lesson => lesson.id === Number(id)) || lessons[0];
const progress = () => store.get();
const record = id => progress().lessons[id] || {};
const state = { page: 'home', book: '1A', lessonId: progress().lastLesson, activity: 'learn', correct: false, wrong: null, feedback: '', selected: [], mistakes: 0, reveal: false, practiced: false, reviewIndex: 0, reviewReveal: false, reviewDeck: [], recording: false, resetConfirm: false, importText: null };
let writer = null;
let recognition = null;
let toastTimer;
let canvasClear = () => {};

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, 4500);
}

function play(text) {
  if (state.recording) return toast('Finish recording before listening.');
  speak(text, { ...progress().settings, onError: () => toast('Audio is unavailable here. You can read the word, or choose another Mandarin voice in Settings.') });
}

function cleanup() {
  stopSpeech();
  recognition?.abort();
  recognition = null;
  state.recording = false;
  writer?.pauseAnimation?.();
  writer = null;
}

function resetQuestion() {
  state.correct = false;
  state.wrong = null;
  state.feedback = '';
  state.selected = [];
  state.reveal = false;
}

function route() {
  cleanup();
  resetQuestion();
  state.mistakes = 0;
  state.practiced = false;
  const parts = location.hash.slice(1).split('/');
  if (parts[0] === 'lesson' && /^\d+$/.test(parts[1]) && lessons.some(l => l.id === Number(parts[1]))) {
    state.page = 'lesson';
    state.lessonId = Number(parts[1]);
    store.setLastLesson(state.lessonId);
    state.book = getLesson(state.lessonId).book;
    state.activity = activityKeys.includes(parts[2]) ? parts[2] : nextActivity(record(state.lessonId));
    const evidence = record(state.lessonId).evidence?.[state.activity];
    state.mistakes = evidence?.mistakes || 0;
    state.practiced = evidence?.practiced || false;
  } else if (['review', 'practice', 'settings', 'sources'].includes(parts[0])) {
    state.page = parts[0];
    if (state.page === 'review') {
      state.reviewDeck = reviewWords(lessons, progress());
      state.reviewIndex = 0;
      state.reviewReveal = false;
    }
  } else {
    state.page = 'home';
    if (['1A', '1B'].includes(parts[1])) state.book = parts[1];
  }
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelector('#main')?.focus({ preventScroll: true });
}

function navigate(hash) {
  if (location.hash === `#${hash}`) route();
  else location.hash = hash;
}

function openLesson(id, activity) {
  navigate(`lesson/${id}/${activity || nextActivity(record(id))}`);
}

function header() {
  const stars = Object.values(progress().lessons).reduce((sum, item) => sum + item.stars, 0);
  const nav = [['home', 'book', 'Learn'], ['review', 'review', 'Review'], ['practice', 'pencil', 'Practice'], ['settings', 'settings', 'Settings']];
  return `<header class="header shell"><button class="brand" data-action="nav" data-page="home" aria-label="Little Lantern home"><span class="brand-mark" lang="zh-CN">灯</span><span><strong>Little Lantern</strong><small>Singapore · Primary 1</small></span></button><nav class="nav" aria-label="Main navigation">${nav.map(([page, image, title]) => `<button data-action="nav" data-page="${page}" class="${state.page === page || (page === 'home' && state.page === 'lesson') ? 'active' : ''}" ${state.page === page ? 'aria-current="page"' : ''}>${icon(image)}${title}</button>`).join('')}</nav><div class="header-star" aria-label="${stars} learning stars"><span class="star">★</span>${stars}<span class="small">stars</span></div></header>`;
}

function saved() {
  return `<span class="save-line"><span class="save-dot"></span>${store.persistent ? 'Progress saved on this device' : 'Session only · export to keep progress'}</span>`;
}

function footer() {
  return `<footer class="footer shell"><span>Little steps. Bright beginnings. <span lang="zh-CN">每天学一点。</span></span><div class="row">${saved()}<button class="text-btn" data-action="nav" data-page="sources">For grown-ups & sources</button></div></footer>`;
}

function home() {
  const all = progress();
  const resume = getLesson(all.lastLesson);
  const started = Object.values(all.lessons).some(item => item.learned?.length || item.completed?.length || Object.values(item.checkpoint || {}).some(Boolean));
  const finished = lessons.filter(l => lessonProgress(all.lessons[l.id]).done === 5).length;
  const words = reviewWords(lessons, all).length;
  const completed = Object.values(all.lessons).reduce((sum, item) => sum + lessonProgress(item).done, 0);
  return `<section class="hero"><div><div class="eyebrow">Your first Chinese adventure</div><h1>A little Chinese.<br>A <em>bright beginning.</em></h1><p>Meet new words, make sentences, and grow your confidence. One small step at a time.</p><div class="hero-actions"><button class="btn primary" data-action="lesson" data-id="${resume.id}">${started ? 'Keep learning' : 'Let’s begin'} ${icon('arrow')}</button><span class="hero-tag">${started ? `Lesson ${resume.id} · ${esc(resume.english)}` : 'Start with lesson 1 · 5 little activities'}</span></div></div><div class="hero-visual" aria-hidden="true"><div class="orbit"></div><img class="mascot" src="./lantern.svg" alt=""><span class="float-word one">你好</span><span class="float-word two">一起学</span><span class="float-word three">加油!</span><span class="sparkle">✦</span><span class="sparkle two">✦</span></div></section>
  <section class="stats" aria-label="Your learning progress"><div class="stat"><span class="stat-icon">📖</span><div><strong>${finished} / 19</strong><span>lessons explored</span></div></div><div class="stat"><span class="stat-icon">🌱</span><div><strong>${words}</strong><span>words in your garden</span></div></div><div class="stat"><span class="stat-icon">✨</span><div><strong>${completed}</strong><span>activities completed</span></div></div></section>
  <section aria-labelledby="journey-title"><div class="section-heading between"><div><span class="eyebrow">One lesson at a time</span><h2 id="journey-title">Your learning journey</h2><p>Pick a lesson. Every little bit counts.</p></div><div class="segmented" aria-label="Choose a book">${['1A', '1B'].map(book => `<button data-action="book" data-book="${book}" class="${state.book === book ? 'active' : ''}" aria-pressed="${state.book === book}">${book}</button>`).join('')}</div></div><div class="course-label"><span>BOOK ${state.book} · ${state.book === '1A' ? 'HELLO, MY WORLD' : 'GROWING TOGETHER'}</span><span lang="zh-CN">欢乐伙伴 2.0</span></div><div class="lesson-grid">${lessons.filter(l => l.book === state.book).map(l => {
    const p = lessonProgress(all.lessons[l.id]);
    const current = l.id === resume.id;
    return `<button class="lesson-card ${current ? 'current' : ''}" data-action="lesson" data-id="${l.id}" aria-label="Lesson ${l.id}: ${esc(l.title)}. ${esc(l.english)}. ${p.done} of 5 activities completed"><div class="between"><span class="lesson-icon" aria-hidden="true">${l.emoji}</span><div><span class="lesson-number">Lesson ${String(l.id).padStart(2, '0')}</span>${p.done === 5 ? '<br><span class="badge done">Completed ✓</span>' : current ? '<br><span class="badge">Your next step</span>' : ''}</div></div><div><h3 class="lesson-title" lang="zh-CN">${esc(l.title)}</h3><div class="lesson-english">${esc(l.english)}</div></div><div class="card-bottom"><div class="progress-track" aria-hidden="true"><span style="width:${p.percent}%"></span></div><small>${p.done} / 5 activities</small><span class="arrow-circle" aria-hidden="true">↗</span></div></button>`;
  }).join('')}</div></section><aside class="tip-strip"><span aria-hidden="true">💛</span><div><strong>A few happy minutes go a long way.</strong><p>Listen together, try a word aloud, and celebrate the effort. You can always come back and try again.</p></div></aside>`;
}

function totalFor(lesson, activity) {
  if (activity === 'learn') return lesson.focus.length + lesson.sentences.length;
  if (activity === 'write') return lesson.writing.length;
  if (activity === 'listen') return lesson.focus.length;
  return lesson.sentences.length;
}

function currentIndex(lesson = getLesson(state.lessonId)) {
  return Math.min(record(lesson.id).checkpoint?.[state.activity] || 0, totalFor(lesson, state.activity));
}

function activityTop(title, index, total) {
  return `<div class="activity-top"><span class="eyebrow">${esc(title)} · ${index + 1} of ${total}</span><div class="step-progress" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<span class="${i < index ? 'past' : i === index ? 'now' : ''}"></span>`).join('')}</div></div>`;
}

function subtitles(item, forceEnglish = false) {
  const settings = progress().settings;
  return `${settings.showPinyin ? `<div class="pinyin">${esc(item.pinyin)}</div>` : ''}${settings.showEnglish || forceEnglish ? `<div class="translation">${esc(item.english ?? item.en)}</div>` : ''}`;
}

function feedback() {
  return `<p class="feedback ${state.correct ? 'good' : state.feedback ? 'retry' : ''}" role="status" aria-live="polite">${esc(state.feedback)}</p>`;
}

function completeView(lesson) {
  const done = record(lesson.id).completed || [];
  const next = activityKeys.find(a => !done.includes(a));
  const nextLesson = lessons.find(l => l.id === lesson.id + 1);
  const stars = record(lesson.id).activityStars?.[state.activity] || 0;
  return `<section class="panel activity-panel completed-panel"><div class="completed-art" aria-hidden="true">${done.length === 5 ? '🏮' : '🌟'}</div><span class="eyebrow">A little more confident</span><h2>${done.length === 5 ? 'Look how far you’ve come!' : `${labels[state.activity]} practice complete!`}</h2><div class="completion-stars" aria-label="${stars} best stars for this activity">${'★'.repeat(stars)}${'☆'.repeat(Math.max(0, (['listen', 'build'].includes(state.activity) ? 3 : 1) - stars))}</div><p>${state.activity === 'speak' && stars === 0 ? 'Speaking is optional. Come back when you’re ready to practise aloud.' : 'Your progress is saved. Keep going, or take a little break — you’ve earned it.'}</p><div class="row">${next ? `<button class="btn primary" data-action="activity" data-activity="${next}">Next: ${labels[next]} ${icon('arrow')}</button>` : nextLesson ? `<button class="btn primary" data-action="lesson" data-id="${nextLesson.id}">Meet lesson ${nextLesson.id} ${icon('arrow')}</button>` : '<button class="btn primary" data-action="nav" data-page="review">Visit your word garden</button>'}<button class="btn ghost" data-action="replay">Try again</button></div><button class="text-btn" data-action="nav" data-page="home">Back to your journey</button></section>`;
}

function learnActivity(lesson, index, total) {
  const isWord = index < lesson.focus.length;
  const item = isWord ? lesson.focus[index] : lesson.sentences[index - lesson.focus.length];
  const text = item.hanzi || item.zh;
  return `${activityTop(isWord ? 'Meet a word' : 'Let’s use it', index, total)}<h2 class="activity-title">${isWord ? 'A new word to know' : 'A little sentence to say'}</h2><p class="activity-sub">${isWord ? 'Listen, look, and say it with me.' : 'Listen first. Then have a go yourself.'}</p><div class="flash-card"><button class="icon-btn sound-corner" data-action="play" data-text="${esc(text)}" aria-label="Listen to ${esc(text)}">${icon('sound')}</button>${isWord ? `<div class="flash-emoji" aria-hidden="true">${item.emoji}</div>` : ''}<div class="flash-hanzi ${isWord ? '' : 'sentence'}" lang="zh-CN">${esc(text)}</div>${subtitles(item)}</div><div class="activity-bottom">${isWord ? `<button class="text-btn" data-action="word" data-word="${esc(text)}">Explore this word</button>` : '<span class="hint">These are original practice sentences.</span>'}<button class="btn primary" data-action="advance">${index === total - 1 ? 'Finish learning' : 'Got it! Next'} ${icon('arrow')}</button></div>`;
}

function writeActivity(lesson, index, total) {
  const char = lesson.writing[index];
  return `${activityTop('Give it a try', index, total)}<h2 class="activity-title">Let’s write ${zh(char)}</h2><p class="activity-sub">Watch the strokes, then trace with your finger or mouse.</p><div class="writing-area"><div class="trace-board"><span class="trace-guide" aria-hidden="true">${esc(char)}</span><canvas id="trace-canvas" width="680" height="680" aria-label="Trace ${esc(char)} with your finger or mouse"></canvas></div><div class="stroke-box"><div id="stroke-demo" aria-label="Stroke order for ${esc(char)}"></div><button class="btn small" data-action="animate">${icon('pencil')}Watch strokes</button><small>Slow and steady.<br>Start from the top.</small></div></div><p class="write-note">Free tracing is for practice. It does not grade handwriting. You can also write on paper.</p><p id="trace-feedback" class="feedback" role="status">Your turn — make your first stroke.</p><div class="activity-bottom"><button class="btn ghost small" data-action="clear-trace">Clear & retry</button><div class="row"><button class="text-btn" data-action="paper">I wrote on paper</button><button id="trace-next" class="btn primary" data-action="advance" disabled>${index === total - 1 ? 'Finish writing' : 'Next character'} ${icon('arrow')}</button></div></div>`;
}

function listenActivity(lesson, index, total) {
  const target = lesson.focus[index];
  const choices = wordChoices(target, lesson.focus, lesson.id * 71 + index);
  return `${activityTop('Listening ears', index, total)}<h2 class="activity-title">Which word did you hear?</h2><p class="activity-sub">Tap the speaker, then choose the matching Chinese word.</p><div class="listen-stage"><button class="listen-button" data-action="play" data-text="${esc(target.hanzi)}" aria-label="Play listening word">${icon('sound')}</button><p>Listen as many times as you like.</p>${state.reveal ? `<div class="audio-reveal" lang="zh-CN">${esc(target.hanzi)}</div><span class="small muted">Reading mode</span>` : '<button class="text-btn" data-action="reveal">No sound? Show the word</button>'}</div><div class="choices">${choices.map(word => `<button class="choice ${state.correct && word.hanzi === target.hanzi ? 'correct' : state.wrong === word.hanzi ? 'wrong' : ''}" data-action="answer" data-word="${esc(word.hanzi)}" ${state.correct ? 'disabled' : ''}><span class="zh" lang="zh-CN">${esc(word.hanzi)}</span></button>`).join('')}</div>${feedback()}<div class="activity-bottom"><span class="hint">A little listening, a little learning.</span><button class="btn primary" data-action="advance" ${state.correct ? '' : 'disabled'}>${index === total - 1 ? 'Finish listening' : 'Next word'} ${icon('arrow')}</button></div>`;
}

function buildActivity(lesson, index, total) {
  const sentence = lesson.sentences[index];
  const tiles = sentenceTiles(sentence, lesson.id * 131 + index);
  return `${activityTop('Sentence builder', index, total)}<h2 class="activity-title">Put the words together</h2><p class="activity-sub">Tap the words in order. Tap a chosen word to put it back.</p><div class="build-prompt">${esc(sentence.en)}</div><div class="answer-tray" aria-label="Your sentence">${state.selected.map(id => `<button class="tile" data-action="remove-tile" data-id="${id}" ${state.correct ? 'disabled' : ''} aria-label="Remove ${esc(sentence.pieces[id])}">${esc(sentence.pieces[id])}</button>`).join('')}</div><div class="tile-bank" aria-label="Words to choose">${tiles.map(tile => `<button class="tile" data-action="tile" data-id="${tile.id}" ${state.selected.includes(tile.id) || state.correct ? 'disabled' : ''} aria-label="Add ${esc(tile.text)}">${esc(tile.text)}</button>`).join('')}</div>${feedback()}${state.reveal ? `<div class="pinyin small">${esc(sentence.pinyin)}</div>` : ''}<div class="activity-bottom"><button class="text-btn" data-action="build-hint">${icon('sound')} Hear a hint</button>${state.correct ? `<button class="btn primary" data-action="advance">${index === total - 1 ? 'Finish building' : 'Next sentence'} ${icon('arrow')}</button>` : `<button class="btn mint" data-action="check-build" ${state.selected.length === sentence.pieces.length ? '' : 'disabled'}>Check my sentence ${icon('check')}</button>`}</div>`;
}

function speakActivity(lesson, index, total) {
  const sentence = lesson.sentences[index];
  const available = Boolean(globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);
  return `${activityTop('Your voice matters', index, total)}<h2 class="activity-title">Say it your way</h2><p class="activity-sub">Listen, take a breath, and try saying the sentence aloud.</p><div class="flash-card"><button class="icon-btn sound-corner" data-action="play" data-text="${esc(sentence.zh)}" aria-label="Listen to the sentence">${icon('sound')}</button><div class="flash-hanzi sentence" lang="zh-CN">${esc(sentence.zh)}</div>${subtitles(sentence)}</div><div class="speak-actions">${available ? `<button class="btn ${state.recording ? 'recording' : 'mint'}" data-action="record">${icon('mic')}${state.recording ? 'Stop recording' : 'Try with microphone'}</button>` : ''}<button class="btn" data-action="self-speak">I practised aloud ${icon('check')}</button></div><div class="speaking-note">${available ? 'Microphone practice uses your browser’s speech service, which may send audio to its provider. The app does not save recordings. It checks recognized words, not pronunciation or tones.' : 'Microphone recognition isn’t available in this browser. You can practise aloud with a grown-up and tap “I practised aloud”.'}</div>${feedback()}<div class="activity-bottom"><button class="text-btn" data-action="skip-speak">Skip for now</button><button class="btn primary" data-action="advance" ${state.correct ? '' : 'disabled'}>${index === total - 1 ? 'Finish speaking' : 'Next sentence'} ${icon('arrow')}</button></div>`;
}

function lessonView() {
  const lesson = getLesson(state.lessonId);
  const p = lessonProgress(record(lesson.id));
  const index = currentIndex(lesson);
  const total = totalFor(lesson, state.activity);
  const activities = { learn: learnActivity, write: writeActivity, listen: listenActivity, build: buildActivity, speak: speakActivity };
  return `<div class="breadcrumb"><button data-action="nav" data-page="home">← Your journey</button><span>/</span><span>Book ${lesson.book} · Lesson ${lesson.id}</span></div><div class="lesson-heading between"><div class="row"><span class="lesson-icon" aria-hidden="true">${lesson.emoji}</span><div><span class="eyebrow">A little about ${esc(lesson.theme)}</span><h1 lang="zh-CN">${esc(lesson.title)}</h1><p>${esc(lesson.english)} · ${p.done} of 5 activities complete</p></div></div>${saved()}</div><nav class="activity-tabs" aria-label="Lesson activities">${activityKeys.map(a => `<button class="activity-tab ${state.activity === a ? 'active' : ''} ${record(lesson.id).completed?.includes(a) ? 'complete' : ''}" data-action="activity" data-activity="${a}" ${state.activity === a ? 'aria-current="step"' : ''}>${icon(activityIcon[a])}<span>${labels[a]}</span>${record(lesson.id).completed?.includes(a) ? '<span class="tick">✓</span>' : ''}</button>`).join('')}</nav><div class="lesson-layout">${index >= total ? completeView(lesson) : `<section class="panel activity-panel">${activities[state.activity](lesson, index, total)}</section>`}<aside class="lesson-aside stack"><section class="panel side-panel"><div class="side-section"><span class="eyebrow">Your word pocket</span><h3>Little words, big ideas</h3><p>Tap a word to hear it and see its strokes.</p><div class="mini-word-list">${lesson.focus.map(word => `<button class="word-chip ${record(lesson.id).learned?.includes(word.hanzi) ? 'learned' : ''}" data-action="word" data-word="${esc(word.hanzi)}" aria-label="Explore ${esc(word.hanzi)}">${esc(word.hanzi)}</button>`).join('')}</div></div>${lesson.pinyinFocus ? `<div class="side-section"><span class="eyebrow">Pinyin corner</span><h3>${esc(lesson.pinyinFocus.label)}</h3><div class="tip-focus">${esc(lesson.pinyinFocus.syllables.join(' · '))}</div><p style="margin-top:10px">${esc(lesson.pinyinFocus.tip)}</p></div>` : ''}</section><section class="panel side-panel"><details class="source-details"><summary>Characters & lesson sources</summary><p>Recognition characters</p><div class="mini-word-list">${lesson.recognition.map(c => `<button class="word-chip" data-action="word" data-word="${esc(c)}">${esc(c)}</button>`).join('')}</div><p>Writing characters</p><div class="mini-word-list">${lesson.writing.map(c => `<span class="word-chip">${esc(c)}</span>`).join('')}</div><p>${esc(lesson.sourceNote)}</p><a href="${esc(lesson.sourceUrl)}" target="_blank" rel="noopener noreferrer">Lesson title reference ↗</a><a href="${esc(lesson.characterSourceUrl)}" target="_blank" rel="noopener noreferrer">Character list reference ↗</a></details><div class="side-section"><p>Short, original practice for Singapore P1. Take one activity at a time.</p></div></section></aside></div>`;
}

function reviewView() {
  const deck = state.reviewDeck;
  if (!deck.length) return `<div class="page-title"><span class="eyebrow">Small words. Growing confidence.</span><h1>Your word garden</h1><p>Every word you learn has a home here.</p></div><section class="panel empty-state"><span aria-hidden="true">🌱</span><h2>Let’s plant your first word</h2><p>Complete a word card in a lesson, then come back for a little review.</p><button class="btn primary" data-action="lesson" data-id="${state.lessonId}">Meet some words ${icon('arrow')}</button></section>`;
  const index = state.reviewIndex % deck.length;
  const word = deck[index];
  return `<div class="page-title"><span class="eyebrow">Small words. Growing confidence.</span><h1>Your word garden</h1><p>A little remembering helps your words grow. Words that need more practice come first.</p></div><div class="review-layout"><section class="panel review-card"><div class="activity-top"><span class="eyebrow">Word ${index + 1} of ${deck.length}</span><span class="pill">Lesson ${word.lessonId}</span></div><div class="flash-card"><button class="icon-btn sound-corner" data-action="play" data-text="${esc(word.hanzi)}" aria-label="Hear ${esc(word.hanzi)}">${icon('sound')}</button><div class="flash-hanzi" lang="zh-CN">${esc(word.hanzi)}</div>${state.reviewReveal ? `<div class="flash-emoji" aria-hidden="true">${word.emoji}</div>${subtitles(word, true)}` : '<p class="translation small" style="margin-top:20px">Can you remember what this word means?</p>'}</div>${state.reviewReveal ? '<p class="small muted">How did it feel? Be kind to yourself.</p><div class="between"><button class="btn" data-action="review-answer" data-correct="false">A little more practice</button><button class="btn mint" data-action="review-answer" data-correct="true">I remembered! ✓</button></div>' : '<div class="row" style="justify-content:center"><button class="btn primary" data-action="review-reveal">Show the meaning</button></div>'}</section><aside class="panel"><div class="between"><h2 style="font-size:1.3rem">${deck.length} growing words</h2><span aria-hidden="true">🌿</span></div><p class="small muted">Pick any word for a closer look.</p><div class="review-grid">${deck.map(w => `<button class="word-chip" data-action="word" data-word="${esc(w.hanzi)}">${esc(w.hanzi)}</button>`).join('')}</div></aside></div>`;
}

function practiceView() {
  const lesson = getLesson(state.lessonId);
  return `<div class="page-title"><span class="eyebrow">A little practice, your way</span><h1>Let’s try it again</h1><p>Choose a lesson and a small challenge. You can replay any activity without losing your best stars.</p></div><label class="practice-select"><span class="small">Choose your lesson</span><select id="practice-lesson">${lessons.map(l => `<option value="${l.id}" ${l.id === lesson.id ? 'selected' : ''}>${l.book} · ${l.id}. ${esc(l.title)} — ${esc(l.english)}</option>`).join('')}</select></label><div class="practice-grid">${[['listen', '👂', 'Listening ears', 'Listen closely and find the word. Replay the sound whenever you need.'], ['build', '🧩', 'Sentence builder', 'Put little words together to say something new.'], ['write', '✏️', 'Pencil time', 'Follow the strokes, then practise with your finger or on paper.']].map(([a, emoji, title, description]) => `<section class="panel practice-card"><span aria-hidden="true">${emoji}</span><h2>${title}</h2><p>${description}</p><button class="btn ${a === 'listen' ? 'primary' : ''}" data-action="practice-start" data-activity="${a}">Let’s practise ${icon('arrow')}</button></section>`).join('')}</div><aside class="tip-strip"><span aria-hidden="true">🏮</span><div><strong>Ready for a conversation?</strong><p>Open Speak in any lesson and try its sentences with someone at home.</p></div></aside>`;
}

function settingsView() {
  const settings = progress().settings;
  const voices = getMandarinVoices();
  return `<div class="page-title"><span class="eyebrow">Make yourself at home</span><h1>Your learning space</h1><p>A few small adjustments for the way you like to learn.</p></div><div class="settings-grid"><section class="panel"><h2 style="font-size:1.3rem">Reading & listening</h2><label class="setting-row"><span><strong>Show pinyin</strong><small>A little help with the sounds.</small></span><input type="checkbox" id="show-pinyin" ${settings.showPinyin ? 'checked' : ''}></label><label class="setting-row"><span><strong>Show English meanings</strong><small>Keep meanings alongside word and sentence cards.</small></span><input type="checkbox" id="show-english" ${settings.showEnglish ? 'checked' : ''}></label><label class="field"><span>Mandarin voice</span><select id="voice"><option value="">Automatic · Mandarin</option>${voices.map(voice => `<option value="${esc(voice.voiceURI)}" ${settings.voiceURI === voice.voiceURI ? 'selected' : ''}>${esc(voice.name)} (${esc(voice.lang)})</option>`).join('')}</select></label><label class="field"><span>Speaking speed · <output id="rate-label">${settings.rate.toFixed(2)}×</output></span><input id="rate" type="range" min="0.5" max="1.25" step="0.05" value="${settings.rate}"></label><button class="btn small" data-action="play" data-text="你好！我们一起学华文。">${icon('sound')}Try this voice</button><p class="small muted" style="margin:15px 0 0">Voices depend on your device. If there is no sound, install a Mandarin system voice or use the reading option in Listen.</p></section><div class="stack"><section class="panel"><h2 style="font-size:1.3rem">Keep your little steps</h2><p class="small muted">Progress stays in this browser on this device. Export a backup to move it to another browser or keep a copy.</p><div class="row"><button class="btn small" data-action="export">Save backup ↓</button><button class="btn small" data-action="import">Restore backup ↑</button></div><input type="file" id="import-file" accept=".json,application/json" hidden>${state.importText ? '<div class="reset-box"><p>Restore the selected backup? This replaces progress in this browser. Save a backup first if you want to keep the current progress.</p><div class="row"><button class="btn small" data-action="confirm-import">Restore this backup</button><button class="text-btn" data-action="cancel-import">Cancel</button></div></div>' : ''}<div class="setting-row"><span><strong>Start fresh</strong><small>Clear only this P1 app’s progress.</small></span><button class="text-btn danger" data-action="reset-ask">Reset</button></div>${state.resetConfirm ? '<div class="reset-box"><p>Save a backup first if you want to keep your progress. Reset this P1 app now?</p><div class="row"><button class="btn small danger" data-action="reset-confirm">Reset P1 progress</button><button class="text-btn" data-action="reset-cancel">Keep learning</button></div></div>' : ''}</section><section class="panel"><span class="eyebrow">For grown-ups</span><h2 style="font-size:1.3rem;margin-top:9px">Learning, not testing</h2><p class="small muted">This app uses original activities aligned to Singapore P1 standard Chinese. Tracing is free practice. Speech recognition checks words, not pronunciation or tones, and may use the browser provider’s online service.</p><button class="text-btn" data-action="nav" data-page="sources">Read about the curriculum & sources →</button></section></div></div>`;
}

function sourcesView() {
  return `<div class="page-title"><span class="eyebrow">For grown-ups</span><h1>A thoughtful place to begin</h1><p>Singapore Primary 1 standard Chinese, following the lesson sequence of <span lang="zh-CN">《欢乐伙伴 2.0》</span>, books 1A and 1B.</p></div><div class="settings-grid"><section class="panel"><h2 style="font-size:1.3rem">What children can practise</h2><p class="small muted">All 19 lesson themes have focus words, original everyday sentences, listening choices, sentence building, character tracing and optional speaking. Pinyin and English can be switched on or off.</p><p class="small muted">The activities are a companion to learning. They are independently written, not a digital reproduction of the textbook. Topic words and practice sentences can include helpful words beyond each lesson’s required character list.</p><div class="callout">No full textbook PDF is bundled. The character and lesson references are linked here and inside each lesson. This app is not an official MOE or publisher product.</div><h3 style="margin-top:25px">A gentle learning routine</h3><ol class="source-list"><li>Meet a few words and listen together.</li><li>Try writing one or two characters.</li><li>Build a sentence and say it to someone.</li><li>Return to the word garden for a short review.</li></ol></section><section class="panel"><h2 style="font-size:1.3rem">Curriculum references</h2><ul class="source-list">${course.sources.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a><p>${esc(source.note)}</p></li>`).join('')}</ul><a class="small" href="./ASSET-LICENSES.md" target="_blank" rel="noopener">Font & stroke-animation credits</a><div class="callout">Progress is stored locally. The microphone is optional. Playback voices and speech recognition availability vary by device and browser.</div></section></div>`;
}

function render() {
  const focused = document.activeElement;
  const focusData = focused?.matches?.('[data-action]') ? { ...focused.dataset } : null;
  writer?.pauseAnimation?.();
  writer = null;
  const pages = { home, lesson: lessonView, review: reviewView, practice: practiceView, settings: settingsView, sources: sourcesView };
  app.innerHTML = `${header()}<main id="main" class="main shell" tabindex="-1">${pages[state.page]()}</main>${footer()}`;
  document.title = state.page === 'lesson' ? `${getLesson(state.lessonId).title} · ${labels[state.activity]} · Little Lantern` : 'Little Lantern · Singapore P1 Chinese';
  if (state.page === 'lesson' && state.activity === 'write' && currentIndex() < getLesson(state.lessonId).writing.length) setupWriting();
  if (focusData) {
    const replacement = [...app.querySelectorAll('[data-action]')].find(button => !button.disabled && Object.entries(focusData).every(([key, value]) => button.dataset[key] === value));
    const tileFallback = ['tile', 'remove-tile'].includes(focusData.action)
      ? app.querySelector('[data-action=tile]:not(:disabled), [data-action=check-build]:not(:disabled)') : null;
    const continueFallback = ['answer', 'check-build', 'self-speak'].includes(focusData.action) && state.correct
      ? app.querySelector('[data-action=advance]:not(:disabled)') : null;
    (replacement || tileFallback || continueFallback)?.focus({ preventScroll: true });
  }
}

function makeWriter(element, char, size) {
  if (!globalThis.HanziWriter) { element.textContent = char; return null; }
  return globalThis.HanziWriter.create(element, char, {
    width: size, height: size, padding: 9, showCharacter: false, showOutline: true,
    strokeColor: '#cf6856', outlineColor: '#dedbce', strokeAnimationSpeed: 0.8, delayBetweenStrokes: 260,
    charDataLoader(character, onLoad, onError) {
      fetch(new URL(`./strokes/${encodeURIComponent(character)}.json`, import.meta.url))
        .then(response => { if (!response.ok) throw new Error('No stroke data'); return response.json(); }).then(onLoad).catch(onError);
    },
    onLoadCharDataError() { element.textContent = char; },
  });
}

function setupWriting() {
  const char = getLesson(state.lessonId).writing[currentIndex()];
  const element = document.querySelector('#stroke-demo');
  writer = makeWriter(element, char, element.clientWidth);
  const canvas = document.querySelector('#trace-canvas');
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let distance = 0;
  let last = null;
  let traced = false;
  function position(event) {
    const rect = canvas.getBoundingClientRect();
    return [(event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height];
  }
  canvas.addEventListener('pointerdown', event => {
    event.preventDefault();
    drawing = true;
    last = position(event);
    canvas.setPointerCapture(event.pointerId);
    ctx.beginPath(); ctx.moveTo(...last);
    ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#dc6b58';
  });
  canvas.addEventListener('pointermove', event => {
    if (!drawing) return;
    const next = position(event);
    distance += Math.hypot(next[0] - last[0], next[1] - last[1]);
    ctx.lineTo(...next); ctx.stroke(); last = next;
    if (!traced && distance > 25) {
      traced = true;
      document.querySelector('#trace-next').disabled = false;
      document.querySelector('#trace-feedback').textContent = 'Nice effort! Keep practising, or try the next character.';
    }
  });
  const end = () => { drawing = false; last = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvasClear = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    distance = 0; traced = false;
    document.querySelector('#trace-next').disabled = true;
    document.querySelector('#trace-feedback').textContent = 'A fresh start. Try the strokes again.';
  };
}

function openWord(text) {
  const lesson = getLesson(state.lessonId);
  const word = lesson.focus.find(w => w.hanzi === text) || lessons.flatMap(l => l.focus).find(w => w.hanzi === text);
  const contextReading = lesson.characterReadings?.[text];
  const contextExample = lesson.characterExamples?.[text];
  const reading = contextReading || word?.pinyin || pinyin(text);
  const characters = [...text].filter(char => /\p{Script=Han}/u.test(char));
  dialog.innerHTML = `<div class="dialog-header"><h2>A closer look</h2><button class="icon-btn" data-action="close-dialog" aria-label="Close word">${icon('close')}</button></div><div class="flash-card"><div class="flash-hanzi" lang="zh-CN">${esc(text)}</div><div class="pinyin">${esc(reading)}</div>${word ? `<div class="translation">${esc(word.english)}</div>` : `<div class="translation small">${contextExample ? `As in ${zh(contextExample)}` : 'A character from this lesson’s list. Its reading may change in different words.'}</div>`}<button class="btn small" style="margin-top:16px" data-action="play" data-text="${esc(contextExample || text)}">${icon('sound')}${contextExample ? `Listen: ${zh(contextExample)}` : 'Listen'}</button></div><div class="word-strokes">${characters.map((char, i) => `<div id="word-stroke-${i}" aria-label="Strokes for ${esc(char)}"></div>`).join('')}</div><p class="small muted" style="text-align:center;margin:17px 0 0">Watch each character grow, stroke by stroke.</p>`;
  dialog.showModal();
  characters.forEach((char, i) => {
    const element = dialog.querySelector(`#word-stroke-${i}`);
    makeWriter(element, char, 105)?.animateCharacter();
  });
}

function advance(skipped = false) {
  const lesson = getLesson(state.lessonId);
  const index = currentIndex(lesson);
  const total = totalFor(lesson, state.activity);
  if (index >= total) return;
  if (state.activity === 'learn' && index < lesson.focus.length) store.learn(lesson.id, lesson.focus[index].hanzi);
  if (['listen', 'build'].includes(state.activity) && !state.correct) return;
  if (state.activity === 'speak' && !skipped && !state.correct) return;
  if (state.activity === 'write' && document.querySelector('#trace-next')?.disabled) return;
  cleanup();
  store.setCheckpoint(lesson.id, state.activity, index + 1);
  if (index + 1 === total) {
    const stars = ['listen', 'build'].includes(state.activity) ? Math.max(1, 3 - Math.floor(state.mistakes / 2)) : state.activity === 'speak' ? (state.practiced ? 1 : 0) : 1;
    store.complete(lesson.id, state.activity, stars);
  }
  resetQuestion();
  render();
}

function startRecording() {
  if (state.recording) { recognition?.stop(); return; }
  stopSpeech();
  recognition?.abort();
  const lessonId = state.lessonId;
  const index = currentIndex();
  const target = getLesson(lessonId).sentences[index].zh;
  const stillHere = () => state.page === 'lesson' && state.lessonId === lessonId && state.activity === 'speak' && currentIndex() === index;
  recognition = createRecognition({
    onResult(heard, meta) {
      if (!stillHere()) return;
      state.correct = (meta.alternatives || [heard]).some(text => matchesTranscript(target, text));
      state.practiced = state.practiced || state.correct;
      store.setEvidence(lessonId, 'speak', { practiced: state.practiced });
      state.feedback = state.correct ? 'Those words matched! Lovely effort.' : `I heard “${heard}”. Have another go, or practise with a grown-up.`;
      state.recording = false;
      render();
    },
    onError() {
      if (!stillHere()) return;
      state.recording = false;
      state.feedback = 'The microphone could not hear you. Try again, or choose “I practised aloud”.';
      render();
    },
    onEnd() {
      if (!stillHere()) return;
      state.recording = false;
      if (!state.feedback) state.feedback = 'No words came through. You can try again or practise without the microphone.';
      render();
    },
  });
  if (!recognition) return toast('Try saying it aloud with a grown-up, then tap “I practised aloud”.');
  state.feedback = '';
  state.recording = recognition.start();
  render();
}

document.addEventListener('click', event => {
  if (event.target.closest('.skip-link')) {
    event.preventDefault(); document.querySelector('#main')?.focus(); return;
  }
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const { action, id, activity, word, text, page, book } = button.dataset;
  if (action === 'nav') return navigate(page === 'home' ? `home/${state.book}` : page);
  if (action === 'book') return navigate(`home/${book}`);
  if (action === 'lesson') return openLesson(Number(id));
  if (action === 'activity') return openLesson(state.lessonId, activity);
  if (action === 'play') return play(text);
  if (action === 'word') return openWord(word);
  if (action === 'close-dialog') { dialog.close(); stopSpeech(); return; }
  if (action === 'advance') return advance();
  if (action === 'replay') {
    store.setCheckpoint(state.lessonId, state.activity, 0);
    state.mistakes = 0; state.practiced = false;
    store.setEvidence(state.lessonId, state.activity, { mistakes: 0, practiced: false });
    resetQuestion(); render(); return;
  }
  if (action === 'reveal') { state.reveal = true; render(); return; }
  if (action === 'answer') {
    if (state.correct) return;
    const target = getLesson(state.lessonId).focus[currentIndex()];
    state.correct = word === target.hanzi;
    state.wrong = state.correct ? null : word;
    state.feedback = state.correct ? `That’s it! ${target.english}.` : 'Not quite yet. Listen again and have another try.';
    if (!state.correct) {
      state.mistakes++;
      store.setEvidence(state.lessonId, state.activity, { mistakes: state.mistakes });
    }
    render(); return;
  }
  if (action === 'tile' || action === 'remove-tile') {
    if (state.correct) return;
    const tile = Number(id);
    if (action === 'tile' && !state.selected.includes(tile)) state.selected.push(tile);
    else if (action === 'remove-tile') state.selected = state.selected.filter(i => i !== tile);
    state.feedback = ''; render(); return;
  }
  if (action === 'check-build') {
    const sentence = getLesson(state.lessonId).sentences[currentIndex()];
    state.correct = correctSentence(sentence, state.selected.map(i => sentence.pieces[i]));
    state.feedback = state.correct ? 'You made a sentence! Now try saying it aloud.' : 'A good try. Move a word, listen to the hint, and try again.';
    if (!state.correct) {
      state.mistakes++;
      store.setEvidence(state.lessonId, state.activity, { mistakes: state.mistakes });
    }
    render(); return;
  }
  if (action === 'build-hint') {
    state.reveal = true; render(); play(getLesson(state.lessonId).sentences[currentIndex()].zh); return;
  }
  if (action === 'animate') { writer?.animateCharacter(); return; }
  if (action === 'clear-trace') return canvasClear();
  if (action === 'paper') {
    document.querySelector('#trace-next').disabled = false;
    document.querySelector('#trace-feedback').textContent = 'Well done for practising on paper. Ready for the next one?';
    return;
  }
  if (action === 'record') return startRecording();
  if (action === 'self-speak') {
    recognition?.abort(); state.recording = false;
    state.correct = true; state.practiced = true;
    store.setEvidence(state.lessonId, 'speak', { practiced: true });
    state.feedback = 'Wonderful effort. Your voice gets stronger with practice.'; render(); return;
  }
  if (action === 'skip-speak') return advance(true);
  if (action === 'review-reveal') { state.reviewReveal = true; render(); return; }
  if (action === 'review-answer') {
    const item = state.reviewDeck[state.reviewIndex % state.reviewDeck.length];
    store.recordReview(item.hanzi, button.dataset.correct === 'true');
    state.reviewIndex++; state.reviewReveal = false;
    if (state.reviewIndex >= state.reviewDeck.length) { state.reviewIndex = 0; state.reviewDeck = reviewWords(lessons, progress()); toast('A whole little round of review. Well done!'); }
    stopSpeech(); render(); return;
  }
  if (action === 'practice-start') {
    store.setCheckpoint(state.lessonId, activity, 0);
    store.setEvidence(state.lessonId, activity, { mistakes: 0, practiced: false });
    return openLesson(state.lessonId, activity);
  }
  if (action === 'export') {
    const blob = new Blob([store.export()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'little-lantern-p1-progress.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Your progress backup is ready.'); return;
  }
  if (action === 'import') return document.querySelector('#import-file').click();
  if (action === 'confirm-import') {
    try { store.import(state.importText); state.importText = null; state.lessonId = progress().lastLesson; render(); toast('Your learning progress is restored.'); }
    catch (error) { state.importText = null; render(); toast(error.message); }
    return;
  }
  if (action === 'cancel-import') { state.importText = null; render(); return; }
  if (action === 'reset-ask') { state.resetConfirm = true; render(); return; }
  if (action === 'reset-cancel') { state.resetConfirm = false; render(); return; }
  if (action === 'reset-confirm') {
    store.reset(); state.resetConfirm = false; state.lessonId = 1; state.book = '1A'; render(); toast('A fresh beginning. Your P1 progress has been reset.');
  }
});

document.addEventListener('change', async event => {
  const target = event.target;
  if (target.id === 'show-pinyin') store.setSettings({ showPinyin: target.checked });
  if (target.id === 'show-english') store.setSettings({ showEnglish: target.checked });
  if (target.id === 'voice') store.setSettings({ voiceURI: target.value });
  if (target.id === 'rate') store.setSettings({ rate: Number(target.value) });
  if (target.id === 'practice-lesson') { state.lessonId = Number(target.value); store.setLastLesson(state.lessonId); }
  if (target.id === 'import-file') {
    const file = target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) return toast('That backup is too large. Choose a Little Lantern P1 JSON backup.');
    try {
      const text = await file.text();
      // Validate in an isolated in-memory store before asking to replace a save.
      createStore(null).import(text);
      state.importText = text; render();
    } catch (error) { toast(error.message); }
  }
});
document.addEventListener('input', event => {
  if (event.target.id === 'rate') document.querySelector('#rate-label').textContent = `${Number(event.target.value).toFixed(2)}×`;
});
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', stopSpeech);
window.addEventListener('hashchange', route);
window.addEventListener('pagehide', cleanup);
globalThis.speechSynthesis?.addEventListener?.('voiceschanged', () => { if (state.page === 'settings') render(); });
route();

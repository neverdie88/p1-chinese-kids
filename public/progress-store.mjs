export const STORAGE_KEY = 'p1-chinese-kids-v1';
export const ACTIVITIES = Object.freeze(['learn', 'write', 'listen', 'build', 'speak']);
const ACTIVITIES_SET = new Set(ACTIVITIES);
const BAD_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MAX_REVIEW = 1_000_000;
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const integer = (value, maximum, fallback = 0) => Number.isInteger(value) ? Math.max(0, Math.min(maximum, value)) : fallback;
const isLesson = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 19 && String(Number(value)) === String(value);
const validText = (value, limit) => typeof value === 'string' && value.trim().length > 0 && value.length <= limit && !/[\u0000-\u001f\u007f]/u.test(value);
const freshLesson = () => ({ completed: [], learned: [], stars: 0, activityStars: {}, checkpoint: {}, evidence: {} });

export function defaultProgress() {
  return {
    version: 1, lessons: {}, lastLesson: 1,
    settings: { showPinyin: true, showEnglish: true, rate: 0.8, voiceURI: '' },
    review: {},
  };
}

/** Normalize browser data defensively; never retain unknown properties. */
export function normalizeProgress(source) {
  const clean = defaultProgress();
  const saved = object(source);
  if (saved.version !== 1) return clean;
  for (const [id, entry] of Object.entries(object(saved.lessons))) {
    if (!isLesson(id)) continue;
    const lesson = freshLesson();
    const input = object(entry);
    lesson.completed = [...new Set((Array.isArray(input.completed) ? input.completed : []).filter(activity => ACTIVITIES_SET.has(activity)))];
    lesson.learned = [...new Set((Array.isArray(input.learned) ? input.learned : []).filter(word => validText(word, 64)).map(word => word.trim()))].slice(0, 200);
    for (const activity of ACTIVITIES) {
      if (lesson.completed.includes(activity)) {
        lesson.activityStars[activity] = integer(object(input.activityStars)[activity], 3);
      }
      const checkpoint = object(input.checkpoint)[activity];
      if (Number.isInteger(checkpoint)) lesson.checkpoint[activity] = integer(checkpoint, 1000);
      const evidence = object(input.evidence)[activity];
      if (evidence && typeof evidence === 'object' && !Array.isArray(evidence)) {
        lesson.evidence[activity] = { mistakes: integer(evidence.mistakes, 1000), practiced: evidence.practiced === true };
      }
    }
    lesson.stars = Object.values(lesson.activityStars).reduce((sum, count) => sum + count, 0);
    clean.lessons[id] = lesson;
  }
  if (isLesson(saved.lastLesson)) clean.lastLesson = Number(saved.lastLesson);
  const settings = object(saved.settings);
  if (typeof settings.showPinyin === 'boolean') clean.settings.showPinyin = settings.showPinyin;
  if (typeof settings.showEnglish === 'boolean') clean.settings.showEnglish = settings.showEnglish;
  if (Number.isFinite(settings.rate)) clean.settings.rate = Math.max(0.5, Math.min(1.5, settings.rate));
  if (typeof settings.voiceURI === 'string' && settings.voiceURI.length <= 256 && !/[\u0000-\u001f\u007f]/u.test(settings.voiceURI)) clean.settings.voiceURI = settings.voiceURI;
  for (const [key, entry] of Object.entries(object(saved.review)).slice(0, 2000)) {
    if (!validText(key, 96) || BAD_KEYS.has(key)) continue;
    const item = object(entry);
    const attempts = integer(item.attempts, MAX_REVIEW);
    clean.review[key] = { correct: Math.min(attempts, integer(item.correct, MAX_REVIEW)), attempts };
  }
  return clean;
}

function assert(condition, message) {
  if (!condition) throw new Error(`Invalid progress backup: ${message}`);
}
function shape(value, allowed, label, required = allowed) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object.`);
  assert(Object.keys(value).every(key => allowed.includes(key)), `${label} has an unknown field.`);
  assert(required.every(key => own(value, key)), `${label} is missing a field.`);
}
function checkUnsafeKeys(value, depth = 0) {
  assert(depth < 12, 'data is nested too deeply.');
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert(!BAD_KEYS.has(key), 'unsafe property name.');
    checkUnsafeKeys(child, depth + 1);
  }
}
function validateBackup(saved) {
  checkUnsafeKeys(saved);
  shape(saved, ['version', 'lessons', 'lastLesson', 'settings', 'review'], 'backup');
  assert(saved.version === 1, 'unsupported version.');
  assert(isLesson(saved.lastLesson), 'last lesson must be between 1 and 19.');
  shape(saved.settings, ['showPinyin', 'showEnglish', 'rate', 'voiceURI'], 'settings');
  assert(typeof saved.settings.showPinyin === 'boolean' && typeof saved.settings.showEnglish === 'boolean', 'display settings must be true or false.');
  assert(Number.isFinite(saved.settings.rate), 'voice speed must be a number.');
  assert(typeof saved.settings.voiceURI === 'string' && saved.settings.voiceURI.length <= 256 && !/[\u0000-\u001f\u007f]/u.test(saved.settings.voiceURI), 'invalid voice.');
  assert(saved.lessons && typeof saved.lessons === 'object' && !Array.isArray(saved.lessons), 'lessons must be an object.');
  for (const [id, entry] of Object.entries(saved.lessons)) {
    assert(isLesson(id), 'lesson number must be between 1 and 19.');
    shape(entry, ['completed', 'learned', 'stars', 'activityStars', 'checkpoint', 'evidence'], `lesson ${id}`, ['completed', 'learned', 'stars']);
    assert(Array.isArray(entry.completed) && entry.completed.length <= 100 && entry.completed.every(activity => ACTIVITIES_SET.has(activity)), `lesson ${id} contains an unknown activity.`);
    assert(Array.isArray(entry.learned) && entry.learned.length <= 200 && entry.learned.every(word => validText(word, 64)), `lesson ${id} contains an invalid learned word.`);
    assert(Number.isInteger(entry.stars), `lesson ${id} stars must be a whole number.`);
    for (const field of ['activityStars', 'checkpoint']) {
      if (!own(entry, field)) continue;
      shape(entry[field], ACTIVITIES, `lesson ${id} ${field}`, []);
      assert(Object.values(entry[field]).every(Number.isInteger), `lesson ${id} ${field} must contain whole numbers.`);
    }
    if (own(entry, 'evidence')) {
      shape(entry.evidence, ACTIVITIES, `lesson ${id} evidence`, []);
      for (const [activity, evidence] of Object.entries(entry.evidence)) {
        shape(evidence, ['mistakes', 'practiced'], `lesson ${id} ${activity} evidence`);
        assert(Number.isInteger(evidence.mistakes), `lesson ${id} ${activity} mistakes must be a whole number.`);
        assert(typeof evidence.practiced === 'boolean', `lesson ${id} ${activity} practiced must be true or false.`);
      }
    }
  }
  assert(saved.review && typeof saved.review === 'object' && !Array.isArray(saved.review), 'review must be an object.');
  assert(Object.keys(saved.review).length <= 2000, 'too many review entries.');
  for (const [key, item] of Object.entries(saved.review)) {
    assert(validText(key, 96), 'invalid review key.');
    shape(item, ['correct', 'attempts'], 'review item');
    assert(Number.isInteger(item.correct) && Number.isInteger(item.attempts), 'review counts must be whole numbers.');
  }
  return normalizeProgress(saved);
}

/** Session-only progress remains usable if browser storage is blocked or full. */
export function createStore(storage) {
  if (arguments.length === 0) {
    try { storage = globalThis.localStorage; } catch { storage = null; }
  }
  let state = defaultProgress();
  let persistent = false;
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) state = normalizeProgress(JSON.parse(raw));
  } catch { /* A bad or inaccessible save must not prevent learning. */ }
  const snapshot = () => JSON.parse(JSON.stringify(state));
  function save() {
    try {
      if (!storage || typeof storage.setItem !== 'function') throw new Error('Storage unavailable.');
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      persistent = true;
    } catch { persistent = false; }
    return snapshot();
  }
  function lessonFor(id) {
    if (!isLesson(id)) throw new RangeError('Lesson must be between 1 and 19.');
    return state.lessons[id] ||= freshLesson();
  }
  function activityCheck(activity) {
    if (!ACTIVITIES_SET.has(activity)) throw new RangeError('Unknown lesson activity.');
  }
  save();
  return {
    get persistent() { return persistent; },
    get: snapshot,
    complete(id, activity, stars = 0) {
      activityCheck(activity);
      const lesson = lessonFor(id);
      if (!lesson.completed.includes(activity)) lesson.completed.push(activity);
      lesson.activityStars[activity] = Math.max(lesson.activityStars[activity] || 0, integer(stars, 3));
      lesson.stars = Object.values(lesson.activityStars).reduce((sum, count) => sum + count, 0);
      return save();
    },
    learn(id, hanzi) {
      if (!validText(hanzi, 64)) throw new TypeError('Learned word must be a short, nonempty string.');
      const lesson = lessonFor(id);
      const word = hanzi.trim();
      if (!lesson.learned.includes(word) && lesson.learned.length < 200) lesson.learned.push(word);
      return save();
    },
    setCheckpoint(id, activity, index) {
      activityCheck(activity);
      if (!Number.isInteger(index)) throw new TypeError('Checkpoint must be a whole number.');
      lessonFor(id).checkpoint[activity] = integer(index, 1000);
      return save();
    },
    setEvidence(id, activity, patch) {
      activityCheck(activity);
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)
        || Object.keys(patch).some(key => !['mistakes', 'practiced'].includes(key))) {
        throw new TypeError('Evidence must contain only mistakes and practiced fields.');
      }
      if (own(patch, 'mistakes') && !Number.isInteger(patch.mistakes)) throw new TypeError('Mistakes must be a whole number.');
      if (own(patch, 'practiced') && typeof patch.practiced !== 'boolean') throw new TypeError('Practiced must be true or false.');
      const lesson = lessonFor(id);
      const evidence = lesson.evidence[activity] ||= { mistakes: 0, practiced: false };
      if (own(patch, 'mistakes')) evidence.mistakes = integer(patch.mistakes, 1000);
      if (own(patch, 'practiced')) evidence.practiced = patch.practiced;
      return save();
    },
    setLastLesson(id) {
      if (!isLesson(id)) throw new RangeError('Lesson must be between 1 and 19.');
      state.lastLesson = Number(id);
      return save();
    },
    setSettings(patch) {
      const candidate = { ...state.settings, ...object(patch) };
      const validated = validateBackup({ ...state, settings: candidate });
      state.settings = validated.settings;
      return save();
    },
    recordReview(key, correct) {
      if (!validText(key, 96) || BAD_KEYS.has(key)) throw new TypeError('Invalid review key.');
      if (typeof correct !== 'boolean') throw new TypeError('Review result must be true or false.');
      if (!own(state.review, key) && Object.keys(state.review).length >= 2000) return snapshot();
      const item = state.review[key] ||= { correct: 0, attempts: 0 };
      item.attempts = Math.min(MAX_REVIEW, item.attempts + 1);
      if (correct) item.correct = Math.min(item.attempts, item.correct + 1);
      return save();
    },
    reset() { state = defaultProgress(); return save(); },
    export() { return JSON.stringify(state, null, 2); },
    import(text) {
      if (typeof text !== 'string' || text.length > 1_000_000) throw new Error('Invalid progress backup: file is too large or is not text.');
      let parsed;
      try { parsed = JSON.parse(text); }
      catch { throw new Error('Invalid progress backup: expected a JSON file.'); }
      const next = validateBackup(parsed);
      state = next;
      return save();
    },
  };
}

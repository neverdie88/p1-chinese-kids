import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITIES, createStore, defaultProgress, STORAGE_KEY } from '../public/progress-store.mjs';

function memoryStorage(initial) {
  const values = new Map(initial ? [[STORAGE_KEY, initial]] : []);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('progress survives reload, keeps independent checkpoints and awards best stars once', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  store.learn(1, '雨');
  store.learn(1, '雨');
  store.setCheckpoint(1, 'learn', 6);
  store.setCheckpoint(1, 'listen', 2);
  store.complete(1, 'learn', 1);
  store.complete(1, 'listen', 1);
  store.complete(1, 'listen', 1);
  store.complete(1, 'listen', 3);
  store.complete(1, 'listen', 2);
  store.setLastLesson(19);
  store.setSettings({ showPinyin: false, rate: 1.1 });
  store.recordReview('1:雨', false);
  store.recordReview('1:雨', true);
  const restored = createStore(storage);
  assert.equal(restored.persistent, true);
  assert.equal(restored.get().lessons[1].stars, 4);
  assert.deepEqual(restored.get().lessons[1].completed, ['learn', 'listen']);
  assert.deepEqual(restored.get().lessons[1].learned, ['雨']);
  assert.deepEqual(restored.get().lessons[1].checkpoint, { learn: 6, listen: 2 });
  assert.equal(restored.get().lastLesson, 19);
  assert.equal(restored.get().settings.showPinyin, false);
  assert.equal(restored.get().settings.rate, 1.1);
  assert.deepEqual(restored.get().review['1:雨'], { correct: 1, attempts: 2 });
  assert.equal(storage.values.size, 1);
});

test('get and mutation results do not expose live state', () => {
  const store = createStore(memoryStorage());
  const snapshot = store.complete(1, 'learn', 1);
  snapshot.lessons[1].completed.push('speak');
  store.get().settings.rate = 99;
  assert.deepEqual(store.get().lessons[1].completed, ['learn']);
  assert.equal(store.get().settings.rate, 0.8);
});

test('all five activities aggregate at most three stars each', () => {
  const store = createStore(memoryStorage());
  for (const activity of ACTIVITIES) store.complete(19, activity, 999);
  for (const activity of ACTIVITIES) store.complete(19, activity, 999);
  assert.equal(store.get().lessons[19].stars, 15);
  assert.equal(store.get().lessons[19].completed.length, 5);
});

test('corrupt storage and storage failures leave usable session progress', () => {
  const corrupt = createStore(memoryStorage('{ not JSON'));
  assert.deepEqual(corrupt.get(), defaultProgress());
  const failing = createStore({ getItem() { throw Error('Blocked'); }, setItem() { throw Error('Quota exceeded'); } });
  assert.equal(failing.persistent, false);
  failing.complete(2, 'build', 3);
  assert.equal(failing.get().lessons[2].stars, 3);
  assert.doesNotThrow(() => createStore(null).setLastLesson(4));
});

test('localStorage getter throwing is caught', () => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('Private mode'); } });
  try { assert.equal(createStore().persistent, false); }
  finally {
    if (prior) Object.defineProperty(globalThis, 'localStorage', prior);
    else delete globalThis.localStorage;
  }
});

test('export/import round trips and reset clears only this app key', () => {
  const storage = memoryStorage();
  storage.values.set('little-lantern-progress-v2', '{"keep":true}');
  const store = createStore(storage);
  store.learn(9, '华文');
  store.complete(9, 'speak', 1);
  const backup = store.export();
  store.reset();
  assert.deepEqual(store.get(), defaultProgress());
  store.import(backup);
  assert.equal(store.get().lessons[9].stars, 1);
  assert.deepEqual(store.get().lessons[9].learned, ['华文']);
  assert.equal(storage.values.get('little-lantern-progress-v2'), '{"keep":true}');
});

test('import clamps counts and derives total stars from completed activity bests', () => {
  const store = createStore(memoryStorage());
  const backup = defaultProgress();
  backup.settings.rate = 99;
  backup.lessons[1] = { completed: ['learn', 'learn', 'listen'], learned: ['一', '一'], stars: 999, activityStars: { learn: 9, listen: -3, speak: 3 }, checkpoint: { learn: 9999, listen: -1 } };
  backup.review['1:一'] = { attempts: 2, correct: 500 };
  store.import(JSON.stringify(backup));
  assert.equal(store.get().settings.rate, 1.5);
  assert.equal(store.get().lessons[1].stars, 3);
  assert.deepEqual(store.get().lessons[1].checkpoint, { learn: 1000, listen: 0 });
  assert.deepEqual(store.get().lessons[1].completed, ['learn', 'listen']);
  assert.deepEqual(store.get().review['1:一'], { attempts: 2, correct: 2 });
});

test('invalid and unsafe imports are rejected atomically', () => {
  const store = createStore(memoryStorage());
  store.complete(3, 'write', 1);
  const original = store.export();
  const invalid = [
    '{', 'null', '[]', '{}', original.replace('"version": 1', '"version": 2'),
    original.replace('"lastLesson": 1', '"lastLesson": 20'),
    original.replace('"showEnglish": true', '"showEnglish": "yes"'),
    original.replace('"write"', '"invented-activity"'),
    original.replace('"review": {}', '"review": {"__proto__": {"correct": 1, "attempts": 1}}'),
    original.replace('"review": {}', '"review": {"constructor": {"correct": 1, "attempts": 1}}'),
  ];
  for (const backup of invalid) {
    assert.throws(() => store.import(backup), /Invalid progress backup/);
    assert.equal(store.export(), original);
  }
  assert.equal({}.correct, undefined);
});

test('invalid mutation inputs do not add arbitrary lesson or review keys', () => {
  const store = createStore(memoryStorage());
  assert.throws(() => store.complete('__proto__', 'learn', 1), RangeError);
  assert.throws(() => store.complete(20, 'learn', 1), RangeError);
  assert.throws(() => store.complete(1, 'unknown', 1), RangeError);
  assert.throws(() => store.recordReview('__proto__', true), TypeError);
  assert.throws(() => store.recordReview('雨', 'true'), TypeError);
  assert.throws(() => store.setSettings({ rate: 'slow' }), /Invalid progress backup/);
  assert.throws(() => store.setCheckpoint(1, 'learn', 0.5), TypeError);
  assert.deepEqual(store.get().lessons, {});
});

test('activity evidence survives reload and backup without losing partially updated fields', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  store.setCheckpoint(1, 'listen', 2);
  store.setEvidence(1, 'listen', { mistakes: 2 });
  store.setEvidence(1, 'listen', { practiced: true });
  store.setEvidence(1, 'listen', { mistakes: 3 });
  store.setEvidence(1, 'speak', { practiced: true });
  const restored = createStore(storage);
  assert.deepEqual(restored.get().lessons[1].evidence, {
    listen: { mistakes: 3, practiced: true },
    speak: { mistakes: 0, practiced: true },
  });
  assert.equal(restored.get().lessons[1].checkpoint.listen, 2);
  const imported = createStore(memoryStorage());
  imported.import(restored.export());
  assert.deepEqual(imported.get(), restored.get());
});

test('clearing evidence for replay preserves existing completion and best stars', () => {
  const store = createStore(memoryStorage());
  store.complete(1, 'listen', 3);
  store.setEvidence(1, 'listen', { mistakes: 4, practiced: true });
  store.setEvidence(1, 'listen', { mistakes: 0, practiced: false });
  assert.deepEqual(store.get().lessons[1].evidence.listen, { mistakes: 0, practiced: false });
  assert.deepEqual(store.get().lessons[1].completed, ['listen']);
  assert.equal(store.get().lessons[1].activityStars.listen, 3);
  assert.equal(store.get().lessons[1].stars, 3);
  store.setEvidence(1, 'listen', { mistakes: 10000 });
  assert.equal(store.get().lessons[1].evidence.listen.mistakes, 1000);
  store.setEvidence(1, 'listen', { mistakes: -1 });
  assert.equal(store.get().lessons[1].evidence.listen.mistakes, 0);
});

test('old backups can omit evidence and imported evidence has bounded counts', () => {
  const store = createStore(memoryStorage());
  const backup = defaultProgress();
  backup.lessons[1] = { completed: ['learn'], learned: ['一'], stars: 1, activityStars: { learn: 1 }, checkpoint: { listen: 2 } };
  store.import(JSON.stringify(backup));
  assert.deepEqual(store.get().lessons[1].evidence, {});
  assert.equal(store.get().lessons[1].stars, 1);
  backup.lessons[1].evidence = { listen: { mistakes: 9000, practiced: true }, speak: { mistakes: -5, practiced: false } };
  store.import(JSON.stringify(backup));
  assert.deepEqual(store.get().lessons[1].evidence, {
    listen: { mistakes: 1000, practiced: true },
    speak: { mistakes: 0, practiced: false },
  });
});

test('invalid evidence updates and backups are rejected atomically', () => {
  const store = createStore(memoryStorage());
  for (const patch of [null, [], { mistakes: '2' }, { mistakes: 0.5 }, { practiced: 1 }, { unknown: true }, JSON.parse('{"__proto__": {"polluted":true}}')]) {
    assert.throws(() => store.setEvidence(1, 'listen', patch), TypeError);
    assert.deepEqual(store.get().lessons, {});
  }
  assert.throws(() => store.setEvidence(1, 'constructor', {}), RangeError);
  store.setEvidence(1, 'listen', { mistakes: 2, practiced: true });
  const original = store.export();
  for (const evidence of [{ quiz: { mistakes: 0, practiced: true } }, { listen: { mistakes: 0 } }, { listen: { mistakes: '0', practiced: true } }, { listen: { mistakes: 0, practiced: 'true' } }]) {
    const backup = JSON.parse(original);
    backup.lessons[1].evidence = evidence;
    assert.throws(() => store.import(JSON.stringify(backup)), /Invalid progress backup/);
    assert.equal(store.export(), original);
  }
});

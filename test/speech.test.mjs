import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecognition, getMandarinVoices, matchesTranscript, normalizeTranscript, speak, stopSpeech } from '../public/speech.mjs';

function mockGlobals(values) {
  const previous = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  return () => {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  };
}

test('transcript matching ignores formatting but rejects short words inside other words', () => {
  assert.equal(normalizeTranscript('  我，爱 学华文！ '), '我爱学华文');
  assert.equal(normalizeTranscript('ＡＢＣ'), 'abc');
  assert.equal(normalizeTranscript(null), '');
  assert.equal(matchesTranscript('我爱学华文。', '我爱学华文！'), true);
  assert.equal(matchesTranscript('我爱学华文', '我再读一次，我爱学华文。'), true);
  assert.equal(matchesTranscript('雨', '下雨'), false);
  assert.equal(matchesTranscript('华文', '学华文'), false);
  assert.equal(matchesTranscript('鱼', '雨'), false);
  assert.equal(matchesTranscript('口', '口。'), true);
  assert.equal(matchesTranscript('', '你好'), false);
  assert.equal(matchesTranscript('我爱学华文', ''), false);
});

test('speech selects Mandarin, clamps rate and ignores stale completion events', () => {
  const voices = [
    { lang: 'en-US', voiceURI: 'english' },
    { lang: 'zh-HK', voiceURI: 'cantonese' },
    { lang: 'zh-TW', voiceURI: 'taiwan' },
    { lang: 'zh-CN', voiceURI: 'mandarin' },
    { lang: 'zh-SG', voiceURI: 'singapore' },
  ];
  const utterances = [];
  let cancellations = 0;
  const restore = mockGlobals({
    speechSynthesis: { getVoices: () => voices, cancel: () => cancellations++, speak: item => utterances.push(item) },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
  });
  try {
    assert.deepEqual(getMandarinVoices().map(voice => voice.voiceURI), ['taiwan', 'mandarin', 'singapore']);
    let ended = 0;
    assert.equal(speak('你好', { rate: 100, onEnd: () => ended++ }), true);
    assert.equal(utterances[0].voice.voiceURI, 'singapore');
    assert.equal(utterances[0].rate, 1.5);
    speak('再见', { voiceURI: 'mandarin', onEnd: () => ended++ });
    assert.equal(utterances[1].voice.voiceURI, 'mandarin');
    utterances[0].onend({});
    assert.equal(ended, 0);
    utterances[1].onend({});
    utterances[1].onend({});
    assert.equal(ended, 1);
    stopSpeech();
    assert.equal(cancellations, 3);
  } finally { restore(); }
});

test('speech without browser support reports failure and remains safe to skip', async () => {
  const restore = mockGlobals({ speechSynthesis: undefined, SpeechSynthesisUtterance: undefined });
  try {
    let failure;
    assert.equal(speak('雨', { onError: event => { failure = event.error; } }), false);
    await Promise.resolve();
    assert.equal(failure, 'unavailable');
    assert.deepEqual(getMandarinVoices(), []);
    assert.doesNotThrow(stopSpeech);
  } finally { restore(); }
});

test('recognition reports final words, suppresses interim and aborted callbacks and can restart', () => {
  let instance;
  let starts = 0;
  let stops = 0;
  class MockRecognition {
    constructor() { instance = this; }
    start() { starts++; }
    stop() { stops++; }
    abort() { this.onerror({ error: 'aborted' }); this.onend(); }
  }
  const restore = mockGlobals({ SpeechRecognition: MockRecognition, webkitSpeechRecognition: undefined });
  try {
    const heard = [];
    const failures = [];
    let ends = 0;
    const recorder = createRecognition({ onResult: (text, details) => heard.push({ text, details }), onError: event => failures.push(event.error), onEnd: () => ends++ });
    assert.equal(instance.lang, 'zh-CN');
    assert.equal(instance.continuous, false);
    assert.equal(instance.interimResults, false);
    assert.equal(recorder.start(), true);
    assert.equal(recorder.start(), false);
    const interim = Object.assign([{ transcript: '你', confidence: 0.3 }], { isFinal: false });
    instance.onresult({ resultIndex: 0, results: [interim] });
    assert.equal(heard.length, 0);
    const result = Object.assign([{ transcript: '你好', confidence: 0.9 }, { transcript: '您好', confidence: 0.6 }], { isFinal: true });
    instance.onresult({ resultIndex: 0, results: [result] });
    assert.deepEqual(heard[0], { text: '你好', details: { confidence: 0.9, alternatives: ['你好', '您好'] } });
    recorder.stop();
    assert.equal(stops, 1);
    instance.onend();
    assert.equal(ends, 1);
    assert.equal(recorder.start(), true);
    recorder.abort();
    instance.onresult({ resultIndex: 0, results: [result] });
    assert.equal(heard.length, 1);
    assert.equal(ends, 1);
    assert.deepEqual(failures, []);
    assert.equal(starts, 2);
  } finally { restore(); }
});

test('recognition missing or failing constructor is optional', () => {
  let restore = mockGlobals({ SpeechRecognition: undefined, webkitSpeechRecognition: undefined });
  try { assert.equal(createRecognition(), null); } finally { restore(); }
  restore = mockGlobals({ SpeechRecognition: class { constructor() { throw Error('Unavailable'); } } });
  try { assert.equal(createRecognition(), null); } finally { restore(); }
});

test('recognition permission and start failures are exposed to the UI', () => {
  let instance;
  class MockRecognition {
    constructor() { instance = this; }
    start() { throw Error('Busy'); }
  }
  const restore = mockGlobals({ SpeechRecognition: MockRecognition });
  try {
    const failures = [];
    const recorder = createRecognition({ onError: event => failures.push(event.error) });
    assert.equal(recorder.start(), false);
    instance.onerror({ error: 'not-allowed' });
    assert.deepEqual(failures, ['start-failed', 'not-allowed']);
  } finally { restore(); }
});

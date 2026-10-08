let speechGeneration = 0;

/** Browser voice inventories may populate after the voiceschanged event. */
export function getMandarinVoices() {
  try {
    return (globalThis.speechSynthesis?.getVoices() || []).filter(voice => {
      const language = String(voice.lang || '').toLowerCase().replace(/_/g, '-');
      return /^cmn(?:-|$)/.test(language) || /^zh(?:-(?:cn|sg|tw|hans|hant)(?:-|$)|$)/.test(language);
    });
  } catch { return []; }
}

export function stopSpeech() {
  speechGeneration += 1;
  try { globalThis.speechSynthesis?.cancel(); } catch { /* Playback is optional. */ }
}

/** Returns false when speech playback is unavailable; callers can keep Continue enabled. */
export function speak(text, { rate = 0.8, voiceURI = '', onEnd, onError } = {}) {
  stopSpeech();
  const generation = speechGeneration;
  let ended = false;
  function finish(callback, result) {
    if (ended || generation !== speechGeneration) return;
    ended = true;
    callback?.(result);
  }
  function unavailable(code) {
    queueMicrotask(() => finish(onError, { error: code }));
    return false;
  }
  if (typeof text !== 'string' || !text.trim()) return unavailable('empty-text');
  if (!globalThis.speechSynthesis || typeof globalThis.SpeechSynthesisUtterance !== 'function') return unavailable('unavailable');
  try {
    const voices = getMandarinVoices();
    const voice = voices.find(item => item.voiceURI === voiceURI)
      || voices.find(item => /^zh[-_]SG$/i.test(item.lang))
      || voices.find(item => /^zh[-_]CN$/i.test(item.lang))
      || voices[0];
    const utterance = new globalThis.SpeechSynthesisUtterance(text.trim());
    utterance.lang = voice?.lang || 'zh-CN';
    if (voice) utterance.voice = voice;
    utterance.rate = Number.isFinite(rate) ? Math.max(0.5, Math.min(1.5, rate)) : 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = event => finish(onEnd, event);
    utterance.onerror = event => finish(onError, event);
    globalThis.speechSynthesis.speak(utterance);
    return true;
  } catch { return unavailable('playback-failed'); }
}

/** Removes formatting only. This compares recognized words, not pronunciation or tones. */
export function normalizeTranscript(text) {
  if (typeof text !== 'string') return '';
  return text.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]/gu, '');
}

export function matchesTranscript(target, heard) {
  const expected = normalizeTranscript(target);
  const actual = normalizeTranscript(heard);
  if (!expected || !actual) return false;
  // A short target inside another word is too weak to count as a match.
  return [...expected].length <= 2 ? actual === expected : actual.includes(expected);
}

/**
 * Uses the browser's optional speech service. Browsers may send microphone audio
 * to their recognition provider; UI should explain that before starting it.
 */
export function createRecognition({ onResult, onError, onEnd } = {}) {
  const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (typeof Recognition !== 'function') return null;
  let recognition;
  try { recognition = new Recognition(); } catch { return null; }
  recognition.lang = 'zh-CN';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  let running = false;
  let aborted = false;
  recognition.onresult = event => {
    if (aborted) return;
    for (let index = event.resultIndex ?? 0; index < (event.results?.length || 0); index++) {
      const result = event.results[index];
      if (result.isFinal === false) continue;
      const alternatives = Array.from(result).map(item => String(item.transcript || '').trim()).filter(Boolean);
      if (alternatives.length) onResult?.(alternatives[0], { confidence: result[0].confidence || 0, alternatives });
    }
  };
  recognition.onerror = event => {
    if (aborted || event.error === 'aborted') return;
    onError?.(event);
  };
  recognition.onend = () => {
    running = false;
    if (!aborted) onEnd?.();
  };
  return {
    start() {
      if (running) return false;
      aborted = false;
      try { recognition.start(); running = true; return true; }
      catch (error) { onError?.({ error: 'start-failed', message: error.message }); return false; }
    },
    stop() {
      if (!running) return;
      try { recognition.stop(); } catch { running = false; }
    },
    abort() {
      aborted = true;
      running = false;
      try { recognition.abort(); } catch { /* Navigating away must always work. */ }
    },
  };
}

export const activityKeys = ['learn', 'write', 'listen', 'build', 'speak'];

// Stable shuffles keep a retry or page refresh from moving the answer around.
export function shuffle(items, seed = 1) {
  const result = [...items];
  let state = Number(seed) >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function wordChoices(target, pool, seed) {
  const unique = [...new Map(pool.filter(word => word.hanzi !== target.hanzi).map(word => [word.hanzi, word])).values()];
  return shuffle([target, ...shuffle(unique, seed + 71).slice(0, 3)], seed);
}

export function sentenceTiles(sentence, seed) {
  let tiles = shuffle(sentence.pieces.map((text, id) => ({ text, id })), seed);
  if (tiles.length > 1 && tiles.every((tile, i) => tile.id === i)) tiles = [...tiles.slice(1), tiles[0]];
  return tiles;
}

export function normalizeSentence(text) {
  return String(text).replace(/[\s，。！？、,.!?：:；;“”‘’「」《》]/gu, '');
}

export function correctSentence(sentence, selected) {
  return normalizeSentence(selected.join('')) === normalizeSentence(sentence.zh);
}

export function lessonProgress(record) {
  const done = new Set((record?.completed || []).filter(key => activityKeys.includes(key)));
  return { done: done.size, total: activityKeys.length, percent: done.size * 20 };
}

export function nextActivity(record) {
  return activityKeys.find(key => !record?.completed?.includes(key)) || 'learn';
}

export function reviewWords(lessons, progress) {
  const words = [];
  const seen = new Set();
  for (const lesson of lessons) {
    const learned = new Set(progress.lessons[lesson.id]?.learned || []);
    for (const word of lesson.focus) {
      if (learned.has(word.hanzi) && !seen.has(word.hanzi)) {
        seen.add(word.hanzi);
        words.push({ ...word, lessonId: lesson.id });
      }
    }
  }
  return words.sort((a, b) => {
    const aScore = progress.review[a.hanzi];
    const bScore = progress.review[b.hanzi];
    return (aScore ? aScore.correct / Math.max(1, aScore.attempts) : -1) - (bScore ? bScore.correct / Math.max(1, bScore.attempts) : -1);
  });
}

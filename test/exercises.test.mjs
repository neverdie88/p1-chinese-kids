import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, wordChoices, sentenceTiles, correctSentence, lessonProgress, nextActivity, reviewWords } from '../public/exercises.mjs';

test('choices keep one correct answer and unique distractors across retries', () => {
  const words = ['人', '口', '衣', '雨', '鱼', '口'].map(hanzi => ({ hanzi }));
  const result = wordChoices(words[0], words, 31);
  assert.equal(result.length, 4);
  assert.equal(new Set(result.map(w => w.hanzi)).size, 4);
  assert.equal(result.filter(w => w.hanzi === '人').length, 1);
  assert.deepEqual(result, wordChoices(words[0], words, 31));
});
test('sentence tiles preserve repeated pieces and start out of order', () => {
  const sentence = { zh: '我和妈妈一起吃。', pieces: ['我', '和', '妈妈', '一起', '吃'] };
  for (let seed = 0; seed < 20; seed++) {
    const tiles = sentenceTiles(sentence, seed);
    assert.deepEqual(tiles.map(t => t.id).sort(), [0, 1, 2, 3, 4]);
    assert.notDeepEqual(tiles.map(t => t.text), sentence.pieces);
  }
  assert.ok(correctSentence(sentence, sentence.pieces));
  assert.ok(!correctSentence(sentence, ['妈妈', '和', '我', '一起', '吃']));
  const repeated = sentenceTiles({ pieces: ['我', '看', '一', '看'] }, 3);
  assert.equal(repeated.filter(t => t.text === '看').length, 2);
});
test('progress ignores duplicates and unknown activities', () => {
  assert.deepEqual(lessonProgress({ completed: ['learn', 'learn', 'unknown'] }), { done: 1, total: 5, percent: 20 });
  assert.equal(nextActivity({ completed: ['learn', 'write'] }), 'listen');
  assert.deepEqual(shuffle([], 1), []);
});
test('review includes only learned focus words, deduplicates, prioritizes practice', () => {
  const lessons = [{ id: 1, focus: [{ hanzi: '人' }, { hanzi: '口' }] }, { id: 2, focus: [{ hanzi: '人' }, { hanzi: '雨' }] }];
  const result = reviewWords(lessons, { lessons: { 1: { learned: ['人', '口'] }, 2: { learned: ['人'] } }, review: { 人: { correct: 3, attempts: 3 } } });
  assert.deepEqual(result.map(w => w.hanzi), ['口', '人']);
});

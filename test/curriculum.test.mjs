import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { course, lessons } from '../public/curriculum.mjs';

const fixture = JSON.parse(await readFile(new URL('../sources/p1-characters.json', import.meta.url), 'utf8'));
const withoutPunctuation = value => value.replace(/[\p{P}\p{Z}\s]/gu, '');

test('all 19 standard P1 lessons appear in the correct book and source order', () => {
  assert.match(course.edition, /Standard Chinese/);
  assert.equal(lessons.length, 19);
  assert.deepEqual(lessons.map(lesson => lesson.id), Array.from({ length: 19 }, (_, index) => index + 1));
  assert.deepEqual(lessons.map(({ id, book, title, sourceUrl }) => ({ id, book, title, sourceUrl })), fixture.lessons.map(({ id, book, title, sourceUrl }) => ({ id, book, title, sourceUrl })));
  for (const lesson of lessons) assert.equal(lesson.book, lesson.id <= 10 ? '1A' : '1B');
});

test('recognition and writing lists exactly preserve the independent MOE transcription', () => {
  for (const lesson of lessons) {
    const source = fixture.lessons.find(item => item.id === lesson.id);
    assert.deepEqual(lesson.recognition, source.recognition, `Lesson ${lesson.id} recognition`);
    assert.deepEqual(lesson.writing, source.writing, `Lesson ${lesson.id} writing`);
    assert.equal(lesson.characterSourceUrl, fixture.officialUrl);
    assert.equal(lesson.characterSourcePage, source.page);
    for (const key of ['recognition', 'writing']) {
      assert.equal(new Set(lesson[key]).size, lesson[key].length, `Lesson ${lesson.id}: duplicate ${key} character`);
      for (const char of lesson[key]) assert.match(char, /^\p{Script=Han}$/u, `Lesson ${lesson.id}: ${char} is not one Han character`);
    }
  }
  for (const [book, expectedRead, expectedWrite] of [['1A', 182, 75], ['1B', 182, 92]]) {
    const selected = lessons.filter(lesson => lesson.book === book);
    assert.equal(selected.reduce((total, lesson) => total + lesson.recognition.length, 0), expectedRead);
    assert.equal(selected.reduce((total, lesson) => total + lesson.writing.length, 0), expectedWrite);
  }
});

test('standard Chinese requirements retain source corrections and exclude Higher Chinese extras', () => {
  assert.ok(lessons[1].recognition.includes('巴'));
  assert.ok(!lessons[1].recognition.includes('巳'));
  assert.ok(!lessons[1].writing.includes('马'));
  assert.ok(lessons[8].recognition.includes('弓'));
  assert.ok(lessons[8].recognition.includes('语'));
  assert.ok(lessons[9].recognition.includes('旧'));
  assert.ok(lessons[17].recognition.includes('眼'));
  assert.equal(lessons[17].recognition.filter(char => char === '睛').length, 1);
  assert.deepEqual(lessons[18].writing, [...'公园姐哥习起到高兴心']);
  // These occur in standard writing after being recognised in an earlier lesson.
  assert.ok(lessons[3].writing.includes('巴'));
  assert.ok(!lessons[3].recognition.includes('巴'));
});

test('every lesson offers complete, distinct vocabulary and three playable original sentences', () => {
  const sentenceTexts = new Set();
  for (const lesson of lessons) {
    for (const field of ['title', 'pinyin', 'english', 'theme', 'emoji', 'sourceUrl', 'characterSourceUrl', 'sourceNote']) {
      assert.equal(typeof lesson[field], 'string', `Lesson ${lesson.id}: ${field}`);
      assert.ok(lesson[field].trim().length, `Lesson ${lesson.id}: empty ${field}`);
    }
    assert.ok(lesson.focus.length >= 5);
    assert.equal(new Set(lesson.focus.map(word => word.hanzi)).size, lesson.focus.length);
    assert.equal(new Set(lesson.focus.map(word => word.english)).size, lesson.focus.length);
    for (const word of lesson.focus) {
      assert.match(word.hanzi, /^\p{Script=Han}+$/u);
      for (const field of ['pinyin', 'english', 'emoji']) assert.ok(word[field]?.trim(), `Lesson ${lesson.id}: ${word.hanzi} has no ${field}`);
      assert.match(word.pinyin, /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u, `Lesson ${lesson.id}: ${word.hanzi} has no tone marks`);
    }
    assert.equal(lesson.sentences.length, 3);
    for (const sentence of lesson.sentences) {
      assert.ok(sentence.pinyin?.trim());
      assert.ok(sentence.en?.trim());
      assert.ok(sentence.pieces.length >= 2 && sentence.pieces.length <= 6);
      assert.equal(sentence.pieces.join(''), withoutPunctuation(sentence.zh), `Lesson ${lesson.id}: broken sentence pieces for ${sentence.zh}`);
      assert.ok(!sentenceTexts.has(sentence.zh), `Repeated practice sentence: ${sentence.zh}`);
      sentenceTexts.add(sentence.zh);
    }
    assert.ok(lesson.pinyinFocus.label && lesson.pinyinFocus.tip);
    assert.ok(lesson.pinyinFocus.syllables.length >= 2);
    assert.match(lesson.sourceNote, /original supplementary practice/);
  }
});

test('source metadata keeps access limitations and original practice distinct', () => {
  assert.equal(course.verifiedAt, fixture.verifiedAt);
  assert.ok(course.sources.every(source => source.label && source.note && new URL(source.url).protocol === 'https:'));
  assert.match(fixture.officialAccess, /no PDF is bundled/);
  assert.match(course.contentNote, /original guided practice/);
  assert.match(course.contentNote, /oral vocabulary/);
});

test('movable time phrases stay with their subject so the exact-order builder is fair', () => {
  const timePhrases = new Set(['今天', '昨天', '明天', '生日那天', '吃饭前', '三点半']);
  const subjects = new Set(['我', '我们', '大家', '爷爷']);
  for (const lesson of lessons) for (const sentence of lesson.sentences) {
    assert.ok(!(sentence.pieces.some(piece => timePhrases.has(piece)) && sentence.pieces.some(piece => subjects.has(piece))), `Lesson ${lesson.id}: both subject–time and time–subject would form valid answers for ${sentence.zh}`);
  }
});

test('context-sensitive pronunciation aids belong to the lesson and use tone marks', () => {
  for (const lesson of lessons) for (const [char, reading] of Object.entries(lesson.characterReadings || {})) {
    assert.ok(lesson.recognition.includes(char) || lesson.writing.includes(char), `Lesson ${lesson.id}: ${char} is not in its character lists`);
    assert.match(reading, /^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+$/u);
    assert.match(reading, /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u);
  }
  assert.equal(lessons[10].characterReadings['发'], 'fà');
  assert.equal(lessons[12].characterReadings['抹'], 'mā');
  assert.equal(lessons[14].characterReadings['切'], 'qiē');
  assert.equal(lessons[18].characterReadings['兴'], 'xìng');
});

test('every contextual reading has a matching whole-word example for speech playback', () => {
  for (const lesson of lessons) {
    assert.deepEqual(Object.keys(lesson.characterExamples || {}).sort(), Object.keys(lesson.characterReadings || {}).sort(), `Lesson ${lesson.id}: contextual examples and readings must match`);
    for (const [char, example] of Object.entries(lesson.characterExamples || {})) {
      assert.match(example, /^\p{Script=Han}{2,}$/u, `Lesson ${lesson.id}: ${char} needs a whole Chinese word or phrase`);
      assert.ok(example.includes(char), `Lesson ${lesson.id}: ${char} is missing from its example`);
    }
  }
  assert.equal(lessons[10].characterExamples['发'], '头发');
  assert.equal(lessons[12].characterExamples['抹'], '抹布');
  assert.equal(lessons[18].characterExamples['兴'], '高兴');
});

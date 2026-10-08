/** Bundle the selected P1 characters from the pinned Hanzi Writer data release. */
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { course, lessons } from '../public/curriculum.mjs';

const directory = new URL('../public/strokes/', import.meta.url);
const origin = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/';
const chineseCharacters = (value) => [...String(value)].filter((char) => /\p{Script=Han}/u.test(char));
const characters = [...new Set(lessons.flatMap((lesson) => [
  lesson.title,
  ...(lesson.writing ?? []),
  ...(lesson.recognition ?? []),
  ...(lesson.focus ?? []).map((word) => word.hanzi),
  ...(lesson.sentences ?? []).map((sentence) => sentence.zh),
]).flatMap(chineseCharacters))].sort();
const checkOnly = process.argv.includes('--check');

function validate(character, bytes) {
  const data = JSON.parse(bytes.toString());
  if (!Array.isArray(data.strokes) || !data.strokes.length ||
      !Array.isArray(data.medians) || data.medians.length !== data.strokes.length ||
      data.strokes.some((stroke) => typeof stroke !== 'string' || !stroke.startsWith('M')) ||
      data.medians.some((median) => !Array.isArray(median) || !median.length)) {
    throw new Error(`Invalid stroke data for ${character}`);
  }
  return data.strokes.length;
}

async function fetchBytes(name) {
  const response = await fetch(`${origin}${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Unable to fetch ${name}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

await mkdir(directory, { recursive: true });
const manifest = { package: 'hanzi-writer-data', version: '2.0.1', source: origin, characters: {} };
let cursor = 0;
const failures = [];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < characters.length) {
    const character = characters[cursor++];
    const destination = new URL(`${encodeURIComponent(character)}.json`, directory);
    try {
      let bytes;
      try {
        bytes = await readFile(destination);
      } catch (error) {
        if (checkOnly || error.code !== 'ENOENT') throw error;
        bytes = await fetchBytes(`${character}.json`);
        validate(character, bytes);
        await writeFile(destination, bytes);
      }
      const strokes = validate(character, bytes);
      manifest.characters[character] = {
        strokes,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        bytes: bytes.length,
      };
    } catch (error) {
      failures.push(`${character}: ${error.message}`);
    }
  }
}));
if (failures.length) throw new Error(`Stroke data is incomplete:\n${failures.join('\n')}`);

const license = new URL('ARPHICPL.TXT', directory);
if (!checkOnly) {
  await writeFile(license, await fetchBytes('ARPHICPL.TXT'));
  manifest.characters = Object.fromEntries(Object.entries(manifest.characters).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(new URL('manifest.json', directory), `${JSON.stringify(manifest, null, 2)}\n`);
} else {
  if (!(await readFile(license, 'utf8')).includes('ARPHIC')) throw new Error('Stroke data license is missing or invalid');
  const recorded = JSON.parse(await readFile(new URL('manifest.json', directory), 'utf8'));
  if (recorded.package !== manifest.package || recorded.version !== manifest.version) {
    throw new Error('Stroke manifest package or version does not match the pinned source');
  }
  for (const [character, details] of Object.entries(manifest.characters)) {
    if (recorded.characters?.[character]?.sha256 !== details.sha256) {
      throw new Error(`Stroke manifest digest mismatch for ${character}`);
    }
  }
}
console.log(`${checkOnly ? 'Verified' : 'Bundled'} ${characters.length} P1 stroke files in ${fileURLToPath(directory)}`);

if (process.argv.includes('--font')) {
  // The source font's additional permission explicitly permits web-delivery subsets.
  const sourceTexts = [JSON.stringify({ course, lessons })];
  for (const name of ['app.js', 'index.html', 'styles.css', 'exercises.mjs']) {
    try { sourceTexts.push(await readFile(new URL(`../public/${name}`, import.meta.url), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  sourceTexts.push(Array.from({ length: 0x7f - 0x20 }, (_, index) => String.fromCodePoint(index + 0x20)).join(''));
  sourceTexts.push(Array.from({ length: 0x40 }, (_, index) => String.fromCodePoint(index + 0x3000)).join(''));
  sourceTexts.push(Array.from({ length: 0xf0 }, (_, index) => String.fromCodePoint(index + 0xff00)).join(''));
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'p1-font-subset-'));
  try {
    const textFile = join(temporaryDirectory, 'characters.txt');
    await writeFile(textFile, sourceTexts.join('\n'));
    const outputFile = fileURLToPath(new URL('../public/fonts/p1-zhenkai.woff2', import.meta.url));
    execFileSync('pyftsubset', [
      fileURLToPath(new URL('../public/fonts/lxgw-zhenkai-gb-regular.ttf', import.meta.url)),
      `--text-file=${textFile}`, `--output-file=${outputFile}`, '--flavor=woff2',
      '--layout-features=*', '--notdef-glyph', '--recommended-glyphs',
    ], { stdio: 'inherit' });
    console.log(`Bundled curriculum web font: ${outputFile} (${(await readFile(outputFile)).length} bytes)`);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

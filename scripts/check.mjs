import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
async function sourceFiles(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const lists = await Promise.all(entries.map(entry => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:mjs|js)$/.test(entry.name) ? [path] : [];
  }));
  return lists.flat();
}
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const files = ['server.mjs', ...(await sourceFiles(resolve(root, 'public'))), ...(await sourceFiles(resolve(root, 'scripts'))), ...(await sourceFiles(resolve(root, 'test')))];
for (const file of files) run(['--check', file]);
console.log(`Syntax checked ${files.length} JavaScript files.`);
const tests = (await sourceFiles(resolve(root, 'test'))).filter(path => path.endsWith('.test.mjs'));
if (tests.length) run(['--test', ...tests]);

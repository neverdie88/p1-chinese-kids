import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('..', import.meta.url));
const source = resolve(project, 'public');
const output = resolve(project, 'dist');
const entries = await readdir(source);
if (!entries.includes('index.html')) throw new Error('public/index.html is required before building.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true, filter: path => basename(path) !== '.DS_Store' });
console.log(`Built static app: ${output}`);

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { createStaticServer } from '../server.mjs';

test('local static server serves files and refuses traversal, symlinks, malformed paths and writes', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'p1-chinese-server-'));
  const root = join(directory, 'public');
  await mkdir(root);
  await writeFile(join(root, 'index.html'), '<h1>你好</h1>');
  await writeFile(join(root, 'module.mjs'), 'export const hello = "你好";');
  await writeFile(join(directory, 'private.txt'), 'not public');
  await writeFile(join(root, '.hidden'), 'hidden');
  await symlink(join(directory, 'private.txt'), join(root, 'link.txt'));
  const server = createStaticServer({ root });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const port = server.address().port;
  function read(path, method = 'GET') {
    return new Promise((resolve, reject) => {
      const req = request({ hostname: '127.0.0.1', port, path, method, headers: { Connection: 'close' } }, response => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', chunk => { body += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
      });
      req.on('error', reject);
      req.end();
    });
  }
  const index = await read('/?lesson=1');
  assert.equal(index.status, 200);
  assert.equal(index.body, '<h1>你好</h1>');
  assert.match(index.headers['content-type'], /text\/html/);
  assert.equal(index.headers['x-content-type-options'], 'nosniff');
  const module = await read('/module.mjs');
  assert.match(module.headers['content-type'], /text\/javascript/);
  const head = await read('/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.ok(Number(head.headers['content-length']) > 0);
  assert.equal((await read('/missing')).status, 404);
  assert.equal((await read('/%2e%2e%2fprivate.txt')).status, 403);
  assert.equal((await read('/link.txt')).status, 403);
  assert.equal((await read('/.hidden')).status, 403);
  assert.equal((await read('/%')).status, 400);
  const post = await read('/', 'POST');
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD');
});

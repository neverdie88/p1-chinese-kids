import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = fileURLToPath(new URL('./public/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
};

function inside(root, path) {
  const portion = relative(root, path);
  return portion !== '..' && !portion.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(portion);
}

export function createStaticServer({ root = DEFAULT_ROOT } = {}) {
  const base = resolve(root);
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-cache');
    const error = (status, message) => {
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : message);
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      return error(405, 'Method not allowed.');
    }
    try {
      let pathname;
      try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
      catch { return error(400, 'Invalid path.'); }
      const segments = pathname.split(/[\\/]/);
      if (pathname.includes('\0') || segments.some(part => part === '..' || part.startsWith('.'))) return error(403, 'Forbidden.');
      let path = resolve(base, `.${pathname}`);
      if (!inside(base, path)) return error(403, 'Forbidden.');
      let metadata = await stat(path);
      if (metadata.isDirectory()) {
        path = resolve(path, 'index.html');
        metadata = await stat(path);
      }
      const [realBase, realFile] = await Promise.all([realpath(base), realpath(path)]);
      if (!inside(realBase, realFile)) return error(403, 'Forbidden.');
      if (!metadata.isFile()) return error(404, 'Not found.');
      response.writeHead(200, {
        'Content-Type': TYPES[extname(path).toLowerCase()] || 'application/octet-stream',
        'Content-Length': metadata.size,
      });
      if (request.method === 'HEAD') return response.end();
      createReadStream(realFile).on('error', () => response.destroy()).pipe(response);
    } catch (cause) {
      if (response.headersSent) return response.destroy();
      return error(['ENOENT', 'ENOTDIR'].includes(cause.code) ? 404 : 500, cause.code === 'ENOENT' || cause.code === 'ENOTDIR' ? 'Not found.' : 'Could not serve this file.');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4189);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
  const server = createStaticServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`P1 Chinese is ready at http://127.0.0.1:${port}`));
}

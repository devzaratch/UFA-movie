// Minimal static file server for local testing (no dependencies).
// Usage: node scripts/serve.mjs [port]   (default 8321)
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.argv[2]) || 8321;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.mp4': 'video/mp4',
    '.xml': 'text/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
};

createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/') path = '/index.html';
    if (path.includes('..')) { res.writeHead(400); return res.end(); }

    const file = join(ROOT, path);
    try { statSync(file); }
    catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found');
    }
    const body = readFileSync(file);
    res.writeHead(200, {
        'Content-Type': MIME[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
    });
    res.end(body);
}).listen(PORT, '127.0.0.1', () => {
    console.log(`Serving on http://127.0.0.1:${PORT}/index.html`);
});

// Servidor estático mínimo para probar en local: npm start
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
};
const HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-cache' };

const send = (res, status, body, extra = {}) => {
  res.writeHead(status, { ...HEADERS, ...extra });
  res.end(body);
};

http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Método no permitido');
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    const file = path.join(ROOT, path.normalize(decodeURIComponent(pathname === '/' ? '/index.html' : pathname)));
    const type = TYPES[path.extname(file)];
    if (!file.startsWith(ROOT + path.sep) || !type) return send(res, 403, 'Prohibido');
    return send(res, 200, req.method === 'HEAD' ? '' : await fs.readFile(file), { 'Content-Type': type });
  } catch (err) {
    return send(res, err.code === 'ENOENT' ? 404 : 400, 'No encontrado');
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));

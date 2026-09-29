// Servidor estático mínimo para probar en local: npm start
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const HOST = '127.0.0.1'; // solo accesible desde tu equipo
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
};
// Lista cerrada: solo se sirve lo que la app necesita (nunca serve.js, tests ni .git).
const FILES = new Set([
  'index.html', 'styles.css', 'app.js', 'portions.js', 'sw.js', 'manifest.webmanifest',
  'icon-180.png', 'icon-192.png', 'icon-512.png',
]);
const HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-cache' };

const send = (res, status, body, extra = {}) => {
  res.writeHead(status, { ...HEADERS, ...extra });
  res.end(body);
};

http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Método no permitido');
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    const name = decodeURIComponent(pathname === '/' ? '/index.html' : pathname).slice(1);
    const type = TYPES[path.extname(name)];
    if (!FILES.has(name) || !type) return send(res, 404, 'No encontrado');
    const file = path.join(ROOT, name);
    return send(res, 200, req.method === 'HEAD' ? '' : await fs.readFile(file), { 'Content-Type': type });
  } catch (err) {
    return send(res, err.code === 'ENOENT' ? 404 : 400, 'No encontrado');
  }
}).listen(PORT, HOST, () => console.log(`http://localhost:${PORT}`));

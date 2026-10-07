// Servidor estático mínimo para revisar dist/ en http://localhost:4321
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const PUERTO = Number(process.env.PORT) || 4321;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };

createServer(async (req, res) => {
  let ruta = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let archivo = join(DIST, ruta);
  try {
    if ((await stat(archivo)).isDirectory()) archivo = join(archivo, 'index.html');
    res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream' });
    res.end(await readFile(archivo));
  } catch {
    res.writeHead(404, { 'Content-Type': TIPOS['.html'] });
    res.end(await readFile(join(DIST, '404.html')).catch(() => 'No encontrado'));
  }
}).listen(PUERTO, () => console.log(`→ http://localhost:${PUERTO}`));

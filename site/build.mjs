// Genera dist/: láminas en ambos idiomas, portadas, índice, buscador, íconos PNG,
// sitemap, robots y 404. Uso: npm run build
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { icono } from '../packages/icons/icons.mjs';
import { png } from '../packages/icons/png.mjs';
import { IDIOMAS } from '../packages/render/i18n.mjs';
import { esc, rutas, renderLamina, renderPortada, renderIndice, renderBuscar, renderRaiz, render404 } from '../packages/render/render.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const leer = (p) => JSON.parse(readFileSync(join(RAIZ, p), 'utf8'));
const huella = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);

const inicio = Date.now();
const config = leer('config/site.json');
const fichas = leer('data/fichas.json');
const meta = leer('data/meta.json');
const nombres = leer('data/nombres.json');
const indice = leer('data/index.json');
const R = rutas(config);

if (meta.version_minecraft !== config.version_minecraft) {
  console.warn(`⚠ data/ es de ${meta.version_minecraft} pero config pide ${config.version_minecraft}: corre npm run fetch && npm run data`);
}

// Descripciones originales escritas a mano: content/descripciones/<lang>/<id>.md
// Formato: párrafos separados por línea en blanco; **negrita** y [texto](/ruta/) permitidos.
function markdownMinimo(md) {
  return md.trim().split(/\n\s*\n/).map((p) => `<p>${esc(p.replace(/\n/g, ' '))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((\/[^)\s]*)\)/g, '<a href="$2">$1</a>')}</p>`).join('\n');
}
const descripciones = {};
for (const lang of IDIOMAS) {
  descripciones[lang] = {};
  const dir = join(RAIZ, 'content/descripciones', lang);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
    const id = f.replace(/\.md$/, '');
    if (!fichas[id]) { console.warn(`⚠ descripción para objeto inexistente: ${lang}/${f}`); continue; }
    descripciones[lang][id] = markdownMinimo(readFileSync(join(dir, f), 'utf8'));
  }
}
for (const id of Object.keys(descripciones.es)) {
  if (!descripciones.en[id]) console.warn(`⚠ ${id}: descripción solo en español (falta content/descripciones/en/${id}.md)`);
}
for (const id of Object.keys(descripciones.en)) {
  if (!descripciones.es[id]) console.warn(`⚠ ${id}: descripción solo en inglés (falta content/descripciones/es/${id}.md)`);
}

// Limpieza y estáticos
rmSync(DIST, { recursive: true, force: true });
const escribir = (ruta, contenido) => {
  const destino = join(DIST, ruta.endsWith('/') ? ruta + 'index.html' : ruta);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, contenido);
};
const css = readFileSync(join(RAIZ, 'packages/design/planos.css'), 'utf8');
const js = readFileSync(join(RAIZ, 'site/static/search.js'), 'utf8');
escribir('assets/planos.css', css);
escribir('assets/search.js', js);
escribir('data/index.json', JSON.stringify(indice));

// Íconos
const ids = Object.keys(fichas).sort();
mkdirSync(join(DIST, 'iconos'), { recursive: true });
for (const id of ids) writeFileSync(join(DIST, 'iconos', `${id}.png`), png(icono(id, fichas[id].tipo === 'bloque')));
writeFileSync(join(DIST, 'favicon.png'), png(icono('crafting_table', true), 2));

const ctx = { config, fichas, meta, nombres, descripciones, hashCss: huella(css), hashJs: huella(js), total: ids.length };

// Láminas (numeradas en orden alfabético de id, estable entre idiomas)
let paginas = 0;
ids.forEach((id, i) => {
  for (const lang of IDIOMAS) {
    escribir(R.objeto(lang, id), renderLamina(fichas[id], lang, { ...ctx, numero: i + 1 }));
    paginas++;
  }
});
for (const lang of IDIOMAS) {
  escribir(R.inicio(lang), renderPortada(lang, ctx));
  escribir(R.indice(lang), renderIndice(lang, ctx));
  escribir(R.buscar(lang), renderBuscar(lang, ctx));
}
escribir('index.html', renderRaiz(ctx));
escribir('404.html', render404(ctx));

// Sitemap con alternas por idioma
const url = config.url;
const hoy = new Date().toISOString().slice(0, 10);
const entrada = (pares) => pares.map(([lang, ruta]) => `  <url><loc>${url}${ruta}</loc><lastmod>${hoy}</lastmod>${
  pares.map(([l, r]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${url}${r}"/>`).join('')
}<xhtml:link rel="alternate" hreflang="x-default" href="${url}${pares[0][1]}"/></url>`).join('\n');
const grupos = [
  IDIOMAS.map((l) => [l, R.inicio(l)]),
  IDIOMAS.map((l) => [l, R.indice(l)]),
  ...ids.map((id) => IDIOMAS.map((l) => [l, R.objeto(l, id)])),
];
escribir('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${grupos.map(entrada).join('\n')}
</urlset>
`);
escribir('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`);

// Cabeceras para Cloudflare Pages
escribir('_headers', `/iconos/*
  Cache-Control: public, max-age=604800
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/data/*
  Cache-Control: public, max-age=3600
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`);
escribir('_redirects', `/es /es/ 301\n/en /en/ 301\n`);

console.log(`✓ dist/: ${paginas} láminas, ${ids.length} íconos, versión ${meta.version_minecraft} (${((Date.now() - inicio) / 1000).toFixed(1)} s)`);

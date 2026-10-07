// HTML de las láminas y páginas del sitio. Compartido por site/build.mjs y por
// futuras herramientas (cada una como página propia que reutiliza este paquete).
import { T, otro } from './i18n.mjs';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const num = (n, lang) => (typeof n === 'number' ? n.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', { maximumFractionDigits: 2 }) : n);
const pct = (p, lang) => (p >= 0.995 ? '100 %' : p < 0.001 ? '<0,1 %' : `${num(Math.round(p * 1000) / 10, lang)} %`).replace(/ %/, lang === 'es' ? ' %' : '%').replace('<0,1', lang === 'es' ? '<0,1' : '<0.1');

/** Rutas públicas. Las comparten build, sitemap y buscador. */
export function rutas(config) {
  const r = config.rutas;
  return {
    inicio: (l) => `/${l}/`,
    objeto: (l, id) => `/${l}/${r[l].objeto}/${id}/`,
    indice: (l) => `/${l}/${r[l].indice}/`,
    buscar: (l) => `/${l}/${r[l].buscar}/`,
    icono: (id) => `/iconos/${id}.png`,
  };
}

// ---------------------------------------------------------------- layout

export function pagina({ lang, titulo, descripcion, canonica, alternas = {}, cuerpo, ctx, jsonld, scripts = '', robots }) {
  const t = T[lang];
  const R = rutas(ctx.config);
  const url = ctx.config.url;
  const alt = Object.entries(alternas)
    .map(([l, ruta]) => `<link rel="alternate" hreflang="${l}" href="${url}${ruta}">`).join('\n  ');
  const xdef = alternas.es ? `\n  <link rel="alternate" hreflang="x-default" href="${url}${alternas.es}">` : '';
  const otroLang = otro(lang);
  const enlaceOtro = alternas[otroLang] || R.inicio(otroLang);
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(descripcion)}">
  <link rel="canonical" href="${url}${canonica}">
  ${alt}${xdef}
  ${robots ? `<meta name="robots" content="${robots}">` : ''}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(ctx.config.nombre)}">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(descripcion)}">
  <meta property="og:url" content="${url}${canonica}">
  <meta property="og:locale" content="${t.locale}">
  <meta name="theme-color" content="#f6f7f2" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0e3263" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="/favicon.png" type="image/png">
  <link rel="stylesheet" href="/assets/planos.css?v=${ctx.hashCss}">
  ${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
  <header class="barra"><div class="barra-in">
    <a class="marca" href="${R.inicio(lang)}"><img src="/favicon.png" alt="" width="24" height="24">${esc(ctx.config.nombre)} <small>${esc(t.enciclopedia)}</small></a>
    <form class="busca" action="${R.buscar(lang)}" method="get" role="search">
      <input type="search" name="q" placeholder="${esc(t.buscar_placeholder)}" aria-label="${esc(t.buscar_titulo)}">
      <button type="submit">${esc(t.buscar_boton)}</button>
    </form>
    <nav class="nav">
      <a href="${R.indice(lang)}">${esc(t.nav_indice)}</a>
      <a href="${enlaceOtro}" hreflang="${otroLang}" lang="${otroLang}">${esc(t.otro_idioma)}</a>
    </nav>
  </div></header>
  <main>
${cuerpo}
  </main>
  <footer><div class="in">
    <span>${esc(t.fuente_datos(ctx.meta.version_minecraft))}</span>
    <span>${esc(t.aviso_legal)}</span>
  </div></footer>
${scripts}
</body>
</html>
`;
}

// ---------------------------------------------------------------- piezas

function nombreDe(ctx, id, lang) {
  return ctx.fichas[id]?.nombre[lang] ?? id;
}

function imgIcono(ctx, id, lang, tam = 32) {
  return `<img src="${rutas(ctx.config).icono(id)}" alt="${esc(nombreDe(ctx, id, lang))}" width="${tam}" height="${tam}" loading="lazy">`;
}

/** Celda de receta: objeto concreto o etiqueta (muestra el primero y marca "#"). */
function celda(ctx, lang, ing, cantidad) {
  const t = T[lang];
  const R = rutas(ctx.config);
  if (!ing) return '<span class="celda"></span>';
  const ids = 'item' in ing ? [ing.item] : ing.items;
  const id = ids.find((i) => ctx.fichas[i]) || ids[0];
  if (!id) return '<span class="celda"></span>';
  let titulo = nombreDe(ctx, id, lang);
  if ('etiqueta' in ing) {
    titulo = t.cualquier(ing.etiqueta.replace(/_/g, ' '));
    const nombres = ids.slice(0, 6).map((i) => nombreDe(ctx, i, lang));
    if (ids.length > 6) nombres.push(t.y_mas(ids.length - 6));
    titulo += `: ${nombres.join(', ')}`;
  } else if (!('etiqueta' in ing) && ids.length > 1) {
    titulo = ids.map((i) => nombreDe(ctx, i, lang)).join(' / ');
  }
  const marca = ids.length > 1 ? '<span class="tag">#</span>' : '';
  const n = cantidad > 1 ? `<span class="n">${cantidad}</span>` : '';
  return `<a class="celda" href="${R.objeto(lang, id)}" title="${esc(titulo)}">${imgIcono(ctx, id, lang)}${marca}${n}</a>`;
}

function receta(ctx, lang, ficha, r) {
  const t = T[lang];
  let rejilla;
  if (r.patron) {
    const ancho = Math.max(...r.patron.map((f) => f.length));
    const celdas = [];
    for (const fila of r.patron) for (let i = 0; i < ancho; i++) {
      const ch = fila[i] ?? ' ';
      celdas.push(celda(ctx, lang, ch === ' ' ? null : r.claves[ch]));
    }
    rejilla = `<div class="rejilla g${ancho}">${celdas.join('')}</div>`;
  } else if (r.tipo === 'mesa_sin_forma') {
    const lado = r.ingredientes.length > 4 ? 3 : r.ingredientes.length > 1 ? 2 : 1;
    rejilla = `<div class="rejilla g${lado}">${r.ingredientes.map((i) => celda(ctx, lang, i)).join('')}</div>`;
  } else {
    rejilla = `<div class="rejilla fila">${r.ingredientes.map((i) => celda(ctx, lang, i)).join('')}</div>`;
  }
  const datos = [];
  if (r.tiempo != null) datos.push(`${t.tiempo}: ${t.segundos(num(r.tiempo / 20, lang))}`);
  if (r.experiencia) datos.push(`${t.experiencia}: ${num(r.experiencia, lang)}`);
  const res = celda(ctx, lang, { item: ficha.id }, r.cantidad).replace('class="celda"', 'class="celda resultado"');
  return `<figure class="receta">
      <div class="estacion">${esc(t.estaciones[r.tipo] || r.tipo)}</div>
      <div class="cuerpo">${rejilla}<span class="flecha" aria-hidden="true">→</span>${res}</div>
      ${datos.length ? `<div class="datos">${esc(datos.join(' · '))}</div>` : ''}
    </figure>`;
}

function origenBotin(ctx, lang, b) {
  const R = rutas(ctx.config);
  const [tipo, ...resto] = b.tabla.split('/');
  const id = resto.join('/');
  if (tipo === 'blocks' && ctx.fichas[id]) {
    return `<a href="${R.objeto(lang, id)}">${esc(nombreDe(ctx, id, lang))}</a>`;
  }
  if ((tipo === 'entities' || tipo === 'shearing' || tipo === 'equipment') && ctx.nombres.entidades[resto[0]]) {
    const nombre = ctx.nombres.entidades[resto[0]][lang];
    return esc(resto.length > 1 ? `${nombre} (${resto.slice(1).join(' ').replace(/_/g, ' ')})` : nombre);
  }
  // Pendiente (Fase 1): traducir estructuras y fuentes de cofres.
  return `<span class="mono">${esc(id.replace(/[_/]/g, ' '))}</span>`;
}

function filaBotin(ctx, lang, b) {
  const t = T[lang];
  const cant = b.min === b.max ? num(b.max, lang) : `${num(b.min, lang)}–${num(b.max, lang)}`;
  const cond = [...b.condiciones, ...b.bonus].map((c) => t.condiciones[c] || c).join(', ');
  return `<tr><td>${esc(t.fuentes[b.fuente])}</td><td>${origenBotin(ctx, lang, b)}</td><td class="num">${cant}</td><td class="num">${pct(b.probabilidad, lang)}</td><td>${esc(cond)}</td></tr>`;
}

function especificaciones(ficha, lang, ctx) {
  const t = T[lang];
  const s = [];
  const add = (k, v, nota) => s.push(`<div class="spec"><dt>${esc(k)}</dt><dd>${v}${nota ? ` <small>${esc(nota)}</small>` : ''}</dd></div>`);
  add(t.spec_tipo, esc(t.tipo[ficha.tipo]));
  add(t.spec_pila, ficha.pila === 1 ? esc(t.spec_no_apilable) : num(ficha.pila, lang));
  add(t.spec_rareza, esc(t.rareza[ficha.rareza] || ficha.rareza));
  if (ficha.durabilidad) add(t.spec_durabilidad, esc(t.spec_usos(num(ficha.durabilidad, lang))));
  if (ficha.combate) {
    add(t.spec_danio, num(ficha.combate.danio, lang));
    add(t.spec_velocidad, num(ficha.combate.velocidad, lang));
  }
  if (ficha.armadura) {
    add(t.spec_armadura, num(ficha.armadura.puntos, lang));
    if (ficha.armadura.dureza) add(t.spec_dureza_armadura, num(ficha.armadura.dureza, lang));
    if (ficha.armadura.ranura) add(t.spec_ranura, esc(t.ranura[ficha.armadura.ranura] || ficha.armadura.ranura));
  }
  if (ficha.comida) {
    add(t.spec_nutricion, num(ficha.comida.nutricion, lang));
    add(t.spec_saturacion, num(ficha.comida.saturacion, lang));
  }
  const b = ficha.bloque;
  if (b) {
    const previo = b.fuente_dureza && b.fuente_dureza !== ctx.meta.version_minecraft ? t.spec_dato_previo(b.fuente_dureza) : null;
    if (b.dureza != null) add(t.spec_dureza, b.dureza < 0 ? '∞' : num(b.dureza, lang), previo);
    if (b.resistencia != null) add(t.spec_resistencia, num(b.resistencia, lang), previo);
    add(t.spec_herramienta, esc(b.herramienta.length ? b.herramienta.map((h) => t.herramienta[h] || h).join(', ') : t.spec_cualquiera));
    if (b.nivel) add(t.spec_nivel, esc(t.nivel[b.nivel]));
    if (b.luz) add(t.spec_luz, num(b.luz, lang));
  }
  return `<dl class="specs">${s.join('')}</dl>`;
}

const LIMITE_BOTIN = 12;

// ---------------------------------------------------------------- lámina

export function renderLamina(ficha, lang, ctx) {
  const t = T[lang];
  const R = rutas(ctx.config);
  const v = ctx.meta.version_minecraft;
  const nombre = ficha.nombre[lang];
  let n = 0;
  const sec = (titulo, extra, contenido) => `
    <section>
      <h2><span class="num">${String(++n).padStart(2, '0')}</span> ${esc(titulo)}${extra ? `<span class="extra">${esc(extra)}</span>` : ''}</h2>
      ${contenido}
    </section>`;

  const orden = Object.keys(t.estaciones);
  const recetasOrdenadas = [...ficha.recetas].sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo));
  const recetas = ficha.recetas.length
    ? `<div class="recetas">${recetasOrdenadas.map((r) => receta(ctx, lang, ficha, r)).join('')}</div>`
    : `<p class="suave">${esc(t.sin_receta)}</p>`;

  const resultadosUso = [...new Set(ficha.usos.map((u) => u.resultado))].filter((id) => ctx.fichas[id])
    .sort((a, b) => nombreDe(ctx, a, lang).localeCompare(nombreDe(ctx, b, lang), lang));
  const usos = resultadosUso.length
    ? `<ul class="objetos">${resultadosUso.map((id) => `<li><a href="${R.objeto(lang, id)}">${imgIcono(ctx, id, lang, 24)}<span>${esc(nombreDe(ctx, id, lang))}</span></a></li>`).join('')}</ul>`
    : `<p class="suave">${esc(t.sin_usos)}</p>`;

  const cab = `<thead><tr><th>${esc(t.tabla_fuente)}</th><th>${esc(t.tabla_origen)}</th><th>${esc(t.tabla_cantidad)}</th><th>${esc(t.tabla_prob)}</th><th>${esc(t.tabla_cond)}</th></tr></thead>`;
  const filas = ficha.botin.map((b) => filaBotin(ctx, lang, b));
  let botin;
  if (!filas.length) botin = `<p class="suave">${esc(t.sin_botin)}</p>`;
  else {
    botin = `<div class="tabla-scroll"><table>${cab}<tbody>${filas.slice(0, LIMITE_BOTIN).join('')}</tbody></table></div>`;
    if (filas.length > LIMITE_BOTIN) {
      botin += `<details><summary>${esc(t.mostrar_todas(filas.length))}</summary><div class="tabla-scroll"><table>${cab}<tbody>${filas.slice(LIMITE_BOTIN).join('')}</tbody></table></div></details>`;
    }
    botin += `<p class="nota">${esc(t.prob_nota)}</p>`;
  }

  const etiquetas = ficha.etiquetas.length
    ? `<div class="chips">${ficha.etiquetas.map((e) => `<span class="chip mono">#${esc(e)}</span>`).join('')}</div>` : '';

  const extra = ficha.extra?.notas?.[lang]
    ? sec(t.notas, null, `<div class="escrito-a-mano"><div class="marca-mano">${esc(t.escrito_a_mano)}</div><p>${esc(ficha.extra.notas[lang])}</p></div>`) : '';

  const descripcion = ctx.descripciones?.[lang]?.[ficha.id];

  const cuerpo = `
  <article class="hoja">
    <div class="encabezado">
      <div class="vista">
        <img src="${R.icono(ficha.id)}" alt="${esc(nombre)}" width="128" height="128">
        <span class="cota h">16 px</span><span class="cota v">16 px</span>
      </div>
      <div>
        <p class="subtitulo">${esc(t.lamina)} ${ctx.numero} · minecraft:${esc(ficha.id)}</p>
        <h1>${esc(nombre)}</h1>
        <p class="subtitulo" lang="${otro(lang)}">${esc(ficha.nombre[otro(lang)])}</p>
        <div class="chips">
          <a class="chip acento" href="${R.inicio(lang)}#${ficha.categoria}">${esc(t.categorias[ficha.categoria])}</a>
          <span class="chip">${esc(t.tipo[ficha.tipo])}</span>
        </div>
      </div>
    </div>
    ${descripcion ? `<section class="descripcion">${descripcion}</section>` : ''}
    ${sec(t.especificaciones, null, especificaciones(ficha, lang, ctx))}
    ${sec(t.fabricacion, ficha.recetas.length ? String(ficha.recetas.length) : null, recetas)}
    ${sec(t.usos, ficha.usos.length ? t.usos_desc(resultadosUso.length) : null, usos)}
    ${sec(t.obtencion, null, botin)}
    ${etiquetas ? sec(t.etiquetas, null, etiquetas) : ''}
    ${extra}
    <dl class="cajetin">
      <div><dt>${esc(t.lamina_n)}</dt><dd>${ctx.numero} / ${ctx.total}</dd></div>
      <div><dt>${esc(t.identificador)}</dt><dd>${esc(ficha.id)}</dd></div>
      <div><dt>${esc(t.categoria)}</dt><dd>${esc(t.categorias[ficha.categoria])}</dd></div>
      <div><dt>${esc(t.version)}</dt><dd>${esc(v)}</dd></div>
      <div><dt>${esc(t.escala)}</dt><dd>${esc(t.escala_valor)}</dd></div>
    </dl>
  </article>`;

  const ruta = R.objeto(lang, ficha.id);
  return pagina({
    lang, ctx, cuerpo,
    titulo: `${t.titulo_lamina(nombre)} · ${ctx.config.nombre}`,
    descripcion: t.desc_lamina(ficha, v),
    canonica: ruta,
    alternas: { es: R.objeto('es', ficha.id), en: R.objeto('en', ficha.id) },
    jsonld: {
      '@context': 'https://schema.org', '@type': 'TechArticle',
      headline: t.titulo_lamina(nombre), inLanguage: lang, url: ctx.config.url + ruta,
      image: ctx.config.url + R.icono(ficha.id),
      about: { '@type': 'Thing', name: nombre, identifier: `minecraft:${ficha.id}` },
      publisher: { '@type': 'Organization', name: ctx.config.nombre, url: ctx.config.url },
    },
  });
}

// ---------------------------------------------------------------- portada

const ORDEN_CATEGORIAS = ['construccion', 'natural', 'funcional', 'redstone', 'herramienta', 'combate', 'armadura', 'comida', 'ingrediente', 'huevo_generador', 'varios'];

export function renderPortada(lang, ctx) {
  const t = T[lang];
  const R = rutas(ctx.config);
  const porCat = {};
  for (const f of Object.values(ctx.fichas)) (porCat[f.categoria] ||= []).push(f);
  const cats = ORDEN_CATEGORIAS.filter((c) => porCat[c]).map((c) => {
    const lista = porCat[c];
    const conDatos = lista.filter((f) => f.recetas.length || f.usos.length);
    const muestra = (conDatos.length >= 12 ? conDatos : lista).slice(0, 24);
    return `<div class="categoria" id="${c}">
      <h3>${esc(t.categorias[c])} <span>${lista.length}</span></h3>
      <div class="muestra">${muestra.map((f) => `<a href="${R.objeto(lang, f.id)}" title="${esc(f.nombre[lang])}">${imgIcono(ctx, f.id, lang, 24)}</a>`).join('')}</div>
    </div>`;
  }).join('');
  const cuerpo = `
  <div class="hoja portada">
    <h1>${esc(t.inicio_titulo)}</h1>
    <p class="intro">${esc(t.inicio_intro)}</p>
    <p class="stats">${esc(t.inicio_stats(num(ctx.meta.objetos, lang), num(ctx.meta.recetas, lang), ctx.meta.version_minecraft))}</p>
    <section>
      <h2><span class="num">01</span> ${esc(t.inicio_categorias)}<span class="extra"><a href="${R.indice(lang)}">${esc(t.ver_todos)} →</a></span></h2>
      <div class="categorias">${cats}</div>
    </section>
  </div>`;
  return pagina({
    lang, ctx, cuerpo,
    titulo: `${ctx.config.nombre} · ${t.enciclopedia}: ${t.lema}`,
    descripcion: t.descripcion_sitio,
    canonica: R.inicio(lang),
    alternas: { es: R.inicio('es'), en: R.inicio('en') },
    jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: ctx.config.nombre, url: ctx.config.url + R.inicio(lang), inLanguage: lang,
      potentialAction: { '@type': 'SearchAction', target: `${ctx.config.url}${R.buscar(lang)}?q={q}`, 'query-input': 'required name=q' } },
  });
}

// ---------------------------------------------------------------- índice A–Z

const letraDe = (s) => {
  const c = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')[0]?.toUpperCase() || '#';
  return /[A-Z]/.test(c) ? c : '#';
};

export function renderIndice(lang, ctx) {
  const t = T[lang];
  const R = rutas(ctx.config);
  const lista = Object.values(ctx.fichas).sort((a, b) => a.nombre[lang].localeCompare(b.nombre[lang], lang));
  const grupos = {};
  for (const f of lista) (grupos[letraDe(f.nombre[lang])] ||= []).push(f);
  const letras = Object.keys(grupos).sort();
  const cuerpo = `
  <div class="hoja">
    <h1>${esc(t.indice_titulo)}</h1>
    <p class="subtitulo">${esc(t.indice_desc(num(lista.length, lang)))}</p>
    <nav class="letras" style="margin-top:18px">${letras.map((l) => `<a href="#${l === '#' ? 'otros' : l}">${l}</a>`).join('')}</nav>
    ${letras.map((l) => `
    <h2 class="letra" id="${l === '#' ? 'otros' : l}">${l}</h2>
    <ul class="objetos">${grupos[l].map((f) => `<li><a href="${R.objeto(lang, f.id)}">${imgIcono(ctx, f.id, lang, 24)}<span>${esc(f.nombre[lang])}</span></a></li>`).join('')}</ul>`).join('')}
  </div>`;
  return pagina({
    lang, ctx, cuerpo,
    titulo: `${t.indice_titulo} · ${ctx.config.nombre}`,
    descripcion: t.indice_desc(lista.length),
    canonica: R.indice(lang),
    alternas: { es: R.indice('es'), en: R.indice('en') },
  });
}

// ---------------------------------------------------------------- buscador

export function renderBuscar(lang, ctx) {
  const t = T[lang];
  const R = rutas(ctx.config);
  const textos = { sin: t.buscar_sin_resultados, resultados: t.buscar_resultados, base: R.objeto(lang, '').replace(/\/$/, '') };
  const cuerpo = `
  <div class="hoja">
    <h1>${esc(t.buscar_titulo)}</h1>
    <form class="busca" action="${R.buscar(lang)}" method="get" role="search" style="max-width:520px;margin:12px 0 18px">
      <input id="q" type="search" name="q" placeholder="${esc(t.buscar_placeholder)}" autofocus aria-label="${esc(t.buscar_titulo)}">
      <button type="submit">${esc(t.buscar_boton)}</button>
    </form>
    <p id="estado" class="nota"><noscript>${esc(t.buscar_sin_js)} <a href="${R.indice(lang)}">${esc(t.nav_indice)}</a></noscript></p>
    <ul id="resultados" class="objetos"></ul>
  </div>`;
  return pagina({
    lang, ctx, cuerpo,
    titulo: `${t.buscar_titulo} · ${ctx.config.nombre}`,
    descripcion: t.descripcion_sitio,
    canonica: R.buscar(lang),
    alternas: { es: R.buscar('es'), en: R.buscar('en') },
    robots: 'noindex, follow',
    scripts: `<script>window.BUSCA=${JSON.stringify({ lang, ...textos })}</script>\n<script src="/assets/search.js?v=${ctx.hashJs}" defer></script>`,
  });
}

// ---------------------------------------------------------------- raíz y 404

export function renderRaiz(ctx) {
  const R = rutas(ctx.config);
  const cuerpo = `
  <div class="hoja portada">
    <h1>${esc(ctx.config.nombre)}</h1>
    <p class="intro" lang="es">${esc(T.es.lema)}.</p>
    <p class="intro" lang="en">${esc(T.en.lema)}.</p>
    <div class="idiomas">
      <a href="${R.inicio('es')}" hreflang="es" lang="es">Español →</a>
      <a href="${R.inicio('en')}" hreflang="en" lang="en">English →</a>
    </div>
  </div>`;
  return pagina({
    lang: 'es', ctx, cuerpo,
    titulo: `${ctx.config.nombre} · ${T.es.enciclopedia} / ${T.en.enciclopedia}`,
    descripcion: `${T.es.descripcion_sitio} ${T.en.descripcion_sitio}`,
    canonica: '/',
    alternas: { es: R.inicio('es'), en: R.inicio('en') },
  });
}

export function render404(ctx) {
  const R = rutas(ctx.config);
  const cuerpo = `
  <div class="hoja">
    <p class="subtitulo">404</p>
    <h1 lang="es">${esc(T.es.no_encontrado)}</h1>
    <p lang="es">${esc(T.es.no_encontrado_desc)} <a href="${R.inicio('es')}">${esc(T.es.volver_inicio)}</a></p>
    <h1 lang="en" style="margin-top:28px">${esc(T.en.no_encontrado)}</h1>
    <p lang="en">${esc(T.en.no_encontrado_desc)} <a href="${R.inicio('en')}">${esc(T.en.volver_inicio)}</a></p>
  </div>`;
  return pagina({
    lang: 'es', ctx, cuerpo,
    titulo: `404 · ${ctx.config.nombre}`,
    descripcion: T.es.no_encontrado_desc,
    canonica: '/404.html',
    robots: 'noindex',
  });
}

// Íconos 16×16 dibujados por código. Nada de texturas del juego: todo sale de
// paletas por material, plantillas por familia (MAPS) y formas geométricas.
//
//   icono(id) → matriz 16×16 de colores "#rrggbb" | null
//
// Orden de decisión en familyIcon: herramientas/armas (strokeIcon) → armaduras y
// objetos con plantilla (MAPS) → bloques isométricos (cubo, losa, escalera…) →
// patrón genérico simétrico. Para mejorar una familia, agrega su caso en familyIcon.

const N = 16;

// ---------------------------------------------------------------- color

function hexARgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbAHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** Multiplica la luminosidad (f>1 aclara hacia blanco, f<1 oscurece). */
export function tono(hex, f) {
  const rgb = hexARgb(hex);
  if (f >= 1) return rgbAHex(rgb.map((v) => v + (255 - v) * (f - 1)));
  return rgbAHex(rgb.map((v) => v * f));
}
function mezcla(a, b, t) {
  const x = hexARgb(a), y = hexARgb(b);
  return rgbAHex(x.map((v, i) => v + (y[i] - v) * t));
}

// Hash determinista (FNV-1a) para variaciones reproducibles por id.
export function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function aleatorio(semilla) {
  let s = semilla || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; };
}

// ---------------------------------------------------------------- materiales
// Se buscan como secuencias de palabras del id (separadas por "_"), la más larga primero.

const MATERIALES = {
  // tintes
  white: '#e9ecec', light_gray: '#9d9d97', gray: '#4f5659', black: '#25252b', brown: '#835432',
  red: '#b02e26', orange: '#f9801d', yellow: '#fed83d', lime: '#80c71f', green: '#5e7c16',
  cyan: '#169c9c', light_blue: '#3ab3da', blue: '#3c44aa', purple: '#8932b8', magenta: '#c74ebd', pink: '#f38baa',
  // maderas
  oak: '#b8945f', spruce: '#7a5a34', birch: '#d7c98a', jungle: '#b88764', acacia: '#b8623a',
  dark_oak: '#4f3420', mangrove: '#7d3a32', cherry: '#e4b3ad', pale_oak: '#e8dcd5', bamboo: '#d4c25a',
  crimson: '#7e3a56', warped: '#3a8e8c', poplar: '#c2b48a', wooden: '#a07a45', stick: '#8a6438',
  // piedras y tierras
  stone: '#8c8c8c', cobblestone: '#7b7b7b', cobbled: '#6f6f72', smooth_stone: '#a3a3a3', deepslate: '#4d4d55',
  granite: '#9a6b58', diorite: '#cfcfcf', andesite: '#888c8c', tuff: '#6c6d66', calcite: '#e0e0dc',
  blackstone: '#2f2a30', basalt: '#4f4f55', sandstone: '#dccf9c', sand: '#dccf9c', red_sand: '#c06a30',
  red_sandstone: '#c06a30', end_stone: '#dcdca0', purpur: '#a77ba7', prismarine: '#5fa898',
  netherrack: '#6e2a2a', nether: '#3a1d22', red_nether: '#4a0f12', quartz: '#ece6df', obsidian: '#1e1630',
  crying_obsidian: '#3a1670', mud: '#3e3532', packed_mud: '#8c6a50', mud_bricks: '#8c6a50', brick: '#9a4f3f', bricks: '#9a4f3f',
  terracotta: '#9a5b44', clay: '#a0a6b4', dirt: '#8a5f3c', gravel: '#8a807c', grass: '#6aa84f', moss: '#5a7a2c',
  snow: '#f2f6f8', ice: '#9cc3f2', packed_ice: '#7fa9e8', blue_ice: '#74a7f5', glass: '#cfe8ef',
  amethyst: '#9a6ad1', copper: '#c06e4f', exposed: '#a7856a', weathered: '#6a9a74', oxidized: '#4fa48c',
  sculk: '#0d3b40', resin: '#e07a20', magma: '#8e3b12', glowstone: '#f2c46a', sea_lantern: '#c9e2dc',
  bone: '#e8e2cc', slime: '#7ac25a', honey: '#e8a22c', honeycomb: '#e09a26', hay: '#c9a52a',
  sponge: '#cfc24a', wet_sponge: '#a8a83a', shroomlight: '#f09a4a', nether_wart: '#7a1a1a',
  // metales y gemas
  iron: '#d8d8d8', gold: '#f2d04b', golden: '#f2d04b', diamond: '#4fe0d0', emerald: '#3ccf6a',
  lapis: '#2f53b5', redstone: '#c4281c', netherite: '#4a3f45', coal: '#2b2b2b', charcoal: '#3a3128',
  chainmail: '#9a9a9a', leather: '#8a5032', turtle: '#4f9a3c', flint: '#3c3c3c', echo: '#0f4a52',
  breeze: '#a6b4f0', blaze: '#f0a020', ender: '#2f8a76', heavy: '#5a5a5a', trial: '#c06e4f',
  // sueltos
  paper: '#f0ead8', book: '#7a4a2a', string: '#efefef', feather: '#f4f4f4', egg: '#ead9b8',
  wheat: '#d9c05a', sugar: '#f4f4f4', gunpowder: '#5a5a5a', glowstone_dust: '#f2c46a',
  water: '#3f76e4', lava: '#e8641a', milk: '#f6f6f6', powder_snow: '#f2f6f8',
};
const CLAVES_MATERIAL = Object.keys(MATERIALES).sort((a, b) => b.split('_').length - a.split('_').length || b.length - a.length);

export function material(id) {
  // Gana la coincidencia con más palabras; si empatan, la que aparece primero en el id
  // ("stone_bricks" → stone, "red_nether_bricks" → red_nether).
  const palabras = id.split('_');
  let mejor = null;
  for (const clave of CLAVES_MATERIAL) {
    const p = clave.split('_');
    for (let i = 0; i + p.length <= palabras.length; i++) {
      if (p.every((w, j) => palabras[i + j] === w)) {
        if (!mejor || p.length > mejor.largo || (p.length === mejor.largo && i < mejor.pos)) {
          mejor = { clave, color: MATERIALES[clave], largo: p.length, pos: i };
        }
        break;
      }
    }
  }
  return mejor && { clave: mejor.clave, color: mejor.color };
}

/** Color de un material concreto (para mineral de una mena, etc.). */
const color = (clave) => MATERIALES[clave];

function paleta(base) {
  return { a: base, b: tono(base, 0.72), c: tono(base, 1.35), o: tono(base, 0.32) };
}

// ---------------------------------------------------------------- lienzo

function lienzo() {
  return Array.from({ length: N }, () => Array(N).fill(null));
}
function pon(m, x, y, c) {
  if (x >= 0 && y >= 0 && x < N && y < N && c) m[y][x] = c;
}

/** Contorno: pinta `c` en los vacíos 4-vecinos de lo dibujado. */
function contorno(m, c) {
  const copia = m.map((f) => f.slice());
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (copia[y][x]) continue;
    const vecino = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => copia[y + dy]?.[x + dx]);
    if (vecino) m[y][x] = c;
  }
  return m;
}

/** Línea de Bresenham con grosor 1. */
function linea(m, [x0, y0], [x1, y1], c) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    pon(m, x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// ---------------------------------------------------------------- strokeIcon
// Herramientas y armas: trazos (polilíneas) por clave de color + contorno automático.

const MANGO = '#8a6438';

const TRAZOS = {
  sword: [
    { c: 'h', pts: [[2, 13], [4, 11]] },
    { c: 'b', pts: [[2, 10], [5, 13]] },
    { c: 'a', pts: [[5, 10], [13, 2]] },
    { c: 'c', pts: [[6, 10], [13, 3]] },
    { c: 'c', pts: [[5, 9], [12, 2]] },
  ],
  pickaxe: [
    { c: 'h', pts: [[3, 12], [11, 4]] },
    { c: 'a', pts: [[4, 3], [6, 2], [9, 2], [11, 3], [12, 4], [13, 6], [13, 9], [12, 11]] },
    { c: 'c', pts: [[5, 4], [6, 3], [9, 3], [11, 4]] },
  ],
  axe: [
    { c: 'h', pts: [[3, 13], [10, 6]] },
    { c: 'a', pts: [[7, 4], [9, 2]] },
    { c: 'a', pts: [[8, 5], [11, 2]] },
    { c: 'a', pts: [[9, 6], [12, 3]] },
    { c: 'b', pts: [[11, 6], [13, 4]] },
    { c: 'c', pts: [[8, 3], [10, 1]] },
  ],
  shovel: [
    { c: 'h', pts: [[3, 12], [9, 6]] },
    { c: 'a', pts: [[9, 5], [11, 3], [13, 3], [13, 5], [11, 7], [10, 7]] },
    { c: 'c', pts: [[10, 5], [12, 4]] },
    { c: 'a', pts: [[11, 5], [12, 5]] },
  ],
  hoe: [
    { c: 'h', pts: [[3, 12], [11, 4]] },
    { c: 'a', pts: [[8, 3], [10, 1], [12, 3], [13, 4]] },
    { c: 'c', pts: [[9, 3], [10, 2]] },
  ],
  spear: [
    { c: 'h', pts: [[2, 13], [10, 5]] },
    { c: 'a', pts: [[10, 5], [13, 2]] },
    { c: 'c', pts: [[11, 5], [13, 3]] },
    { c: 'c', pts: [[10, 4], [12, 2]] },
  ],
  stick: [{ c: 'h', pts: [[4, 12], [11, 5]] }, { c: 'c', pts: [[5, 12], [12, 5]] }],
  rod: [
    { c: 'h', pts: [[2, 13], [13, 2]] },
    { c: 's', pts: [[13, 2], [14, 5], [14, 11]] },
  ],
};

export function strokeIcon(trazos, pal) {
  const m = lienzo();
  for (const t of trazos) {
    const c = t.c === 'h' ? MANGO : t.c === 's' ? '#e8e8e8' : pal[t.c];
    for (let i = 0; i < t.pts.length - 1; i++) linea(m, t.pts[i], t.pts[i + 1], c);
    if (t.pts.length === 1) pon(m, ...t.pts[0], c);
  }
  return contorno(m, pal.o);
}

// ---------------------------------------------------------------- MAPS
// Plantillas de 16×16. Claves: . vacío · o contorno · a base · b sombra · c brillo
// x acento (segundo color) · w blanco · k negro.

export const MAPS = {
  helmet: [
    '................', '................', '................', '....oooooooo....',
    '...occcccccaao..', '..ocaaaaaaaabbo.', '..oaaaaaaaaabbo.', '..oaboooooooabo.',
    '..oao......oabo.', '..oao......oabo.', '..ooo......oooo.', '................',
    '................', '................', '................', '................',
  ],
  chestplate: [
    '................', '..oooo....oooo..', '.occaao..oacaao.', '.oaaaaooooaaaab o',
    '.oaaaaaaaaaaaabo', '.oboaaaaaaaaobbo', '..ooaaaaaaaabo o', '...oaaacaaaabo..',
    '...oaaacaaaabo..', '...oaaaaaaaabo..', '...oaaaaaaaabo..', '...oaaaaaaaabo..',
    '...obbbbbbbbbo..', '....oooooooooo..', '................', '................',
  ],
  leggings: [
    '................', '................', '...oooooooooo...', '...occcaaaabbo..',
    '...oaaaaaaaabo..', '...oaaaoooaabo..', '...oaao...oabo..', '...oaao...oabo..',
    '...oaao...oabo..', '...oaao...oabo..', '...ocao...oabo..', '...oaao...oabo..',
    '...obbo...obbo..', '...oooo...oooo..', '................', '................',
  ],
  boots: [
    '................', '................', '................', '................',
    '................', '..oooo....oooo..', '..ocao....ocao..', '..oaao....oaao..',
    '..oaao....oaao..', '..oaao....oaao..', '.ocaao...ocaao..', 'oaaabo..oaaabo..',
    'obbbbo..obbbbo..', 'oooooo..oooooo..', '................', '................',
  ],
  ingot: [
    '................', '................', '................', '................',
    '................', '.......oooooo...', '.....ooccccaao..', '...ooccaaaabbo..',
    '..ocaaaaaabbbo..', '.oaaaaaabbbbo...', '.obbbbbbbbbo....', '.oooooooooo.....',
    '................', '................', '................', '................',
  ],
  nugget: [
    '................', '................', '................', '................',
    '................', '................', '......ooo.......', '.....ocaao......',
    '....ocaaabo.....', '....oaaabbo.....', '.....obbbo......', '......ooo.......',
    '................', '................', '................', '................',
  ],
  gem: [
    '................', '................', '................', '.....oooooo.....',
    '....occcccao....', '...occaaaaabo...', '..oaaaaaaaaabo..', '..obaaaaaaabbo..',
    '...obaaaaabbo...', '....obaaabbo....', '.....obabbo.....', '......obbo......',
    '.......oo.......', '................', '................', '................',
  ],
  shard: [
    '................', '................', '.........oo.....', '........oco.....',
    '.......ocao.....', '......ocaao.....', '.....ocaabo.....', '....ocaabo......',
    '...ocaabo.......', '...oaabo........', '...oabo.........', '...obo..........',
    '....o...........', '................', '................', '................',
  ],
  raw: [
    '................', '................', '................', '................',
    '.......oooo.....', '.....ooccaao....', '....ocaaaaabo...', '...ocaaxaaabo...',
    '...oaaaaaxabo...', '...oaxaaaaabo...', '....obaaaabbo...', '.....obbbbbo....',
    '......ooooo.....', '................', '................', '................',
  ],
  dye: [
    '................', '................', '................', '......oooo......',
    '.....ocaaao.....', '....ocaaaabo....', '...ocaaaaaabo...', '...oaaaaaaabo...',
    '...oaaaaaaabo...', '...obaaaaabbo...', '....obbbbbbo....', '.....oooooo.....',
    '................', '................', '................', '................',
  ],
  dust: [
    '................', '................', '................', '................',
    '................', '.......o........', '......oco.......', '.....ocaao..o...',
    '..o..oaaao.oco..', '.oco.oaaabooabo.', '.oabooaaaaboaao.', 'oaaaaaaaaaabbbbo',
    'obbbbbbbbbbbbbbo', '.oooooooooooooo.', '................', '................',
  ],
  bucket: [
    '................', '................', '................', '....oooooooo....',
    '...owwwwwwwwo...', '...okxxxxxxko...', '...oxxxxxxxxo...', '...owcwwwwwbo...',
    '....owwwwwbo....', '....owwwwwbo....', '....owcwwwbo....', '.....owwwbo.....',
    '.....oooooo.....', '................', '................', '................',
  ],
  bottle: [
    '................', '................', '......oooo......', '......obbo......',
    '.......oo.......', '......owwo......', '.....oxxxxo.....', '....oxxcxxxo....',
    '....oxcxxxxo....', '....oxxxxxbo....', '....oxxxxxbo....', '.....oxxxbo.....',
    '......oooo......', '................', '................', '................',
  ],
  egg: [
    '................', '................', '......oooo......', '.....oaaaao.....',
    '....oaxaaaao....', '....oaaaaxao....', '...oaaaaaaaao...', '...oxaaaaaaao...',
    '...oaaaxaaaxo...', '...oaaaaaaaao...', '...obaaxaaabo...', '....obaaaabo.....',
    '.....oooooo.....', '................', '................', '................',
  ],
  book: [
    '................', '................', '................', '...oooooooooo...',
    '..oaaaaaaaaaxo..', '..oaccccccaaxo..', '..oaaaaaaaaaxo..', '..oaaaaaaaaaxo..',
    '..oaaaaaaaaaxo..', '..oaaaaaaaaaxo..', '..oaaaaaaaaaxo..', '..obbbbbbbbbwo..',
    '...oooooooooo...', '................', '................', '................',
  ],
};

function desdeMapa(mapa, pal, extra = {}) {
  const m = lienzo();
  const colores = { o: pal.o, a: pal.a, b: pal.b, c: pal.c, w: '#e6e6e6', k: '#2a2a2a', ...extra };
  mapa.forEach((fila, y) => [...fila.padEnd(N, '.').slice(0, N)].forEach((ch, x) => {
    if (ch !== '.' && ch !== ' ') pon(m, x, y, colores[ch] || pal.a);
  }));
  return m;
}

// ---------------------------------------------------------------- bloques isométricos
// Proyección: x hacia la derecha-abajo, z hacia la izquierda-abajo, y hacia arriba.

const proyectar = (x, y, z) => [8 + (x - z) * 7.5, 0.5 + (x + z) * 3.75 + (1 - y) * 7.5];

/** Caras visibles de una caja [x0,x1]×[y0,y1]×[z0,z1]: arriba, izquierda (z1) y derecha (x1). */
function caras([x0, y0, z0, x1, y1, z1]) {
  return [
    { cara: 'arriba', o: [x0, y1, z0], e1: [x1 - x0, 0, 0], e2: [0, 0, z1 - z0] },
    { cara: 'izq', o: [x0, y1, z1], e1: [x1 - x0, 0, 0], e2: [0, y0 - y1, 0] },
    { cara: 'der', o: [x1, y1, z1], e1: [0, 0, z0 - z1], e2: [0, y0 - y1, 0] },
  ];
}

function rellenarCara(m, f, colorear) {
  const O = proyectar(...f.o);
  const P1 = proyectar(f.o[0] + f.e1[0], f.o[1] + f.e1[1], f.o[2] + f.e1[2]);
  const P2 = proyectar(f.o[0] + f.e2[0], f.o[1] + f.e2[1], f.o[2] + f.e2[2]);
  const a = [P1[0] - O[0], P1[1] - O[1]], b = [P2[0] - O[0], P2[1] - O[1]];
  const det = a[0] * b[1] - a[1] * b[0];
  if (Math.abs(det) < 1e-6) return;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = x + 0.5 - O[0], py = y + 0.5 - O[1];
    const u = (px * b[1] - py * b[0]) / det;
    const v = (a[0] * py - a[1] * px) / det;
    if (u >= -0.02 && u <= 1.02 && v >= -0.02 && v <= 1.02) {
      const c = colorear(f.cara, Math.min(Math.max(u, 0), 0.999), Math.min(Math.max(v, 0), 0.999), x, y);
      if (c) m[y][x] = c;
    }
  }
}

const LUZ = { arriba: 1.12, izq: 0.86, der: 0.68 };

/** Texturas procedurales: devuelven el color de un punto (u,v) de una cara. */
function textura(tipo, base, id, mineral) {
  const r = aleatorio(hash(id));
  const ruido = Array.from({ length: 256 }, () => r());
  const n = (x, y) => ruido[(y * 16 + x) & 255];
  const sombra = (cara, f) => tono(base, LUZ[cara] * f);
  switch (tipo) {
    case 'tablones':
      // rejilla de 8×8 texeles por cara: tablas de 4 texeles con junta escalonada
      return (cara, u, v, x, y) => {
        const tu = Math.floor((cara === 'arriba' ? v : u) * 8), tv = Math.floor((cara === 'arriba' ? u : v) * 8);
        const tabla = Math.floor(tv / 4);
        if (tv % 4 === 3) return sombra(cara, 0.68);
        if (tu === (tabla % 2 ? 2 : 6)) return sombra(cara, 0.8);
        return sombra(cara, 0.97 + tabla * 0.05 + n(x, y) * 0.04);
      };
    case 'tronco': {
      const corteza = tono(base, 0.62);
      return (cara, u, v, x, y) => {
        if (cara === 'arriba') {
          const d = Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5));
          if (d > 0.37) return tono(corteza, LUZ.arriba);
          return tono(base, LUZ.arriba * (d > 0.2 && d < 0.3 ? 0.88 : 1.04));
        }
        const tu = Math.floor(u * 8);
        return tono(corteza, LUZ[cara] * (tu % 3 === 1 ? 0.8 : 1) * (0.95 + n(x, y) * 0.1));
      };
    }
    case 'ladrillos':
      return (cara, u, v) => {
        const tu = Math.floor(u * 8), tv = Math.floor(v * 8);
        const fila = Math.floor(tv / 3);
        if (tv % 3 === 2) return sombra(cara, 0.66);
        if (tu % 4 === (fila % 2 ? 1 : 3)) return sombra(cara, 0.72);
        return sombra(cara, 1 + (fila % 2) * 0.04);
      };
    case 'mena': {
      return (cara, u, v, x, y) => {
        const cx = Math.floor(u * 4), cy = Math.floor(v * 4);
        const pinta = n(cx * 3 + 1, cy * 5 + (cara === 'der' ? 7 : cara === 'izq' ? 3 : 0)) > 0.55;
        const dentro = Math.abs((u * 4) % 1 - 0.5) < 0.32 && Math.abs((v * 4) % 1 - 0.5) < 0.32;
        if (pinta && dentro) return tono(mineral, LUZ[cara]);
        return sombra(cara, 0.92 + n(x, y) * 0.16);
      };
    }
    case 'vidrio':
      return (cara, u, v) => {
        const borde = u < 0.12 || u > 0.88 || v < 0.12 || v > 0.88;
        if (borde) return sombra(cara, 0.9);
        if (Math.abs(u - v) < 0.07 && u > 0.25 && u < 0.6) return tono(base, 1.6);
        return null;
      };
    case 'hojas':
      return (cara, u, v, x, y) => (n(x, y) > 0.22 ? sombra(cara, 0.8 + n(y, x) * 0.4) : null);
    case 'liso':
      return (cara) => sombra(cara, 1);
    case 'lana':
      return (cara, u, v, x, y) => sombra(cara, 0.97 + ((x + y) % 2) * 0.05);
    default:
      return (cara, u, v, x, y) => sombra(cara, 0.9 + n(x, y) * 0.2);
  }
}

const FORMAS = {
  cubo: [[0, 0, 0, 1, 1, 1]],
  losa: [[0, 0, 0, 1, 0.5, 1]],
  escalera: [[0, 0, 0, 1, 0.5, 1], [0, 0.5, 0, 1, 1, 0.5]],
  muro: [[0.25, 0, 0.25, 0.75, 1, 0.75], [0, 0, 0.35, 1, 0.8, 0.65]],
  valla: [[0.4, 0, 0, 0.6, 1, 0.2], [0.4, 0, 0.8, 0.6, 1, 1], [0.45, 0.35, 0, 0.55, 0.5, 1], [0.45, 0.7, 0, 0.55, 0.85, 1]],
  panel: [[0.44, 0, 0, 0.56, 1, 1]],
  alfombra: [[0, 0, 0, 1, 0.08, 1]],
  placa: [[0.1, 0, 0.1, 0.9, 0.08, 0.9]],
  boton: [[0.3, 0, 0.35, 0.7, 0.18, 0.65]],
  trampilla: [[0, 0, 0, 1, 0.2, 1]],
  puerta: [[0.4, 0, 0, 0.6, 1, 1]],
};

function bloqueIso(forma, tipoTextura, base, id, mineral) {
  const m = lienzo();
  const tex = textura(tipoTextura, base, id, mineral);
  // pintor: de atrás (suma x+z menor) hacia adelante
  const cajas = [...FORMAS[forma]].sort((p, q) => (p[0] + p[2] + p[1]) - (q[0] + q[2] + q[1]));
  for (const caja of cajas) for (const f of caras(caja)) rellenarCara(m, f, tex);
  return m;
}

// ---------------------------------------------------------------- patrón genérico

/** Patrón simétrico determinista para lo que no encaja en ninguna familia. */
export function patronGenerico(id, base) {
  const pal = paleta(base);
  const r = aleatorio(hash(id) ^ 0x9e3779b9);
  const m = lienzo();
  for (let y = 3; y < 13; y++) for (let x = 3; x < 8; x++) {
    const dist = Math.hypot(x - 7.5, y - 7.5);
    if (r() < 0.78 - dist * 0.07) {
      const c = r() < 0.25 ? pal.c : r() < 0.3 ? pal.b : pal.a;
      pon(m, x, y, c); pon(m, 15 - x, y, c);
    }
  }
  return contorno(m, pal.o);
}

// ---------------------------------------------------------------- familyIcon

const ARMADURAS = ['helmet', 'chestplate', 'leggings', 'boots'];
const HERRAMIENTAS = ['sword', 'pickaxe', 'axe', 'shovel', 'hoe', 'spear'];
const GEMAS = new Set(['diamond', 'emerald', 'lapis_lazuli', 'quartz', 'prismarine_crystals', 'echo_shard', 'heart_of_the_sea']);
const ESQUIRLAS = new Set(['amethyst_shard', 'prismarine_shard', 'flint', 'netherite_scrap']);
const POLVOS = new Set(['redstone', 'glowstone_dust', 'gunpowder', 'sugar', 'blaze_powder']);
const MENAS = { coal: 'coal', iron: 'iron', gold: 'gold', diamond: 'diamond', emerald: 'emerald', lapis: 'lapis', redstone: 'redstone', copper: 'copper', quartz: 'quartz' };

function colorPorDefecto(id) {
  // Sin material reconocible: un tono estable derivado del id, poco saturado.
  const h = hash(id) % 360;
  const s = 0.35, l = 0.55;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return rgbAHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

/**
 * Elige el dibujo de un id. `esBloque` viene de los datos (registro de bloques).
 */
export function familyIcon(id, esBloque = false) {
  const mat = material(id);
  const base = mat ? mat.color : colorPorDefecto(id);
  const pal = paleta(base);
  const fin = (s) => id.endsWith('_' + s) || id === s;

  // Herramientas y armas
  for (const h of HERRAMIENTAS) if (fin(h)) return strokeIcon(TRAZOS[h], pal);
  if (id === 'stick' || id === 'blaze_rod' || id === 'breeze_rod') return strokeIcon(TRAZOS.stick, id === 'stick' ? pal : paleta(color(id.split('_')[0])));
  if (id === 'fishing_rod') return strokeIcon(TRAZOS.rod, pal);

  // Armaduras
  for (const a of ARMADURAS) if (fin(a)) return desdeMapa(MAPS[a], pal);

  // Objetos con plantilla
  if (fin('ingot')) return desdeMapa(MAPS.ingot, pal);
  if (fin('nugget')) return desdeMapa(MAPS.nugget, pal);
  if (id.startsWith('raw_') && !esBloque) return desdeMapa(MAPS.raw, pal, { x: tono(base, 0.55) });
  if (GEMAS.has(id)) return desdeMapa(MAPS.gem, pal);
  if (ESQUIRLAS.has(id)) return desdeMapa(MAPS.shard, pal);
  if (POLVOS.has(id)) return desdeMapa(MAPS.dust, pal);
  if (fin('dye')) return desdeMapa(MAPS.dye, pal);
  if (fin('spawn_egg')) {
    const r = aleatorio(hash(id));
    const c1 = colorPorDefecto(id), c2 = colorPorDefecto(id + r());
    return desdeMapa(MAPS.egg, paleta(c1), { x: c2 });
  }
  if (id === 'bucket' || fin('bucket')) {
    const contenido = id === 'bucket' ? '#c9c9c9' : (material(id.replace(/_bucket$/, ''))?.color || '#3f76e4');
    return desdeMapa(MAPS.bucket, paleta('#c9c9c9'), { x: contenido, w: '#cfcfcf' });
  }
  if (id === 'glass_bottle' || id.includes('potion') || fin('bottle')) {
    const liquido = id === 'glass_bottle' ? '#dfeff4' : colorPorDefecto(id);
    return desdeMapa(MAPS.bottle, paleta('#a8c8d8'), { x: liquido, w: '#dfeff4' });
  }
  if (id === 'book' || id.endsWith('_book') || id === 'writable_book') {
    const tapa = id === 'enchanted_book' ? '#8a3aa8' : '#7a4a2a';
    return desdeMapa(MAPS.book, paleta(tapa), { x: '#f0ead8', w: '#f0ead8' });
  }

  // Bloques
  if (esBloque) {
    let forma = 'cubo';
    if (fin('slab')) forma = 'losa';
    else if (fin('stairs')) forma = 'escalera';
    else if (fin('wall') && !id.includes('torch') && !id.includes('sign') && !id.includes('banner')) forma = 'muro';
    else if (fin('fence') || fin('fence_gate')) forma = 'valla';
    else if (fin('pane') || id === 'iron_bars') forma = 'panel';
    else if (fin('carpet')) forma = 'alfombra';
    else if (fin('pressure_plate')) forma = 'placa';
    else if (fin('button')) forma = 'boton';
    else if (fin('trapdoor')) forma = 'trampilla';
    else if (fin('door')) forma = 'puerta';

    let tex = 'ruido';
    let mineral;
    if (fin('planks') || (mat && ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak', 'bamboo', 'crimson', 'warped', 'poplar'].includes(mat.clave) && !/log|wood|stem|hyphae|leaves|sapling/.test(id))) tex = 'tablones';
    if (/(_log|_wood|_stem|_hyphae|bamboo_block)$/.test(id)) tex = 'tronco';
    if (/brick/.test(id)) tex = 'ladrillos';
    if (/glass/.test(id)) tex = 'vidrio';
    if (fin('leaves')) tex = 'hojas';
    if (/wool|carpet/.test(id)) tex = 'lana';
    if (/concrete$|smooth_|_block$/.test(id) && tex === 'ruido') tex = 'liso';
    let colorBase = base;
    if (fin('ore')) {
      tex = 'mena';
      const clave = Object.keys(MENAS).find((k) => id.includes(k));
      mineral = clave ? color(MENAS[clave]) : '#ffffff';
      colorBase = id.startsWith('deepslate') ? color('deepslate') : id.startsWith('nether') ? color('netherrack') : color('stone');
    }
    if (fin('leaves')) colorBase = mat && mat.clave === 'cherry' ? '#f0a8c8' : mat && mat.clave === 'pale_oak' ? '#a8ab9a' : '#4f8a32';
    if (fin('glass') && !mat) colorBase = color('glass');
    return bloqueIso(forma, tex, colorBase, id, mineral);
  }

  return patronGenerico(id, base);
}

export function icono(id, esBloque) {
  return familyIcon(id, esBloque);
}

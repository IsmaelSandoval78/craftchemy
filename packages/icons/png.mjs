// Codificador PNG mínimo (RGBA 8 bits) sin dependencias: solo node:zlib.
import { deflateSync } from 'node:zlib';

const TABLA_CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([largo, td, crc]);
}

/** Convierte "#rrggbb" o null en [r,g,b,a]. */
export function rgba(hex) {
  if (!hex) return [0, 0, 0, 0];
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

/**
 * pixeles: matriz [fila][columna] de colores "#rrggbb" o null (transparente).
 * escala: cada píxel lógico se dibuja como escala×escala.
 */
export function png(pixeles, escala = 1) {
  const alto = pixeles.length * escala;
  const ancho = pixeles[0].length * escala;
  const crudo = Buffer.alloc(alto * (ancho * 4 + 1));
  let o = 0;
  for (let y = 0; y < alto; y++) {
    crudo[o++] = 0; // filtro: ninguno
    const fila = pixeles[Math.floor(y / escala)];
    for (let x = 0; x < ancho; x++) {
      const [r, g, b, a] = rgba(fila[Math.floor(x / escala)]);
      crudo[o++] = r; crudo[o++] = g; crudo[o++] = b; crudo[o++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8 bits, RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]);
}

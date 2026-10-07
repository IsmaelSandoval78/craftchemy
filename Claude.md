# Craftchemy — contexto para Claude Code

Sitio estático bilingüe (español/inglés) en **craftchemy.com** con una "lámina técnica" por cada objeto de Minecraft, generada desde los datos oficiales del juego. Estilo visual: planos (cianotipo en modo oscuro, whiteprint en modo claro) con íconos pixelados originales a color. Desplegado en Cloudflare Pages desde GitHub Actions.

Dueño: Ismael. Habla en español; los nombres de claves de datos y comentarios del código están en español.

## Comandos

```bash
npm run fetch                 # descarga fuentes de la versión en config/site.json a .cache/
npm run data                  # genera data/fichas.json, index.json, meta.json
python3 pipeline/validate.py  # pruebas de cordura; córrelo siempre tras cambiar el pipeline
npm run build                 # genera dist/ (3.316 láminas, íconos PNG, sitemap)
npm run preview               # sirve dist/ en localhost:4321
```

`data/` está versionado, así que para trabajar en el sitio basta `npm run build` (no hace falta `fetch`). Requiere Node 20+, Python 3.10+, `curl` y `unzip`.

## Estructura

- `config/site.json` — nombre, dominio, versión de Minecraft (hoy 26.3), idiomas y rutas (`/es/objeto/`, `/en/item/`)
- `pipeline/` — `fetch_sources.sh`, `build_fichas.py` (esquema documentado en su docstring y en el README anterior), `validate.py`, `latest_version.py`
- `packages/icons/icons.mjs` — íconos 16×16 dibujados por código (plantillas por familia en `MAPS`, `strokeIcon`, `familyIcon`); `png.mjs` los renderiza a PNG sin dependencias
- `packages/render/` — `render.mjs` (HTML de la lámina, compartido) e `i18n.mjs` (todos los textos en ambos idiomas)
- `packages/design/planos.css` — tokens de color y estilos
- `site/build.mjs` — generador del sitio; `site/static/search.js` — buscador
- `content/extra.json` — datos escritos a mano que el juego no trae
- `docs/` — ARQUITECTURA, ROADMAP, NOMBRE, LEGAL

## Reglas del proyecto

- **Todo texto visible va en ambos idiomas** (`i18n.mjs` o `content/`). Nunca dejar una cadena solo en uno.
- **Nada de assets de Mojang**: ni texturas, ni logos, ni "Minecraft" en el nombre del producto. Los íconos son dibujos propios.
- **No copiar texto de la Minecraft Wiki** (licencia no comercial). Las descripciones se escriben originales.
- **Datos factuales solo desde el pipeline**; si algo falta en los datos del juego, va a `content/` y se marca como escrito a mano.
- Tras tocar el pipeline: `npm run data && python3 pipeline/validate.py`. Si encuentras un caso que se rompió, agrega una comprobación a `validate.py`.
- El sitio debe seguir siendo estático: el único JS de cliente es el buscador. Nuevas herramientas interactivas van como páginas propias que reutilizan `packages/`.
- Colores siempre vía tokens CSS de `planos.css`, en ambos temas.

## Trampas conocidas

- Desde la 26.2, el botín usa `modifier` en vez de `functions`, `type` en vez de `condition`, y las condiciones pueden ser referencias a `data/minecraft/predicate/`. `build_fichas.py` soporta ambos formatos.
- PrismarineJS (dureza/resistencia de bloques) va por detrás de mcmeta; los bloques nuevos salen sin esos valores.
- Los íconos que no encajan en ninguna plantilla usan un patrón genérico simétrico; mejorar familias en `familyIcon`.

## Estado

Fase 0 (cimientos) terminada. Siguiente: **Fase 1**, ver `docs/ROADMAP.md`. Pendientes concretos:
1. Traducir nombres de etiquetas de objetos (hoy sale "cualquier planks") y de estructuras/fuentes de cofres en `i18n.mjs`.
2. Plantillas de íconos para comida, plantas, objetos de criaturas y discos.
3. Descripciones originales de los 150 objetos más buscados, en `content/descripciones/{es,en}/<id>.md`.
4. Integrar el explorador de crafteo (mapa de usos navegable) en la lámina.

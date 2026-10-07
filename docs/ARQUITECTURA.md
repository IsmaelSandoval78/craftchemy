# Arquitectura

```
Mojang (client.jar, es_es)  ┐
misode/mcmeta (resúmenes)   ├─ pipeline/fetch_sources.sh ─→ .cache/<versión>/   (no versionado)
PrismarineJS (dureza)       ┘
                                     │
                       pipeline/build_fichas.py
                                     ↓
                     data/fichas.json · index.json · meta.json · nombres.json   (versionado)
                                     │   ← content/ (escrito a mano)
                       pipeline/validate.py  (hechos conocidos del juego)
                                     ↓
                            site/build.mjs
          packages/render (HTML + i18n) · packages/icons (PNG) · packages/design (CSS)
                                     ↓
                     dist/  →  Cloudflare Workers, assets estáticos (craftchemy.com)
```

## Decisiones

- **Sitio estático.** Una página HTML por objeto e idioma. El único JavaScript de cliente es el buscador (`site/static/search.js`), que lee `/data/index.json`.
- **`data/` versionado.** Para trabajar en el sitio no hace falta descargar nada. Los cambios de versión del juego llegan como un PR con el diff de los datos.
- **Fuentes:** recetas, botín, etiquetas y predicados salen del `client.jar` de Mojang. Los nombres salen de `en_us.json` (dentro del jar) y de `es_es.json` (índice de assets). Los registros y componentes de objetos (pila, durabilidad, daño, comida) salen de los resúmenes de misode/mcmeta. La dureza y la resistencia salen de PrismarineJS.
- **No se publica ningún asset del juego.** Del jar solo se leen JSON de datos y textos. Los íconos se dibujan por código (`packages/icons`).
- **Rutas:** `/es/objeto/<id>/` y `/en/item/<id>/`, más portada, índice y buscador por idioma. `hreflang` va en cada página y en el sitemap.

## Formato de botín

Desde la 26.2, Mojang cambió:

| Antes                   | 26.2+                          |
|-------------------------|--------------------------------|
| `functions`             | `modifier`                     |
| `function` / `condition` (tipo) | `type`                 |
| condición siempre objeto | también cadena → `data/minecraft/predicate/<ruta>.json` |
| entrada `tag` con `name` | entrada `tag` con `items`     |

`build_fichas.py` acepta ambos formatos.

La probabilidad publicada es aproximada: `peso / peso total de la pool`, multiplicada por las condiciones `random_chance`, y combinada según las tiradas. Las ramas de `alternatives` heredan la condición opuesta de las anteriores (por ejemplo, "sin toque de seda").

## Recetas en 26.3

- Tipos nuevos: `crafting_transmute` (un resultado vacío significa copiar el objeto, como al clonar mapas), `crafting_dye` y `crafting_imbue`.
- Las recetas de alto horno y ahumador traen `cookingtime: 200` en los datos (antes era 100). Se publica el dato tal cual; queda pendiente confirmarlo en el juego.

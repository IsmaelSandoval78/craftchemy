# Hoja de ruta

## Fase 0 · Cimientos ✅
- Pipeline de datos desde fuentes oficiales, con validación de hechos conocidos.
- 1.657 objetos × 2 idiomas = 3.314 láminas. Portada, índice A–Z, buscador, sitemap con `hreflang` y 404.
- Íconos PNG propios generados en el build.
- GitHub Actions: despliegue en cada push a `main`, comprobación de cada PR y revisión semanal de versión nueva.

## Fase 1 · Calidad de contenido (siguiente)
1. Traducir los nombres de etiquetas de objetos (hoy sale "cualquier planks") y de estructuras y fuentes de cofres (hoy sale "abandoned mineshaft") en `i18n.mjs`.
2. Plantillas de íconos para comida, plantas, objetos de criaturas y discos (hoy usan el patrón genérico).
3. Descripciones originales de los 150 objetos más buscados en `content/descripciones/{es,en}/<id>.md`.
4. Integrar el explorador de crafteo (mapa de usos navegable) en la lámina.
5. Tradeos de aldeanos: en la 26.x están en `data/minecraft/villager_trade/` y `trade_set/`.
6. Confirmar en el juego los tiempos del alto horno y el ahumador (ver ARQUITECTURA).

## Fase 2 · Herramientas
- Calculadora de materiales (árbol de crafteo completo).
- Generador de construcciones por reglas y estilos (prototipo "Arquitecto de Bloques"), exportando `.schem`/`.litematic`.
- Cada herramienta va como página propia que reutiliza `packages/`.

## Fase 3 · Negocio
- Exportación premium, packs por temporada y plan para servidores.
- Newsletter semanal con el diseño de la semana (Beehiiv o Buttondown).

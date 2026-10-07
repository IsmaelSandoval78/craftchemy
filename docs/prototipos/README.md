# Prototipos

Prototipos hechos en claude.ai, guardados como referencia de diseño. **No se publican** (no están en `dist/`) y no siguen todas las reglas del proyecto: renderizan en el navegador, cargan Google Fonts y están solo parcialmente traducidos.

| Archivo | Qué es | Destino en Craftchemy |
|---|---|---|
| `planos-de-bloques.html` | Lámina técnica: dibujo con cotas y notas, cajetín, recetas 3×3 con glifo de estación, mapa de usos radial, anexos A1–A4 (especificaciones, encantamientos, obtención, comercio). Se retiró el blob de datos 26.1 (`const F`). | Lámina v2, renderizada en el build por `packages/render/render.mjs` (Fase 1). |
| `arquitecto-de-bloques.html` | Generador de casas por reglas: estilos, distribución, extras, paleta, vista 3D (three.js) por capas, lista de materiales y reglas aplicadas. El texto libre se interpreta con palabras clave. | Primera herramienta, como página propia (Fase 2). |

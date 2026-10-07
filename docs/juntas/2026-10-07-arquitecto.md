# Junta 2026-10-07 · Arquitecto de Bloques

**Pregunta:** ¿Vale la pena el generador de casas (la IA solo traduce texto a opciones; un motor de reglas construye), en qué orden frente a la lámina v2, cómo encaja y qué riesgos tiene?
**Asistentes:** SEO, UI, legal, psicología del fan, monetización, ciberseguridad.

## Voto
Unánime (6/6): **lámina v2 primero**; Arquitecto después, como página propia, **v1 sin LLM** (palabras clave en el navegador).

## Por asesor
- **SEO:** existen generadores por prompt (BuilderGPT, AIbuilder, GenesisX, SkibidiAI) pero en todos el LLM genera la estructura; ninguno con "IA traduce + reglas explicadas", ni en español. El 3D no se indexa: proponer 5 páginas estáticas por estilo (`/es/arquitecto/casa-medieval/`) con plano 2D, materiales y reglas. Nada de variantes combinatorias.
- **UI:** el prototipo no tiene la identidad (verde, otras fuentes, three.js de CDN). Vista principal = **plano 2D por capa en SVG**; 3D bajo demanda y autoalojado. Móvil: vista → opciones → reglas. Accesibilidad: resumen en texto por capa. Propone `.schem` en v1.1.
- **Psicología del fan:** el valor es la maestría ("sé por qué se ve bien"). Evitar "IA" en el titular: **"tú construyes, nosotros dibujamos el plano"**. Nombres de estilo claros. "Plano de la semana", sin rachas.
- **Legal:** riesgo **alto** si un LLM recibe texto de menores (reglas de Anthropic para productos con menores: verificación de edad, filtrado, COPPA). v1 en el navegador lo evita. Exportaciones de pago: riesgo medio (revisar reglas de Mojang). Formatos .schem/.litematic: escribir desde la especificación. Autoalojar fuentes y three.js.
- **Monetización:** la herramienta monetiza mejor que la lámina (público adulto). LLM barato (≈USD 2–5 por 10.000 usos según precios consultados); lo caro es abuso y cumplimiento. Afiliados de hosting junto al botón de exportar; sin anuncios dentro de la herramienta.
- **Ciberseguridad:** el prototipo es seguro (todo en cliente, `textContent`). Con LLM: salida JSON con esquema cerrado, nunca mostrar texto del modelo, Turnstile + límite por IP + tope de gasto, clave con `wrangler secret`, sin logs. **Pendiente ya:** CSP y HSTS en `_headers`.

## Desacuerdos
- `.schem` pronto (UI) vs. después de medir uso (SEO, fan).
- Vista principal 2D (UI, SEO) vs. 3D (prototipo).

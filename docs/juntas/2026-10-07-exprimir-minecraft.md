# Junta 2026-10-07 · ¿Hub de Minecraft + otros juegos? ¿Qué más exprimir de Minecraft?

**Asistentes:** SEO, psicología del fan, UI, legal, monetización.
**Base:** inventario de `.cache/26.3/data/minecraft`. Hoy solo se usan recetas, botín y etiquetas. Sin usar: logros (~120 reales de 1.866 archivos), 43 encantamientos, 391 tradeos + 68 sets, worldgen (~65 biomas, `placed_feature` con minerales por altura, `structure_set` con espaciado), 1.511 estructuras `.nbt`, adornos de armadura (11 × 18), 51 cuadros, 22 discos, 43 estandartes, 23 vasijas, variantes de criaturas, cámaras de desafío.

## Hub
Unánime: **"hub" dentro de Minecraft** (biomas ↔ objetos ↔ tradeos ↔ encantamientos), y **Craftchemy como sello compartido** ("un plano de Craftchemy") entre sitios. Se mantiene **un dominio por juego**.
- **Legal:** "Minecraft" no puede ser el término principal ni dominante del título. "Craftchemy: fichas de objetos de Minecraft" sí; "El Hub de Minecraft" como lema principal, no. Nunca usar la marca para etiquetar otros juegos.
- **UI:** la tinta cianotipo es la marca y no cambia por juego. Por juego cambian solo `--acento` y `--sello`, y un código de plano en el cajetín (`MC-OBJ-0412`, `MC-GEO-01`…).

## Ranking combinado (votos de SEO / UI / fan / monetización)
1. **Minerales por altura** (`placed_feature`), elegido por los cuatro.
   - Corte geológico acotado de Y -64 a 320, rotulado "intentos de generación". Unas 12 páginas más un índice.
   - Hueco verificado: las guías en español se contradicen (Y 59 vs -59).
   - Hay que verificar la curva en el juego.
2. **Encantamientos** (43). Fichas, matriz de incompatibilidades, costo por nivel y calculadora de yunque como página propia.
   - Monetización la pone en #1: tiempo en sitio, visitas repetidas, público adulto.
   - La mesa de encantar no está en los datos: **no inventar probabilidades**.
3. **Tradeos 26.x por profesión** (13 profesiones + comerciante errante): escalera de novato a maestro.
   - Sistema nuevo sin guías en español (verificado). Es el pendiente 5.
4. **"Qué cambió en 26.x"**, generado como diferencia entre versiones con RSS (decidido en la junta del newsletter).
5. **Biomas** (~65) con criaturas, clima y minerales; "carta de biomas" de temperatura contra lluvia. Es la columna del enlazado interno.

**Después:**
- **"Mi colección"** (fan #1: es lo que crea regreso; localStorage sin cuenta): logros, discos, cuadros, variantes.
- **Estructuras como planos** (UI #2): esquemáticos y con revisión legal.
- **"Kit del dueño de servidor"** con comparativa honesta de hosting (monetización #5: el mayor ingreso por visita).
- Árbol de logros y espaciado de estructuras.

Cuadros, discos, cuernos y vasijas: **índices de una sola página**, no una página por cada uno.

## Volumen
SEO: **150 a 200 páginas nuevas por idioma**, todas con 80 a 150 palabras originales en ambos idiomas. Nada de combinaciones, ni las ~1.700 recetas de desbloqueo. Medir por familia en Search Console antes de abrir la siguiente.

## Semáforo legal
- **Verde:** recetas, botín, encantamientos, tradeos, biomas, minerales, espaciado de estructuras, cámaras de desafío, daño, variantes (nombre y bioma), cuernos. También nombres de logros, cuadros y discos con su autor, como crédito.
- **Amarillo:**
  - Descripción corta de logros, una por lámina; nunca el archivo de idioma completo ni textos largos (End Poem, splashes).
  - Estructuras: sí tamaño, conteo de bloques, cofres y botín. Un plano fiel bloque por bloque es reproducir la obra, así que solo esquemático y de menor detalle, con abogado antes.
  - Generación por semilla reimplementada desde el JSON (portar código descompilado es rojo).
  - Redibujar diseños de estandartes, adornos y vasijas copia arte de Mojang.
- **Rojo:** arte y audio de cuadros y discos (Kristoffer Zetterstrand, C418, Lena Raine), incluidas recreaciones pixeladas. Archivos `.nbt` o `.schem` descargables. Exportaciones de pago.
- **Aviso:** alinear `aviso_legal` en `i18n.mjs` con la fórmula oficial "NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT". Las reglas oficiales dieron 503; se verificaron vía ConductAtlas (captura del 2026-09-11; el 2026-09-02 cambió el nombre del documento sin cambios de fondo).

## B2B (monetización)
- **Sí:** patrocinio de una herramienta por un host ("patrocinado por X", fuera del contenido del juego y apto para menores).
- **Sí:** widget embebible gratuito para webs de servidores, que trae enlaces entrantes.
- **No:** lista de servidores con puestos pagados (terceros, moderación, pay-to-win, menores).

## Desacuerdos
- **Qué va primero tras la v2:** minerales (SEO, UI) vs. encantamientos (monetización) vs. "Mi colección" (fan).
- **Combinador de adornos de armadura:** fan lo quiere para niños; legal advierte que redibujar los diseños copia arte. Solo sería viable con íconos abstractos propios.
- **Estructuras como planos:** UI las ve como identidad de marca; legal pide versión esquemática y abogado.

## Reglas por actualizar
- **Regla de JS en `CLAUDE.md`:** colección, calculadora de yunque y Arquitecto son páginas propias con JS. Ya lo permite el texto ("nuevas herramientas interactivas van como páginas propias"), pero conviene explicitarlo.

# Junta 2026-10-07 · ¿Newsletter ahora?

**Asistentes:** psicología del fan, monetización, legal, ciberseguridad. Datos verificados en la web el 2026-10-07 (varios con fuentes secundarias).

## Voto
Unánime: **no a un boletín semanal ahora.** Sí, más adelante, a un **aviso por versión** generado por el pipeline ("Hoja de cambios" / "Change Sheet"). Primero, una página "qué cambió" con **RSS** (sin datos personales).

## Por asesor
- **Psicología del fan:** los niños no leen email; el adulto constructor sí, si le ahorra tiempo. Sin tráfico ni material, un semanal muere a la tercera entrega. Primero `/es/cambios/` + `/en/changes/` + `feed.xml` desde la comparación entre versiones; después correo el día de cada versión con mini-láminas antes/después. Invitación de una línea, sin ventanas emergentes. Discord no: moderación imposible para una persona con menores.
- **Monetización:** hoy no es ingreso, pero **la lista es el único activo que viaja entre dominios del portafolio**. Patrocinio de referencia (aficiones): USD 15–40 por mil aperturas; con 1.000 suscriptores ≈ USD 6–16 por envío; con 5.000 ≈ 100–225. Umbral para buscar patrocinios: ~3.000–5.000 adultos activos (criterio propio). Planes gratis: Beehiiv 2.500 (red de anuncios desde Lite, USD 49/mes anual), Kit 10.000 (fuente secundaria), Buttondown 100, MailerLite 250 desde jul-2026 (secundaria). Activar al llegar a ≥1.000 sesiones/mes; no pagar plan antes de ~5.000.
- **Legal:** se puede hacer bien, pero **bloquea el lanzamiento que no haya política de privacidad**. COPPA reformada en pleno vigor desde el 22-abr-2026; ECA Digital de Brasil (Lei 15.211/2025) desde el 17-mar-2026. Recomienda **corte único de 16+** con pregunta de edad neutral (si es menor, no se guarda nada); doble opt-in sin casillas premarcadas; **Buttondown, no Beehiiv** (los términos de Beehiiv del 6-oct-2026 dicen que no es para menores de 18; Buttondown publica DPA y no usa datos para publicidad); rastreo de aperturas y clics apagado; pie con dirección postal (apartado o buzón virtual) y baja en un clic; patrocinios etiquetados y nunca de productos para adultos. Consulta de una hora con abogado de privacidad antes de abrir el formulario.
- **Ciberseguridad:** formulario HTML puro con POST al proveedor (sin JS de terceros ni Worker propio); doble opt-in + campo trampa; envío desde **subdominio** `news.craftchemy.com` con SPF/DKIM; DMARC en la raíz (`p=none` 2–4 semanas, luego `quarantine`); 2FA en el proveedor; guardar solo correo, idioma y prueba del opt-in; CSP con `form-action`. Hoy `_headers` no tiene CSP.

## Desacuerdos
- **Edad mínima:** 16+ (legal) vs. 13+ (fan, monetización).
- **Proveedor:** Kit o Beehiiv (monetización) vs. Buttondown (legal). Buttondown gratis solo hasta 100 suscriptores; Kit no fue evaluado por legal.

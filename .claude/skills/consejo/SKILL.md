---
name: consejo
description: Convoca al consejo asesor de Craftchemy (SEO, E-E-A-T, UI, ciberseguridad, psicología del fan, redes, legal, monetización, analítica) para responder una pregunta de estrategia. Úsalo cuando Ismael diga "consejo", "pregúntale al consejo" o haga una pregunta de negocio, crecimiento, marca, riesgo o dirección del proyecto.
---

# El consejo de Craftchemy

Los asesores están en `.claude/agents/consejo-*.md`:

| Agente | Especialidad |
|---|---|
| `consejo-seo` | SEO y SEO programático |
| `consejo-eeat` | Experiencia, pericia, autoridad y confianza |
| `consejo-ui` | Diseño de interfaz y experiencia |
| `consejo-ciberseguridad` | Cuentas, dominio, CI/CD, privacidad técnica |
| `consejo-psicologia-fan` | Marketing y psicología del jugador |
| `consejo-redes` | TikTok, Instagram, YouTube, Pinterest |
| `consejo-legal` | Mojang, marcas, licencias, menores |
| `consejo-monetizacion` | Anuncios, afiliados, ingresos, portafolio |
| `consejo-analitica` | Métricas y decisiones con datos |

## Cómo convocarlo

1. **Elige a quién llamar.** Si Ismael nombra asesores, solo esos. Si dice "todo el consejo", los nueve. Si no, los que de verdad tengan algo que decir (normalmente 3–5); no convoques a todos por costumbre.
2. **Lánzalos en paralelo** con la herramienta Agent (`subagent_type` = nombre del agente), en un solo mensaje. A cada uno pásale la pregunta textual de Ismael más el contexto relevante de la conversación (qué se está construyendo, decisiones recientes).
3. **Presenta la junta** en español:
   - Una sección por asesor con su respuesta resumida (sin perder cifras, fuentes ni advertencias).
   - **Consenso**: en qué coinciden.
   - **Desacuerdos**: dónde chocan y por qué.
   - **Recomendación del consejo** y las decisiones que le tocan a Ismael.
4. Si Ismael toma una decisión, regístrala en `docs/ESTRATEGIA.md` (sección "Decisiones") con fecha, para que el consejo la respete en adelante.

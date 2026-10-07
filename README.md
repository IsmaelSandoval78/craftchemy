# Craftchemy · Planos

Sitio estático bilingüe (español/inglés) en **[craftchemy.com](https://craftchemy.com)**, con una lámina técnica por cada bloque y objeto del juego, generada desde los datos oficiales.

## Uso

Requiere Node 20+, Python 3.10+, `curl` y `unzip`.

```bash
npm run build                 # genera dist/ desde data/ (no necesita descargar nada)
npm run preview               # sirve dist/ en http://localhost:4321

npm run fetch                 # descarga las fuentes de la versión en config/site.json a .cache/
npm run data                  # regenera data/ desde .cache/
python3 pipeline/validate.py  # pruebas de cordura
```

Para cambiar de versión, edita `version_minecraft` en `config/site.json` y corre `npm run fetch && npm run data && python3 pipeline/validate.py`. GitHub Actions lo hace cada lunes y abre un PR.

## Puesta en línea (Cloudflare Workers conectado a GitHub)

Cloudflare construye y publica el sitio solo, en cada push. No hacen falta secretos en GitHub.

1. En Cloudflare: **Workers & Pages → Create → Import a repository**, elige `craftchemy`. El nombre del Worker debe ser `craftchemy`, igual que `name` en `wrangler.jsonc`.
2. En el Worker → **Settings → Build**:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy` (es el valor por defecto)
   - **Production branch:** `main`
3. **Dominio:** en el Worker → **Settings → Domains & Routes → Add → Custom domain**, agrega `craftchemy.com` y `www.craftchemy.com`. Si el dominio está en otro registrador, primero apunta sus nameservers a Cloudflare.
4. **Workflow semanal:** en GitHub → Settings → Actions → General, activa "Allow GitHub Actions to create and approve pull requests".

Las ramas que no son `main` generan una versión de vista previa (`wrangler versions upload`) sin tocar producción.

Ver `docs/` para la arquitectura, la hoja de ruta, el nombre y las reglas legales.

---
Craftchemy no es un producto oficial de Minecraft. No está aprobado por Mojang ni Microsoft, ni asociado con ellos.

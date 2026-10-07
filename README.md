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

## Puesta en línea (una sola vez)

1. **Cloudflare Pages:** crea un proyecto llamado exactamente `craftchemy` (Workers & Pages → Create → Pages → Direct Upload).
2. **Token de API:** en My Profile → API Tokens, crea un token con el permiso *Cloudflare Pages: Edit*. Copia también tu *Account ID*, que aparece en la página de inicio de Workers & Pages.
3. **Secretos en GitHub:** en Settings → Secrets and variables → Actions, agrega `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.
4. **Dominio:** en el proyecto de Pages → Custom domains, agrega `craftchemy.com` y `www.craftchemy.com`. Si el dominio está en otro registrador, apunta sus nameservers a Cloudflare.
5. **Permisos del workflow semanal:** en Settings → Actions → General, activa "Allow GitHub Actions to create and approve pull requests".

Desde ahí, cada push a `main` despliega solo.

Ver `docs/` para la arquitectura, la hoja de ruta, el nombre y las reglas legales.

---
Craftchemy no es un producto oficial de Minecraft. No está aprobado por Mojang ni Microsoft, ni asociado con ellos.

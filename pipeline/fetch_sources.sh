#!/usr/bin/env bash
# Descarga las fuentes de la versión indicada en config/site.json a .cache/<versión>/
#   - client.jar de Mojang → data/ (recetas, botín, etiquetas) y lang/en_us.json
#   - es_es.json desde el índice de assets de Mojang
#   - resúmenes de misode/mcmeta (registros, componentes de objetos, bloques)
#   - PrismarineJS minecraft-data (dureza y resistencia de bloques)
# Uso: bash pipeline/fetch_sources.sh [versión]
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${1:-$(python3 -c "import json;print(json.load(open('config/site.json'))['version_minecraft'])")}"
DEST=".cache/$VERSION"
MANIFEST="https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
MCMETA="https://raw.githubusercontent.com/misode/mcmeta"
PRISMARINE="https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data"

mkdir -p "$DEST"
echo "→ Versión $VERSION en $DEST"

dl() { curl -fsSL --retry 4 --retry-delay 2 -o "$2" "$1"; }

# 1. Metadatos de la versión
URL_VERSION=$(curl -fsSL --retry 4 "$MANIFEST" | python3 -c "
import json,sys
d=json.load(sys.stdin)
v=[x for x in d['versions'] if x['id']=='$VERSION']
if not v: sys.exit('Versión $VERSION no existe en el manifiesto de Mojang')
print(v[0]['url'])")
dl "$URL_VERSION" "$DEST/version.json"

# 2. client.jar → solo data/minecraft y lang/en_us
if [ ! -d "$DEST/data/minecraft/recipe" ]; then
  URL_JAR=$(python3 -c "import json;print(json.load(open('$DEST/version.json'))['downloads']['client']['url'])")
  echo "→ client.jar"
  dl "$URL_JAR" "$DEST/client.jar"
  unzip -qo "$DEST/client.jar" 'data/minecraft/*' 'assets/minecraft/lang/en_us.json' -d "$DEST"
  rm -f "$DEST/client.jar"
fi
mkdir -p "$DEST/lang"
cp "$DEST/assets/minecraft/lang/en_us.json" "$DEST/lang/en_us.json"

# 3. es_es desde el índice de assets
URL_INDICE=$(python3 -c "import json;print(json.load(open('$DEST/version.json'))['assetIndex']['url'])")
HASH=$(curl -fsSL --retry 4 "$URL_INDICE" | python3 -c "import json,sys;print(json.load(sys.stdin)['objects']['minecraft/lang/es_es.json']['hash'])")
dl "https://resources.download.minecraft.net/${HASH:0:2}/$HASH" "$DEST/lang/es_es.json"

# 4. Resúmenes de mcmeta
mkdir -p "$DEST/summary"
for f in registries item_components blocks; do
  dl "$MCMETA/$VERSION-summary/$f/data.json" "$DEST/summary/$f.json"
done

# 5. PrismarineJS: la versión más reciente disponible ≤ la pedida (va por detrás de Mojang)
mkdir -p "$DEST/prismarine"
dl "$PRISMARINE/dataPaths.json" "$DEST/prismarine/dataPaths.json"
RUTA_BLOQUES=$(python3 - "$VERSION" "$DEST/prismarine/dataPaths.json" <<'PY'
import json,sys
pedida, ruta = sys.argv[1], sys.argv[2]
pc = json.load(open(ruta))['pc']
def clave(v):
    try: return tuple(int(p) for p in v.split('.'))
    except ValueError: return None
validas = [v for v in pc if clave(v) and 'blocks' in pc[v] and clave(v) <= clave(pedida)]
v = max(validas, key=clave)
print(v + ' ' + pc[v]['blocks'])
PY
)
PRIS_VER=${RUTA_BLOQUES%% *}; PRIS_RUTA=${RUTA_BLOQUES#* }
dl "$PRISMARINE/$PRIS_RUTA/blocks.json" "$DEST/prismarine/blocks.json"
echo "$PRIS_VER" > "$DEST/prismarine/VERSION"
echo "→ PrismarineJS bloques de $PRIS_VER"
echo "✓ Fuentes listas en $DEST"

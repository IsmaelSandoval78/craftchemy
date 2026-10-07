#!/usr/bin/env python3
"""Compara la última versión estable de Mojang con config/site.json.

  python3 pipeline/latest_version.py           imprime la última versión estable
  python3 pipeline/latest_version.py --apply   si es más nueva (y mcmeta ya la tiene),
                                               actualiza config/site.json e imprime
                                               "nueva=<versión>" para GitHub Actions
"""
import json
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CONFIG = RAIZ / "config/site.json"
MANIFEST = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
MCMETA = "https://raw.githubusercontent.com/misode/mcmeta/{v}-summary/registries/data.json"


def obtener(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return r.read()


def disponible_en_mcmeta(v):
    try:
        obtener(MCMETA.format(v=v))
        return True
    except Exception:
        return False


def main():
    ultima = json.loads(obtener(MANIFEST))["latest"]["release"]
    config = json.loads(CONFIG.read_text())
    actual = config["version_minecraft"]
    if "--apply" not in sys.argv:
        print(ultima)
        return
    if ultima == actual:
        print(f"Sin cambios: {actual} es la última estable", file=sys.stderr)
        return
    if not disponible_en_mcmeta(ultima):
        print(f"{ultima} aún no está en mcmeta; se reintenta la próxima semana", file=sys.stderr)
        return
    config["version_minecraft"] = ultima
    CONFIG.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
    print(f"nueva={ultima}")


if __name__ == "__main__":
    main()

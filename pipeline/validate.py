#!/usr/bin/env python3
"""Pruebas de cordura sobre data/. Falla (exit 1) si algo no cuadra.

Cada vez que un caso se rompa en una actualización, agrega aquí una comprobación
con el hecho conocido del juego para que no vuelva a pasar en silencio.
"""
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
fichas = json.loads((RAIZ / "data/fichas.json").read_text(encoding="utf-8"))
indice = json.loads((RAIZ / "data/index.json").read_text(encoding="utf-8"))
meta = json.loads((RAIZ / "data/meta.json").read_text(encoding="utf-8"))
config = json.loads((RAIZ / "config/site.json").read_text(encoding="utf-8"))

errores = []


def check(cond, msg):
    if not cond:
        errores.append(msg)


def f(id_):
    check(id_ in fichas, f"falta el objeto {id_}")
    return fichas.get(id_, {})


def botin(id_, tabla):
    return next((b for b in f(id_).get("botin", []) if b["tabla"] == tabla), None)


def receta(id_, tipo=None):
    return [r for r in f(id_).get("recetas", []) if tipo is None or r["tipo"] == tipo]


# ---------------------------------------------------------------- estructura
check(meta["version_minecraft"] == config["version_minecraft"],
      f"meta.json es {meta['version_minecraft']} pero config pide {config['version_minecraft']}")
check(len(fichas) > 1500, f"muy pocos objetos: {len(fichas)}")
check(len(indice) == len(fichas), "index.json y fichas.json no coinciden")
check(meta["recetas"] > 1500, f"muy pocas recetas: {meta['recetas']}")

nombres = {"es": {}, "en": {}}
for id_, x in fichas.items():
    for i in ("es", "en"):
        n = x["nombre"].get(i)
        check(n and n != id_ and "minecraft:" not in n and "item.minecraft" not in n,
              f"{id_}: nombre {i} sin traducir ({n!r})")
        check(n not in nombres[i], f"nombre {i} repetido: {n!r} ({id_} y {nombres[i].get(n)})")
        nombres[i][n] = id_
    for r in x["recetas"]:
        ings = r["ingredientes"] + list((r["claves"] or {}).values())
        check(ings, f"{id_}: receta {r['id']} sin ingredientes")
        for ing in ings:
            for it in ([ing["item"]] if "item" in ing else ing["items"]):
                check(it in fichas, f"{id_}: receta {r['id']} usa objeto desconocido {it}")
            check("item" in ing or ing["items"], f"{id_}: receta {r['id']} con etiqueta vacía {ing.get('etiqueta')}")
    for b in x["botin"]:
        check(0 < b["probabilidad"] <= 1, f"{id_}: probabilidad fuera de rango en {b['tabla']}")
        check(b["min"] <= b["max"], f"{id_}: min > max en {b['tabla']}")

# ---------------------------------------------------------------- hechos conocidos del juego
# Botín (formato 26.2+: modifier/type/predicados por referencia)
b = botin("lapis_lazuli", "blocks/lapis_ore")
check(b and (b["min"], b["max"]) == (4, 9), f"lapislázuli de mena debe soltar 4–9, salió {b}")
check(b and b["probabilidad"] == 1 and "sin_toque_de_seda" in b["condiciones"] and "fortuna" in b["bonus"],
      f"lapislázuli: condiciones o bonus mal ({b})")
b = botin("lapis_ore", "blocks/lapis_ore")
check(b and "toque_de_seda" in b["condiciones"], "la mena de lapislázuli con toque de seda se suelta a sí misma")
b = botin("diamond", "blocks/diamond_ore")
check(b and (b["min"], b["max"]) == (1, 1) and b["probabilidad"] == 1, f"diamante de mena: {b}")
b = botin("rotten_flesh", "entities/zombie")
check(b and (b["min"], b["max"]) == (0, 2) and "looting" in b["bonus"], f"zombi → carne podrida 0–2: {b}")
b = botin("cobblestone", "blocks/stone")
check(b and "sin_toque_de_seda" in b["condiciones"], f"piedra → roca sin toque de seda: {b}")
b = botin("string", "blocks/cobweb")
check(b and "sin_tijeras_ni_toque_de_seda" in b["condiciones"], f"telaraña → hilo: {b}")
b = botin("redstone", "blocks/redstone_ore")
check(b and (b["min"], b["max"]) == (4, 5), f"redstone de mena debe soltar 4–5: {b}")

# Recetas
r = receta("oak_planks")
check(r and r[0]["cantidad"] == 4 and r[0]["ingredientes"][0].get("etiqueta") == "oak_logs",
      "tablones de roble: 1 tronco de roble → 4")
r = receta("bread", "mesa")
check(r and r[0]["patron"] == ["###"], "pan: 3 de trigo en fila")
r = receta("iron_ingot", "horno")
check(any(x["tiempo"] == 200 and x["experiencia"] == 0.7 for x in r), "lingote de hierro en horno: 200 ticks, 0.7 xp")
# Ojo: en 26.3 las recetas de alto horno traen cookingtime 200 (antes 100); se publica el dato tal cual.
check(receta("iron_ingot", "alto_horno"), "lingote de hierro también en alto horno")
check(receta("netherite_sword", "herreria"), "espada de netherita se hace en la mesa de herrería")
check(receta("stone_bricks", "cortapiedras"), "ladrillos de piedra en cortapiedras")
check(any(u["resultado"] == "stone_pickaxe" for u in f("cobblestone").get("usos", [])),
      "la roca se usa para el pico de piedra (vía etiqueta)")

# Propiedades
x = f("diamond_sword")
check(x.get("durabilidad") == 1561 and x.get("combate") == {"danio": 7.0, "velocidad": 1.6},
      f"espada de diamante: 1561 de durabilidad, 7 de daño, 1.6 de velocidad ({x.get('combate')})")
x = f("diamond_chestplate")
check((x.get("armadura") or {}).get("puntos") == 8, "peto de diamante: 8 de armadura")
x = f("bread")
check(x.get("comida") == {"nutricion": 5, "saturacion": 6.0}, f"pan: 5 de hambre ({x.get('comida')})")
x = f("ender_pearl")
check(x.get("pila") == 16, "perla de ender se apila de a 16")
x = f("stone")
check((x.get("bloque") or {}).get("dureza") == 1.5 and x["bloque"]["herramienta"] == ["pickaxe"], "piedra: dureza 1.5, pico")
x = f("diamond_ore")
check((x.get("bloque") or {}).get("nivel") == "iron", "la mena de diamante necesita pico de hierro")
check(f("music_disc_cat")["nombre"]["en"] == "Music Disc (C418 - cat)", "los discos llevan el nombre de su canción")

if errores:
    print(f"✗ {len(errores)} problema(s):")
    for e in errores[:60]:
        print("  -", e)
    sys.exit(1)
print(f"✓ Validación OK: {len(fichas)} objetos, {meta['recetas']} recetas, versión {meta['version_minecraft']}")

#!/usr/bin/env python3
"""Genera data/fichas.json, data/index.json y data/meta.json desde .cache/<versión>/.

Fuentes (descargadas por fetch_sources.sh):
  data/minecraft/recipe, loot_table, tags, predicate   (client.jar de Mojang)
  lang/es_es.json, lang/en_us.json                     (Mojang)
  summary/registries.json, item_components.json        (misode/mcmeta)
  prismarine/blocks.json                               (PrismarineJS: dureza y resistencia)

También escribe data/nombres.json con los nombres de criaturas en ambos idiomas.

Esquema de una ficha (data/fichas.json → {"<id>": ficha}):
  id            "cobblestone" (sin el prefijo minecraft:)
  nombre        {"es": "...", "en": "..."}
  tipo          "bloque" | "objeto"
  categoria     clave de categoría (ver CATEGORIAS; los textos están en i18n.mjs)
  pila          tamaño máximo de pila
  rareza        "common" | "uncommon" | "rare" | "epic"
  durabilidad   usos antes de romperse (o null)
  comida        {"nutricion": n, "saturacion": n} o null
  combate       {"danio": n, "velocidad": n} o null (valores mostrados en el juego)
  armadura      {"puntos": n, "dureza": n, "ranura": "head|chest|legs|feet|body"} o null
  bloque        null o {"dureza", "resistencia", "luz", "herramienta": [..],
                         "nivel": "stone|iron|diamond|null", "fuente_dureza": "26.1"}
  recetas       recetas que PRODUCEN el objeto:
                  {"id", "tipo", "patron": ["AB ", ...] | null,
                   "claves": {"A": ingrediente}, "ingredientes": [ingrediente],
                   "cantidad", "tiempo", "experiencia"}
                ingrediente = {"item": "<id>"} | {"etiqueta": "<tag>", "items": [ids]}
  usos          recetas donde el objeto es ingrediente: [{"receta", "resultado", "tipo"}]
  botin         fuentes de botín: [{"tabla", "fuente", "min", "max", "probabilidad",
                                   "condiciones": [...], "bonus": [...]}]
                  fuente: bloque | criatura | cofre | arqueologia | pesca | juego | otro
                  probabilidad: 0–1 aproximada por tirada (null si no se puede calcular)
  etiquetas     etiquetas de objeto a las que pertenece
  extra         datos escritos a mano desde content/extra.json (o ausente)

Formato de botín: desde la 26.2 los modificadores van en "modifier" (antes "functions"),
el tipo de cada modificador/condición en "type" (antes "function"/"condition") y una
condición puede ser una cadena que apunta a data/minecraft/predicate/<ruta>.json.
Este script acepta ambos formatos.
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CONFIG = json.loads((RAIZ / "config/site.json").read_text())
VERSION = sys.argv[1] if len(sys.argv) > 1 else CONFIG["version_minecraft"]
CACHE = RAIZ / ".cache" / VERSION
DATOS = CACHE / "data/minecraft"
SALIDA = RAIZ / "data"


def sin_ns(s):
    return s.split(":", 1)[1] if s.startswith("minecraft:") else s


def leer(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


# ---------------------------------------------------------------- etiquetas

def cargar_etiquetas(carpeta):
    crudas = {}
    base = DATOS / "tags" / carpeta
    for f in base.rglob("*.json"):
        nombre = f.relative_to(base).with_suffix("").as_posix()
        crudas[nombre] = [v if isinstance(v, str) else v["id"] for v in leer(f)["values"]]
    resueltas = {}

    def resolver(nombre, pila=()):
        if nombre in resueltas:
            return resueltas[nombre]
        if nombre in pila or nombre not in crudas:
            return []
        out = []
        for v in crudas[nombre]:
            if v.startswith("#"):
                out += resolver(sin_ns(v[1:]), pila + (nombre,))
            else:
                out.append(sin_ns(v))
        resueltas[nombre] = list(dict.fromkeys(out))
        return resueltas[nombre]

    for n in crudas:
        resolver(n)
    return resueltas


# ---------------------------------------------------------------- recetas

TIPOS_RECETA = {
    "crafting_shaped": "mesa", "crafting_shapeless": "mesa_sin_forma",
    "crafting_transmute": "mesa_sin_forma", "crafting_dye": "mesa_sin_forma",
    "crafting_imbue": "mesa", "smelting": "horno", "blasting": "alto_horno",
    "smoking": "ahumador", "campfire_cooking": "fogata", "stonecutting": "cortapiedras",
    "smithing_transform": "herreria", "smithing_trim": "herreria",
}


def ingrediente(valor, etiquetas_item):
    """Normaliza un ingrediente (cadena, lista o dict de formatos viejos)."""
    if isinstance(valor, list):
        items = []
        for v in valor:
            ing = ingrediente(v, etiquetas_item)
            items += ing.get("items", [ing.get("item")])
        return {"items": [i for i in dict.fromkeys(items) if i]}
    if isinstance(valor, dict):
        if "tag" in valor:
            valor = "#" + valor["tag"]
        elif "item" in valor:
            valor = valor["item"]
        elif "id" in valor:
            valor = valor["id"]
    if valor.startswith("#"):
        tag = sin_ns(valor[1:])
        return {"etiqueta": tag, "items": etiquetas_item.get(tag, [])}
    return {"item": sin_ns(valor)}


def normalizar_receta(rid, r, etiquetas_item):
    tipo = sin_ns(r["type"])
    if tipo not in TIPOS_RECETA or "result" not in r:
        return None
    res = r["result"]
    res_id = res if isinstance(res, str) else res.get("id") or res.get("item")
    if not res_id and tipo == "crafting_transmute" and isinstance(r.get("input"), str) \
            and not r["input"].startswith("#"):
        res_id = r["input"]  # resultado vacío: el objeto se copia a sí mismo (p. ej. clonar mapas)
    if not res_id:
        return None
    res_id = sin_ns(res_id)
    cantidad = 1 if isinstance(res, str) else res.get("count", 1)
    rec = {"id": rid, "tipo": TIPOS_RECETA[tipo], "resultado": res_id, "cantidad": cantidad,
           "patron": None, "claves": None, "ingredientes": []}
    I = lambda v: ingrediente(v, etiquetas_item)
    if tipo == "crafting_shaped":
        rec["patron"] = r["pattern"]
        rec["claves"] = {k: I(v) for k, v in r["key"].items()}
    elif tipo == "crafting_shapeless":
        rec["ingredientes"] = [I(v) for v in r["ingredients"]]
    elif tipo == "crafting_transmute":
        rec["ingredientes"] = [I(r["input"]), I(r["material"])]
    elif tipo == "crafting_dye":
        rec["ingredientes"] = [I(r["target"]), I(r["dye"])]
    elif tipo == "crafting_imbue":
        rec["patron"] = ["MMM", "MSM", "MMM"]
        rec["claves"] = {"M": I(r["material"]), "S": I(r["source"])}
    elif tipo in ("smelting", "blasting", "smoking", "campfire_cooking"):
        rec["ingredientes"] = [I(r["ingredient"])]
        rec["tiempo"] = r.get("cookingtime", {"smelting": 200, "campfire_cooking": 600}.get(tipo, 100))
        rec["experiencia"] = r.get("experience", 0)
    elif tipo == "stonecutting":
        rec["ingredientes"] = [I(r["ingredient"])]
    elif tipo.startswith("smithing"):
        rec["ingredientes"] = [I(r[k]) for k in ("template", "base", "addition") if k in r]
    return rec


def items_de_receta(rec):
    ings = list(rec["ingredientes"]) + list((rec["claves"] or {}).values())
    out = []
    for ing in ings:
        out += [ing["item"]] if "item" in ing else ing["items"]
    return list(dict.fromkeys(out))


# ---------------------------------------------------------------- botín

def campo(d, nuevo, viejo):
    return d.get(nuevo, d.get(viejo))


def lista(v):
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


def resolver_condicion(c):
    """Devuelve una condición como dict, cargando referencias a predicate/."""
    if isinstance(c, str):
        ruta = DATOS / "predicate" / (sin_ns(c) + ".json")
        return leer(ruta) if ruta.exists() else {"type": c}
    return c


def interpretar_condiciones(conds, nota):
    """Recorre condiciones y anota probabilidad y requisitos legibles en `nota`."""
    for c in lista(conds):
        if isinstance(c, list):
            interpretar_condiciones(c, nota)
            continue
        c = resolver_condicion(c)
        t = sin_ns(campo(c, "type", "condition") or "")
        if t in ("all_of",):
            interpretar_condiciones(c.get("terms"), nota)
        elif t == "random_chance":
            ch = c.get("chance")
            if isinstance(ch, (int, float)):
                nota["prob"] *= ch
        elif t == "random_chance_with_enchanted_bonus":
            base = c.get("unenchanted_chance")
            if base is None:
                ec = c.get("enchanted_chance", {})
                base = ec.get("base") if isinstance(ec, dict) else ec
            if isinstance(base, (int, float)):
                nota["prob"] *= base
            nota["bonus"].add("looting")
        elif t == "killed_by_player":
            nota["cond"].add("jugador")
        elif t == "match_tool":
            p = json.dumps(c)
            if "silk_touch" in p:
                nota["cond"].add("toque_de_seda")
            elif "shears" in p:
                nota["cond"].add("tijeras")
            else:
                nota["cond"].add("herramienta")
        elif t == "inverted":
            sub = resolver_condicion(c.get("term"))
            if "silk_touch" in json.dumps(sub):
                nota["cond"].add("sin_toque_de_seda")
            elif "shears" in json.dumps(sub):
                nota["cond"].add("sin_tijeras")
        elif t == "table_bonus":
            nota["bonus"].add("fortuna")
            ch = c.get("chances") or [None]
            if isinstance(ch[0], (int, float)):
                nota["prob"] *= ch[0]
        elif t == "entity_properties" and "on_fire" in json.dumps(c):
            nota["cond"].add("en_llamas")
        elif t == "damage_source_properties":
            nota["cond"].add("tipo_de_danio")
        elif t == "block_state_property":
            nota["cond"].add("estado_del_bloque")
        elif t == "any_of":
            texto = json.dumps([resolver_condicion(x) for x in c.get("terms", [])])
            if "silk_touch" in texto and "shears" in texto:
                nota["cond"].add("tijeras_o_toque_de_seda")
            else:
                nota["cond"].add("alternativas")


def rango(n):
    """Rango (min, max) de un proveedor de números."""
    if isinstance(n, (int, float)):
        return n, n
    if not isinstance(n, dict):
        return None
    t = sin_ns(n.get("type", "uniform" if "min" in n else ""))
    if t == "uniform":
        a, b = rango(n.get("min", 0)), rango(n.get("max", 0))
        return (a[0], b[1]) if a and b else None
    if t == "constant":
        return n["value"], n["value"]
    if t == "binomial":
        r = rango(n.get("n"))
        return (0, r[1]) if r else None
    return None


OPUESTA = {"toque_de_seda": "sin_toque_de_seda", "tijeras": "sin_tijeras",
           "tijeras_o_toque_de_seda": "sin_tijeras_ni_toque_de_seda"}


def nota_vacia():
    return {"prob": 1.0, "cond": set(), "bonus": set(), "min": 1, "max": 1}


def copiar(n):
    return {"prob": n["prob"], "cond": set(n["cond"]), "bonus": set(n["bonus"]),
            "min": n["min"], "max": n["max"]}


def aplicar_modificadores(mods, nota):
    for m in lista(mods):
        t = sin_ns(campo(m, "type", "function") or "")
        if t == "set_count":
            r = rango(m.get("count"))
            if r:
                if m.get("add"):
                    nota["min"] += r[0]
                    nota["max"] += r[1]
                else:
                    nota["min"], nota["max"] = r
        elif t == "apply_bonus":
            nota["bonus"].add(sin_ns(m.get("enchantment", "")) == "fortune" and "fortuna" or "encantamiento")
        elif t in ("enchanted_count_increase", "looting_enchant"):
            nota["bonus"].add("looting")
        elif t == "furnace_smelt":
            nota["cond"].add("en_llamas")
        elif t == "limit_count":
            lim = m.get("limit", {})
            if isinstance(lim, dict):
                if isinstance(lim.get("max"), (int, float)):
                    nota["max"] = min(nota["max"], lim["max"])
                if isinstance(lim.get("min"), (int, float)):
                    nota["min"] = max(nota["min"], lim["min"])
        interpretar_condiciones(campo(m, "condition", "conditions"), nota)


def recorrer_entradas(entradas, nota, etiquetas_item, salida, pila):
    """Expande entradas de una pool. `salida` recibe (item, nota, peso)."""
    for e in entradas:
        t = sin_ns(e.get("type", ""))
        n = copiar(nota)
        interpretar_condiciones(campo(e, "condition", "conditions"), n)
        aplicar_modificadores(campo(e, "modifier", "functions"), n)
        peso = e.get("weight", 1)
        if t == "item":
            salida.append((sin_ns(e["name"]), n, peso))
        elif t == "tag" and e.get("expand", True):
            tag = (e.get("items") or e.get("name") or "").lstrip("#")  # 26.x: "items", antes: "name"
            for it in etiquetas_item.get(sin_ns(tag), []):
                salida.append((it, n, peso))
        elif t in ("alternatives", "group", "sequence"):
            hijos = []
            previas = set()
            for hijo in e.get("children", []):
                nh = copiar(n)
                # en "alternatives" una rama solo aplica si las anteriores no: hereda lo opuesto
                if t == "alternatives":
                    nh["cond"] |= {OPUESTA[c] for c in previas if c in OPUESTA}
                antes = len(hijos)
                recorrer_entradas([hijo], nh, etiquetas_item, hijos, pila)
                if t == "alternatives":
                    for _, nn, _ in hijos[antes:]:
                        previas |= nn["cond"] - nh["cond"]
            salida += [(i, nn, peso) for i, nn, _ in hijos]
        elif t == "loot_table":
            ref = e.get("value") or e.get("name")
            if isinstance(ref, str) and ref not in pila:
                sub = DATOS / "loot_table" / (sin_ns(ref) + ".json")
                if sub.exists():
                    for it, nn in extraer_botin(leer(sub), etiquetas_item, pila + (ref,)):
                        nn2 = copiar(nn)
                        nn2["prob"] *= n["prob"]
                        nn2["cond"] |= n["cond"]
                        salida.append((it, nn2, peso))
        elif t == "empty":
            salida.append((None, n, peso))


def extraer_botin(tabla, etiquetas_item, pila=()):
    resultados = []
    for pool in tabla.get("pools", []):
        nota = nota_vacia()
        interpretar_condiciones(campo(pool, "condition", "conditions"), nota)
        aplicar_modificadores(campo(pool, "modifier", "functions"), nota)
        tiradas = rango(pool.get("rolls", 1)) or (1, 1)
        entradas = []
        total = 0
        for e in pool.get("entries", []):
            total += e.get("weight", 1)
            recorrer_entradas([e], nota, etiquetas_item, entradas, pila)
        total = total or 1
        for item, n, peso in entradas:
            if not item:
                continue
            p_tirada = n["prob"] * peso / total
            tir = max(tiradas[1], 1)
            n["prob"] = 1 - (1 - p_tirada) ** tir if tir > 1 else p_tirada
            aplicar_modificadores(tabla.get("functions"), n)
            resultados.append((item, n))
    return resultados


def fuente_de_tabla(ruta):
    primero = ruta.split("/")[0]
    return {"blocks": "bloque", "entities": "criatura", "chests": "cofre",
            "archaeology": "arqueologia", "gameplay": "juego", "brush": "arqueologia",
            "shearing": "criatura", "equipment": "criatura", "pots": "bloque",
            "harvest": "bloque", "carve": "bloque"}.get(primero, "otro") if not ruta.startswith("gameplay/fishing") else "pesca"


# ---------------------------------------------------------------- objetos

def detalle_nombre(id_, clave, lang):
    """Texto para distinguir objetos que comparten nombre (discos, estandartes, plantillas)."""
    if clave + ".desc" in lang:
        return lang[clave + ".desc"]
    if id_.endswith("_armor_trim_smithing_template"):
        return lang.get("trim_pattern.minecraft." + id_.removesuffix("_armor_trim_smithing_template"))
    if id_ == "netherite_upgrade_smithing_template":
        return lang.get("upgrade.minecraft.netherite_upgrade")
    return None


def categoria(id_, comp, es_bloque, etiquetas_de):
    tags = etiquetas_de.get(id_, set())
    if id_.endswith("_spawn_egg"):
        return "huevo_generador"
    if "minecraft:food" in comp:
        return "comida"
    if "minecraft:equippable" in comp and any(t in tags for t in ("head_armor", "chest_armor", "leg_armor", "foot_armor")):
        return "armadura"
    if "minecraft:weapon" in comp or "swords" in tags or id_ in ("bow", "crossbow", "trident", "mace", "arrow", "spectral_arrow", "tipped_arrow"):
        return "combate"
    if "minecraft:tool" in comp or id_.endswith(("_bucket", "shears", "flint_and_steel", "fishing_rod", "brush", "compass", "clock", "spyglass")):
        return "herramienta"
    if es_bloque:
        if any(t in tags for t in ("logs", "leaves", "saplings", "flowers", "dirt", "sand")) or id_.endswith(("_ore", "_sapling", "_leaves")):
            return "natural"
        if any(s in id_ for s in ("redstone", "piston", "repeater", "comparator", "observer", "hopper", "dropper", "dispenser", "lever", "_button", "pressure_plate", "rail", "tripwire", "daylight", "target", "sculk_sensor", "crafter")):
            return "redstone"
        if any(s in id_ for s in ("table", "furnace", "smoker", "chest", "barrel", "anvil", "bed", "loom", "stonecutter", "grindstone", "lectern", "cauldron", "beacon", "brewing", "composter", "bell", "lantern", "torch", "campfire", "shulker_box", "enchanting", "sign", "banner")):
            return "funcional"
        return "construccion"
    if id_.endswith(("_dye", "_ingot", "_nugget")) or id_ in ("diamond", "emerald", "lapis_lazuli", "quartz", "coal", "charcoal", "stick", "string", "leather", "bone", "gunpowder", "redstone", "amethyst_shard", "netherite_scrap"):
        return "ingrediente"
    return "varios"


def principal():
    if not DATOS.exists():
        sys.exit(f"No existe {CACHE}. Corre primero: npm run fetch")

    lang = {i: leer(CACHE / f"lang/{c}.json") for i, c in (("es", "es_es"), ("en", "en_us"))}
    registros = leer(CACHE / "summary/registries.json")
    componentes = leer(CACHE / "summary/item_components.json")
    bloques_reg = set(registros["block"])
    prismarine = {b["name"]: b for b in leer(CACHE / "prismarine/blocks.json")}
    version_pris = (CACHE / "prismarine/VERSION").read_text().strip()

    et_item = cargar_etiquetas("item")
    et_bloque = cargar_etiquetas("block")
    etiquetas_de = defaultdict(set)
    for tag, items in et_item.items():
        for it in items:
            etiquetas_de[it].add(tag)
    bloque_tags = defaultdict(set)
    for tag, bs in et_bloque.items():
        for b in bs:
            bloque_tags[b].add(tag)

    extra = {}
    ruta_extra = RAIZ / "content/extra.json"
    if ruta_extra.exists():
        extra = leer(ruta_extra).get("objetos", {})

    # -------- recetas
    recetas = []
    for f in sorted((DATOS / "recipe").glob("*.json")):
        r = normalizar_receta(f.stem, leer(f), et_item)
        if r:
            recetas.append(r)
    por_resultado = defaultdict(list)
    usos = defaultdict(list)
    for r in recetas:
        por_resultado[r["resultado"]].append(r)
        for it in items_de_receta(r):
            if it != r["resultado"]:
                usos[it].append({"receta": r["id"], "resultado": r["resultado"], "tipo": r["tipo"]})

    # -------- botín
    botin = defaultdict(list)
    base_loot = DATOS / "loot_table"
    for f in sorted(base_loot.rglob("*.json")):
        ruta = f.relative_to(base_loot).with_suffix("").as_posix()
        vistos = {}
        for item, n in extraer_botin(leer(f), et_item, (ruta,)):
            clave = (item, tuple(sorted(n["cond"])))
            if clave in vistos:  # misma fuente repetida en varias pools: suma
                v = vistos[clave]
                v["max"] += n["max"]
                continue
            vistos[clave] = {
                "tabla": ruta, "fuente": fuente_de_tabla(ruta),
                "min": round(n["min"], 2), "max": round(n["max"], 2),
                "probabilidad": round(min(n["prob"], 1), 4),
                "condiciones": sorted(n["cond"]), "bonus": sorted(n["bonus"]),
            }
            botin[item].append(vistos[clave])

    # -------- fichas
    fichas = {}
    def clave_de(i):
        return (componentes.get(i, {}).get("minecraft:item_name") or {}).get("translate") or \
            (f"block.minecraft.{i}" if i in bloques_reg else f"item.minecraft.{i}")
    conteo = defaultdict(int)
    for i in registros["item"]:
        conteo[lang["en"].get(clave_de(i))] += 1
    nombres_repetidos = {n for n, c in conteo.items() if c > 1}
    for id_ in registros["item"]:
        if id_ == "air":
            continue
        comp = componentes.get(id_, {})
        clave_nombre = (comp.get("minecraft:item_name") or {}).get("translate") or \
            (f"block.minecraft.{id_}" if id_ in bloques_reg else f"item.minecraft.{id_}")
        nombre = {i: lang[i].get(clave_nombre) or lang["en"].get(clave_nombre) or id_ for i in lang}
        if nombre["en"] in nombres_repetidos:
            for i in lang:
                det = detalle_nombre(id_, clave_nombre, lang[i])
                if det:
                    nombre[i] = f"{nombre[i]} ({det})"
        es_bloque = id_ in bloques_reg

        ficha = {
            "id": id_, "nombre": nombre,
            "tipo": "bloque" if es_bloque else "objeto",
            "categoria": categoria(id_, comp, es_bloque, etiquetas_de),
            "pila": comp.get("minecraft:max_stack_size", 64),
            "rareza": comp.get("minecraft:rarity", "common"),
            "durabilidad": comp.get("minecraft:max_damage"),
            "comida": None, "combate": None, "armadura": None, "bloque": None,
        }
        if "minecraft:food" in comp:
            f = comp["minecraft:food"]
            ficha["comida"] = {"nutricion": f.get("nutrition", 0), "saturacion": f.get("saturation", 0)}
        mods = comp.get("minecraft:attribute_modifiers") or []
        if isinstance(mods, dict):
            mods = mods.get("modifiers", [])
        attr = {sin_ns(m["type"]): m["amount"] for m in mods if m.get("operation") == "add_value"}
        if "attack_damage" in attr:
            ficha["combate"] = {"danio": round(1 + attr["attack_damage"], 2),
                                "velocidad": round(4 + attr.get("attack_speed", 0), 2)}
        if "armor" in attr:
            ranura = (comp.get("minecraft:equippable") or {}).get("slot")
            ficha["armadura"] = {"puntos": attr["armor"], "dureza": attr.get("armor_toughness", 0), "ranura": ranura}
        if es_bloque:
            p = prismarine.get(id_)
            tags_b = bloque_tags.get(id_, set())
            herramientas = sorted(t.split("/")[1] for t in tags_b if t.startswith("mineable/"))
            nivel = next((n for n in ("diamond", "iron", "stone") if f"needs_{n}_tool" in tags_b), None)
            ficha["bloque"] = {
                "dureza": p["hardness"] if p else None,
                "resistencia": p["resistance"] if p else None,
                "luz": p.get("emitLight", 0) if p else None,
                "herramienta": herramientas, "nivel": nivel,
                "fuente_dureza": version_pris if p else None,
            }
        ficha["recetas"] = [{k: v for k, v in r.items() if k != "resultado"} for r in por_resultado.get(id_, [])]
        ficha["usos"] = sorted(usos.get(id_, []), key=lambda u: (u["resultado"], u["receta"]))
        ficha["botin"] = sorted(botin.get(id_, []), key=lambda b: (b["fuente"], b["tabla"]))
        ficha["etiquetas"] = sorted(etiquetas_de.get(id_, []))
        if id_ in extra:
            ficha["extra"] = extra[id_]
        fichas[id_] = ficha

    # -------- índice ligero para el buscador y las portadas
    indice = [{"id": f["id"], "es": f["nombre"]["es"], "en": f["nombre"]["en"],
               "c": f["categoria"], "t": f["tipo"]} for f in fichas.values()]
    meta = {
        "version_minecraft": VERSION,
        "objetos": len(fichas),
        "recetas": len(recetas),
        "tablas_de_botin": sum(1 for _ in base_loot.rglob("*.json")),
        "version_prismarine": version_pris,
        "fuentes": ["Mojang client.jar", "Mojang assets (es_es)", "misode/mcmeta summary", "PrismarineJS minecraft-data"],
    }

    # nombres de criaturas para mostrar el origen del botín ("entities/zombie" → Zombi)
    nombres = {"entidades": {
        e: {i: lang[i].get(f"entity.minecraft.{e}") or lang["en"].get(f"entity.minecraft.{e}") or e for i in lang}
        for e in registros.get("entity_type", [])
    }}

    SALIDA.mkdir(exist_ok=True)
    escribir = lambda nombre, obj, ind: (SALIDA / nombre).write_text(
        json.dumps(obj, ensure_ascii=False, indent=ind, sort_keys=False) + "\n", encoding="utf-8")
    escribir("fichas.json", fichas, 1)
    escribir("index.json", indice, None)
    escribir("meta.json", meta, 2)
    escribir("nombres.json", nombres, 1)
    print(f"✓ {len(fichas)} fichas, {len(recetas)} recetas, {meta['tablas_de_botin']} tablas de botín ({VERSION})")


if __name__ == "__main__":
    principal()

"""
Convierte la base BC3/CYPE al formato JSON del React (mockData.json).

Salida: Pichon/Proyecto Pichón/src/data/data.json

Estructura de salida:
  Category[]
    .id, .name, .phase, .predecessors
    SubCategory[]
      .id, .name
      Task[]
        .id, .name, .unit (m2|m3|ml|gl|un)
        .apu { materials[], labor[] }
        .wasteEstimator?, .suggestion?
"""
import json, re
from collections import defaultdict
from openpyxl import load_workbook

# ── Configuración ──────────────────────────────────────────────────────────────
EXCEL_PATH   = r"C:\Users\bruno\Desktop\Claude_Projects\Pichon_Project\Rubros_Argentina_GeneradorPrecios_v4.xlsx"
OUTPUT_PATH  = r"C:\Users\bruno\Desktop\Claude_Projects\Pichon_Project\Pichon\Proyecto Pichón\src\data\data.json"

# Tipo de cambio y factores por tipo de ítem
EUR_TO_ARS       = 1242.0   # 1.08 × 1150
FACTOR_MATERIAL  = 0.70
FACTOR_LABOR     = 0.30
FACTOR_MAQUINARIA= 0.45

# Capítulos a incluir (excluimos andamios, control calidad, gestión residuos)
CHAPTERS_INCLUDE = {"A", "C", "D", "E", "F", "I", "L", "N", "Q", "R", "S"}

CHAPTER_NAMES = {
    "A": "Acondicionamiento del Terreno",
    "C": "Fundaciones",
    "D": "Demoliciones",
    "E": "Estructuras",
    "F": "Fachadas y Tabiques",
    "I": "Instalaciones",
    "L": "Carpintería y Vidrios",
    "N": "Aislamientos e Impermeabilizaciones",
    "Q": "Cubiertas",
    "R": "Revestimientos y Trasdosados",
    "S": "Señalización y Equipamiento",
}

# Fases por capítulo
CHAPTER_PHASE = {
    "A": "A", "C": "A", "D": "A",
    "E": "B", "F": "B", "N": "B", "Q": "B",
    "I": "C", "L": "C", "R": "C", "S": "C",
}

# Orden visual de categorías
CHAPTER_ORDER = ["D", "A", "C", "E", "F", "N", "Q", "I", "L", "R", "S"]

# Nombres de sub-secciones (primeras 2 letras del código)
SECTION_NAMES = {
    # Acondicionamiento
    "AD": "Movimiento de tierras",
    "AF": "Zanjas y pozos",
    "AH": "Bases y subbases",
    # Cimentaciones
    "CS": "Cimentaciones superficiales",
    "CP": "Pilotajes",
    "CE": "Muros de contención",
    "CN": "Nivelación",
    # Demoliciones
    "DC": "Demolición de cimentaciones",
    "DD": "Demolición de estructuras",
    "DE": "Demolición de fachadas",
    "DF": "Demolición de instalaciones",
    "DI": "Demolición de revestimientos interiores",
    "DL": "Demolición de solados y alicatados",
    "DN": "Demolición de aislamientos",
    "DQ": "Demolición de cubiertas",
    "DR": "Demolición de revestimientos",
    "DS": "Demolición de señalización",
    "DM": "Demolición de mampostería",
    "DP": "Demolición de pavimentos",
    "DH": "Demolición de hormigón",
    "DU": "Demolición de urbanización",
    # Estructuras
    "EH": "Hormigón armado",
    "EA": "Estructuras de acero",
    "EF": "Estructuras de madera",
    "EM": "Estructuras mixtas",
    # Fachadas
    "FF": "Fachadas de fábrica",
    "FD": "Fachadas de doble hoja",
    "FV": "Sistemas SATE",
    "FC": "Revestimientos de fachadas",
    "FP": "Particiones interiores",
    # Instalaciones
    "IC": "Calefacción, refrigeración y ACS",
    "IE": "Electricidad",
    "IF": "Fontanería",
    "IG": "Gas",
    "IH": "Protección contra incendios",
    "II": "Iluminación interior",
    "IS": "Salubridad y saneamiento",
    "IT": "Telecomunicaciones",
    "IV": "Ventilación y climatización",
    "ID": "Domótica",
    # Carpintería
    "LC": "Carpintería exterior",
    "LE": "Puertas de entrada",
    "LF": "Vidrios y cristales",
    "LM": "Puertas interiores",
    "LP": "Particiones de vidrio",
    "LL": "Persianas y cierres",
    # Aislamientos
    "NA": "Impermeabilizaciones",
    "NF": "Aislamiento en fachadas",
    "NI": "Aislamiento en cubiertas",
    "NJ": "Aislamiento en fachadas (frentes)",
    "NT": "Trasdosados",
    "NW": "Sistemas de aislamiento",
    # Cubiertas
    "QA": "Azoteas",
    "QT": "Cubiertas inclinadas",
    "QX": "Cubiertas especiales",
    # Revestimientos
    "RA": "Alicatados y chapados",
    "RF": "Pinturas exteriores",
    "RI": "Pinturas interiores",
    "RP": "Revoques y enlucidos",
    "RS": "Solados y pavimentos",
    "RT": "Trasdosados de yeso",
    # Señalización y equip.
    "SA": "Aparatos sanitarios",
    "SC": "Equipamiento de cocinas",
    "SS": "Señalización",
    "SY": "Equipamiento varios",
}


# ── Mapeo de unidades BC3 → React UnitType ─────────────────────────────────────
def map_unit(unit_str: str) -> str:
    u = str(unit_str).strip().lower()
    if u in ("m²", "m2"):           return "m2"
    if u in ("m³", "m3"):           return "m3"
    if u in ("m", "ml"):            return "ml"
    if u in ("ud", "uds", "u"):     return "un"
    if u in ("gl", "pa", "partida"):return "gl"
    if u in ("kg",):                return "kg"  # kept for materials
    return "un"


# ── Unidades comerciales por unidad de material ────────────────────────────────
COMMERCIAL = {
    "kg":   ("bolsa 50 kg",    50,   True,  False),  # (commUnit, qty, isWet, isHeavy)
    "t":    ("tonelada",       1000, False, True),
    "m3":   ("m³",             1,    False, False),
    "m2":   ("m²",             1,    False, False),
    "m":    ("rollo 50 m",     50,   False, False),
    "ml":   ("rollo 50 m",     50,   False, False),
    "l":    ("bidón 20 l",     20,   True,  False),
    "ud":   ("unidad",         1,    False, False),
    "u":    ("unidad",         1,    False, False),
    "uds":  ("unidad",         1,    False, False),
    "h":    ("hora",           1,    False, False),  # mano de obra
    "%":    ("porcentaje",     1,    False, False),
}

def get_commercial(unit: str, desc: str):
    u = str(unit).strip().lower()
    base = COMMERCIAL.get(u, ("unidad", 1, False, False))
    comm_unit, qty, is_wet, is_heavy = base

    # Refinar según descripción del material
    d = desc.lower()
    if "cemento" in d or "yeso" in d or "cal " in d:
        return "bolsa 25 kg", 25, True
    if "pintura" in d or "imprimación" in d or "barniz" in d:
        return "bidón 15 l", 15, True
    if "adhesivo" in d or "mortero seco" in d or "pasta" in d:
        return "bolsa 25 kg", 25, True
    if "ladrillo" in d or "bloque" in d:
        return "pallet 500 ud", 500, False
    if "árido" in d or "arena" in d or "grava" in d:
        return "m³", 1, False
    if "tubo" in d or "tubería" in d:
        return "barra 6 m", 6, False
    if "cable" in d or "hilo" in d or "conductor" in d:
        return "rollo 100 m", 100, False
    if "panel" in d or "plancha" in d or "lámina" in d:
        return "m²", 1, False

    return comm_unit, qty, is_wet


def get_waste_factor(desc: str, unit: str) -> float:
    d = desc.lower()
    if any(k in d for k in ["mortero", "hormigón", "concreto", "cemento", "revoque", "yeso"]):
        return 1.10
    if any(k in d for k in ["ladrillo", "cerámica", "porcelanato", "azulejo", "baldosa"]):
        return 1.08
    if any(k in d for k in ["madera", "tabla", "listón", "viga"]):
        return 1.10
    if any(k in d for k in ["pintura", "imprimación"]):
        return 1.10
    if any(k in d for k in ["tubo", "tubería", "cable", "conductor"]):
        return 1.05
    return 1.05


def get_labor_role(desc: str) -> str:
    d = desc.lower()
    if any(k in d for k in ["oficial de 1", "maestro", "capataz", "soldad", "especialista",
                              "técnico", "oficial 1"]):
        return "Oficial"
    if any(k in d for k in ["peón", "peon", "ayudante", "auxiliar", "aprendiz"]):
        return "Ayudante"
    if any(k in d for k in ["oficial de 2", "medio", "semi", "oficial 2"]):
        return "Medio Oficial"
    # Heurística por precio: los más caros = Oficial
    return "Oficial"


def is_moisture_sensitive(desc: str) -> bool:
    d = desc.lower()
    return any(k in d for k in ["cemento", "yeso", "cal ", "escayola", "pasta",
                                  "adhesivo", "mortero seco", "estuco"])


# ── Cargar BC3 ─────────────────────────────────────────────────────────────────
def load_bc3():
    print("Cargando BC3...", flush=True)
    wb = load_workbook(EXCEL_PATH, read_only=True, data_only=True)

    # APU Resumen
    res_sheet = det_sheet = None
    for name in wb.sheetnames:
        if "Resumen" in name and "APU" in name:
            res_sheet = wb[name]
        if "Detalle" in name and "APU" in name:
            det_sheet = wb[name]

    # Leer resumen
    tasks = {}
    for row in res_sheet.iter_rows(min_row=2, values_only=True):
        code = str(row[0] or "").strip()
        if not code or len(code) < 3:
            continue
        chapter = code[0].upper()
        if chapter not in CHAPTERS_INCLUDE:
            continue
        tasks[code] = {
            "code":    code,
            "chapter": chapter,
            "section": code[:2].upper(),
            "desc":    str(row[2] or "").strip(),
            "unit":    str(row[3] or "").strip(),
            "total_eur": float(row[4] or 0),
            "materials": [],
            "labor":     [],
        }

    # Leer detalle
    current = None
    for row in det_sheet.iter_rows(min_row=2, values_only=True):
        code_col = str(row[0] or "").strip()
        tipo_col = str(row[3] or "").strip()

        if code_col and code_col in tasks:
            current = code_col
            continue

        if not current or not tipo_col:
            continue

        unit_item  = str(row[6] or "").strip()
        qty        = float(row[7] or 0)
        unit_price = float(row[8] or 0)
        desc_item  = str(row[5] or "").strip()
        code_item  = str(row[4] or "").strip()

        if qty <= 0 or unit_price < 0:
            continue

        if tipo_col == "Mano de obra":
            role = get_labor_role(desc_item)
            ars_rate = round(unit_price * FACTOR_LABOR * EUR_TO_ARS, 0)
            tasks[current]["labor"].append({
                "role":          role,
                "hoursPerUnit":  round(qty, 4),
                "hourlyRate":    max(ars_rate, 5000),  # mínimo razonable ARS/h
                "eur_ref":       unit_price,
            })

        elif tipo_col == "Material":
            comm_unit, comm_qty, is_wet = get_commercial(unit_item, desc_item)
            waste = get_waste_factor(desc_item, unit_item)
            ars_cost = round(unit_price * FACTOR_MATERIAL * EUR_TO_ARS, 2)

            tasks[current]["materials"].append({
                "id":                       code_item.lower().replace("/", "_"),
                "name":                     desc_item[:60],
                "unit":                     unit_item,
                "yield":                    round(qty, 4),
                "cost":                     max(ars_cost, 1.0),
                "eur_ref":                  unit_price,
                "commercialUnit":           comm_unit,
                "commercialPackagingQuantity": comm_qty,
                "wasteFactor":              waste,
                "sensitiveToMoisture":      is_moisture_sensitive(desc_item),
            })

    wb.close()
    print(f"  {len(tasks)} tareas BC3 cargadas.", flush=True)
    return tasks


# ── Construir jerarquía React ──────────────────────────────────────────────────
def build_react_json(tasks: dict) -> list:
    # Agrupar: chapter → section → [tasks]
    chapters = defaultdict(lambda: defaultdict(list))
    for code, t in tasks.items():
        if t["total_eur"] <= 0:
            continue  # skip placeholders
        if not t["materials"] and not t["labor"]:
            continue  # skip tasks with no APU
        chapters[t["chapter"]][t["section"]].append(t)

    categories = []
    cat_idx = 1

    predecessors_map = {
        "A": [],
        "C": ["cat_A"],
        "D": [],
        "E": ["cat_C"],
        "F": ["cat_E"],
        "N": ["cat_F"],
        "Q": ["cat_F"],
        "I": ["cat_E"],
        "L": ["cat_F"],
        "R": ["cat_I", "cat_L"],
        "S": ["cat_R"],
    }

    for chapter in CHAPTER_ORDER:
        if chapter not in chapters:
            continue
        sections = chapters[chapter]
        cat_id = f"cat_{chapter}"

        subcategories = []
        sub_idx = 1
        for section_code in sorted(sections.keys()):
            section_tasks = sections[section_code]
            section_name = SECTION_NAMES.get(section_code, section_code)
            sub_id = f"sub_{section_code}"

            react_tasks = []
            for t in sorted(section_tasks, key=lambda x: x["code"]):
                react_unit = map_unit(t["unit"])

                # Deduplicar labor por rol (sumar horas si mismo rol)
                labor_by_role: dict = {}
                for lab in t["labor"]:
                    r = lab["role"]
                    if r not in labor_by_role:
                        labor_by_role[r] = {"role": r, "hoursPerUnit": 0, "hourlyRate": lab["hourlyRate"]}
                    labor_by_role[r]["hoursPerUnit"] = round(
                        labor_by_role[r]["hoursPerUnit"] + lab["hoursPerUnit"], 4
                    )
                    # Tomar la tarifa más alta del rol
                    labor_by_role[r]["hourlyRate"] = max(
                        labor_by_role[r]["hourlyRate"], lab["hourlyRate"]
                    )

                # Deduplicar materiales por id (sumar yields si mismo id)
                mats_by_id: dict = {}
                for mat in t["materials"]:
                    mid = mat["id"]
                    if mid not in mats_by_id:
                        mats_by_id[mid] = dict(mat)
                    else:
                        mats_by_id[mid]["yield"] = round(
                            mats_by_id[mid]["yield"] + mat["yield"], 4
                        )

                react_task = {
                    "id":   f"t_{t['code']}",
                    "name": t["desc"][:70],
                    "unit": react_unit,
                    "apu": {
                        "materials": list(mats_by_id.values()),
                        "labor":     list(labor_by_role.values()),
                    },
                }

                # Waste estimator si hay materiales
                if mats_by_id:
                    max_waste = max(m["wasteFactor"] for m in mats_by_id.values())
                    if max_waste > 1.05:
                        react_task["wasteEstimator"] = {
                            "factor":      max_waste,
                            "description": "Desperdicio estimado por corte y manipulación",
                        }

                react_tasks.append(react_task)

            if not react_tasks:
                continue

            subcategories.append({
                "id":    sub_id,
                "name":  f"{section_code} — {section_name}",
                "tasks": react_tasks,
            })
            sub_idx += 1

        if not subcategories:
            continue

        categories.append({
            "id":             cat_id,
            "name":           CHAPTER_NAMES.get(chapter, chapter),
            "phase":          CHAPTER_PHASE.get(chapter, "A"),
            "predecessors":   predecessors_map.get(chapter, []),
            "subcategories":  subcategories,
        })
        cat_idx += 1

    return categories


# ── Stats de salida ────────────────────────────────────────────────────────────
def print_stats(data: list):
    total_cats  = len(data)
    total_subs  = sum(len(c["subcategories"]) for c in data)
    total_tasks = sum(len(s["tasks"]) for c in data for s in c["subcategories"])
    total_mats  = sum(len(t["apu"]["materials"]) for c in data
                      for s in c["subcategories"] for t in s["tasks"])
    total_labor = sum(len(t["apu"]["labor"]) for c in data
                      for s in c["subcategories"] for t in s["tasks"])

    print(f"\n  Categorías:     {total_cats}")
    print(f"  Subcategorías:  {total_subs}")
    print(f"  Tareas:         {total_tasks}")
    print(f"  Items material: {total_mats}")
    print(f"  Items labor:    {total_labor}")

    for cat in data:
        n_tasks = sum(len(s["tasks"]) for s in cat["subcategories"])
        print(f"    [{cat['phase']}] {cat['name']}: {len(cat['subcategories'])} secciones, {n_tasks} tareas")


# ── Main ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    tasks = load_bc3()
    print("Construyendo jerarquía React...", flush=True)
    data  = build_react_json(tasks)
    print_stats(data)

    print(f"\nEscribiendo -> {OUTPUT_PATH}", flush=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    size_kb = len(json.dumps(data, ensure_ascii=False)) / 1024
    print(f"Listo. {size_kb:.0f} KB")

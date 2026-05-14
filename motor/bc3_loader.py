"""
Carga y cachea los datos BC3 del Excel v4.
Expone: get_tarea(code) → dict con desc, unit, price, items
"""
import functools
from openpyxl import load_workbook

_CACHE: dict = {}
_LOADED = False
EXCEL_PATH = r"C:\Users\bruno\Desktop\Claude_Projects\Pichon_Project\Rubros_Argentina_GeneradorPrecios_v4.xlsx"

RUBRO_NOMBRES = {
    "0": "Actuaciones previas",
    "A": "Acondicionamiento del terreno",
    "C": "Fundaciones",
    "D": "Demoliciones",
    "E": "Estructuras",
    "F": "Fachadas y tabiques",
    "H": "Remates y ayudas",
    "I": "Instalaciones",
    "L": "Carpintería y vidrios",
    "N": "Aislamientos e impermeabilizaciones",
    "Q": "Cubiertas",
    "R": "Revestimientos y trasdosados",
    "S": "Señalización y equipamiento",
    "U": "Urbanización interior del lote",
    "G": "Gestión de residuos",
    "X": "Control de calidad y ensayos",
    "Y": "Seguridad y salud",
}


def _load():
    global _LOADED, _CACHE
    if _LOADED:
        return
    print("Cargando base BC3 desde Excel...", end=" ", flush=True)
    wb = load_workbook(EXCEL_PATH, read_only=True, data_only=True)

    # Buscar la hoja APU – Resumen para precios totales
    resumen_sheet = None
    detalle_sheet = None
    for name in wb.sheetnames:
        clean = name.replace("�", "–").replace("?", "–")
        if "Resumen" in name:
            resumen_sheet = wb[name]
        if "Detalle" in name:
            detalle_sheet = wb[name]

    # Leer resumen: código → {desc, unit, total}
    tareas = {}
    if resumen_sheet:
        for row in resumen_sheet.iter_rows(min_row=2, values_only=True):
            if not row[0]:
                continue
            code = str(row[0]).strip()
            tareas[code] = {
                "code":  code,
                "desc":  str(row[2] or ""),
                "unit":  str(row[3] or ""),
                "total": float(row[4] or 0),
                "items": [],
            }

    # Leer detalle: agregar ítems a cada tarea
    if detalle_sheet:
        current = None
        for row in detalle_sheet.iter_rows(min_row=2, values_only=True):
            code_col = str(row[0] or "").strip()
            tipo_col = str(row[3] or "").strip()

            if code_col and code_col in tareas:
                current = code_col
            elif current and tipo_col:
                tareas[current]["items"].append({
                    "tipo":        tipo_col,
                    "code":        str(row[4] or ""),
                    "desc":        str(row[5] or ""),
                    "unit":        str(row[6] or ""),
                    "qty":         float(row[7] or 0),
                    "unit_price":  float(row[8] or 0),
                    "amount":      float(row[9] or 0),
                })

    _CACHE.update(tareas)
    _LOADED = True
    print(f"{len(_CACHE)} tareas cargadas.")
    wb.close()


def get_tarea(code: str) -> dict | None:
    _load()
    return _CACHE.get(code)


def get_rubro(code: str) -> tuple[str, str]:
    """Retorna (letra_rubro, nombre_rubro) para un código de tarea."""
    letra = code[0] if code else "?"
    return letra, RUBRO_NOMBRES.get(letra, "Otros")

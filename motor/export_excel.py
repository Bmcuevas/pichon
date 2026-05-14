"""
Exporta un Presupuesto a Excel profesional (.xlsx).
Hojas: Portada, Geometria, Resumen por Rubro, Detalle Tareas, Desglose Materiales.
"""
from datetime import date
from openpyxl import Workbook
from openpyxl.styles import (
    PatternFill, Font, Alignment, Border, Side, numbers
)
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

from .models import Presupuesto, TipoItem
from .ars_layer import ResultadoARS

# ── Paleta de colores ──────────────────────────────────────────────────────────
C_HEADER    = "1F3864"   # azul oscuro
C_TOTAL     = "BDD7EE"   # azul claro
C_ALT       = "F2F2F2"   # gris claro filas alternas
C_ACCENT    = "2E75B6"   # azul medio (portada)
C_WHITE     = "FFFFFF"
C_GREEN     = "E2EFDA"
C_YELLOW    = "FFEB9C"
C_RED       = "FFC7CE"

TIPO_LABELS = {
    TipoItem.MATERIAL:   "Materiales",
    TipoItem.MANO_OBRA:  "Mano de obra",
    TipoItem.MAQUINARIA: "Maquinaria/Equipos",
    TipoItem.COMP_COMP:  "Costos complementarios",
}

FMT_EUR = '#,##0.00 "€"'
FMT_ARS = '#,##0 "ARS"'
FMT_USD = '"$"#,##0'
FMT_PCT = '0.0"%"'
FMT_NUM = '#,##0.00'


# ── Helpers de estilo ──────────────────────────────────────────────────────────

def _fill(hex_color: str) -> PatternFill:
    return PatternFill("solid", fgColor=hex_color)

def _font(bold=False, color=C_WHITE, size=11) -> Font:
    return Font(bold=bold, color=color, size=size)

def _border_thin() -> Border:
    s = Side(style="thin", color="CCCCCC")
    return Border(left=s, right=s, top=s, bottom=s)

def _header_cell(ws, row, col, value, width=None):
    c = ws.cell(row=row, column=col, value=value)
    c.fill   = _fill(C_HEADER)
    c.font   = _font(bold=True)
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = _border_thin()
    if width and col <= ws.max_column:
        ws.column_dimensions[get_column_letter(col)].width = width
    return c

def _data_cell(ws, row, col, value, fmt=None, bold=False,
               fill_color=None, align="right"):
    c = ws.cell(row=row, column=col, value=value)
    c.font   = Font(bold=bold, size=10, color="000000")
    c.alignment = Alignment(horizontal=align)
    c.border = _border_thin()
    if fmt:
        c.number_format = fmt
    if fill_color:
        c.fill = _fill(fill_color)
    return c

def _total_row(ws, row, values, fmts, ncols):
    for col, (val, fmt) in enumerate(zip(values, fmts), start=1):
        c = ws.cell(row=row, column=col, value=val)
        c.fill   = _fill(C_TOTAL)
        c.font   = Font(bold=True, size=10)
        c.border = _border_thin()
        if fmt:
            c.number_format = fmt
        c.alignment = Alignment(horizontal="right" if col > 1 else "left")


# ── Hoja 1: Portada ───────────────────────────────────────────────────────────

def _hoja_portada(wb: Workbook, p: Presupuesto, ars: ResultadoARS):
    ws = wb.active
    ws.title = "Portada"
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 32
    ws.column_dimensions["B"].width = 28

    def kv(row, key, value, fmt=None):
        k = ws.cell(row=row, column=1, value=key)
        k.font = Font(bold=True, size=11, color=C_ACCENT)
        k.alignment = Alignment(horizontal="left")
        v = ws.cell(row=row, column=2, value=value)
        v.font = Font(size=11)
        v.alignment = Alignment(horizontal="left")
        if fmt:
            v.number_format = fmt
        ws.row_dimensions[row].height = 18

    # Título
    ws.merge_cells("A1:B1")
    t = ws["A1"]
    t.value = "PRESUPUESTO DE OBRA"
    t.font  = Font(bold=True, size=20, color=C_WHITE)
    t.fill  = _fill(C_HEADER)
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 40

    ws.merge_cells("A2:B2")
    s = ws["A2"]
    s.value = "[Nombre del Proyecto / Comitente]"
    s.font  = Font(italic=True, size=13, color=C_ACCENT)
    s.alignment = Alignment(horizontal="center")
    ws.row_dimensions[2].height = 24

    ws.row_dimensions[3].height = 10

    kv(4,  "Tipología",   p.tipologia.value.replace("_", " ").title())
    kv(5,  "Calidad",     p.calidad.value.title())
    kv(6,  "Superficie",  p.superficie, '#,##0.00 "m²"')
    kv(7,  "Provincia",   p.provincia)
    kv(8,  "Fecha",       date.today().strftime("%d/%m/%Y"))
    kv(9,  "Arquitecto",  "[Nombre del Arquitecto]")

    ws.row_dimensions[10].height = 10

    # Bloque de totales
    def tot(row, key, value, fmt):
        k = ws.cell(row=row, column=1, value=key)
        k.font  = Font(bold=True, size=12, color=C_WHITE)
        k.fill  = _fill(C_ACCENT)
        k.alignment = Alignment(horizontal="left", indent=1)
        ws.row_dimensions[row].height = 22
        v = ws.cell(row=row, column=2, value=value)
        v.font  = Font(bold=True, size=12, color=C_WHITE)
        v.fill  = _fill(C_ACCENT)
        v.number_format = fmt
        v.alignment = Alignment(horizontal="right")

    tot(11, "Total EUR (ref. España)",     p.total_eur,         FMT_EUR)
    tot(12, "Total USD estimado",          ars.total_usd,        FMT_USD)
    tot(13, "Total ARS estimado",          ars.total_ars,        FMT_ARS)

    ws.row_dimensions[14].height = 10

    kv(15, "EUR/m²",        p.costo_eur_por_m2,      FMT_EUR)
    kv(16, "USD/m²",        ars.costo_usd_por_m2,    FMT_USD)
    kv(17, "ARS/m²",        ars.costo_ars_por_m2,    FMT_ARS)
    kv(18, "Ref. CAC USD/m²", ars.cac_ref_usd_m2,   FMT_USD)
    kv(19, "Desviación vs CAC", f"{ars.desviacion_cac_pct:+.1f}%")

    ws.row_dimensions[20].height = 10
    kv(21, "Tipo de cambio",
       f"1 EUR = USD {ars.eur_to_ars/1150:.2f} · 1 USD = ARS {int(ars.eur_to_ars/1.08):,}")
    kv(22, "Tasas al",      ars.fecha_tasas)

    note = ws.cell(row=24, column=1,
                   value="* Precios de referencia España (EUR). "
                         "Actualizar tipo de cambio y factores ARS según mercado local.")
    note.font = Font(italic=True, size=9, color="888888")
    ws.merge_cells("A24:B24")


# ── Hoja 2: Geometría ─────────────────────────────────────────────────────────

def _hoja_geometria(wb: Workbook, p: Presupuesto):
    ws = wb.create_sheet("Geometria")
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 30
    ws.column_dimensions["B"].width = 16
    ws.column_dimensions["C"].width = 10

    _header_cell(ws, 1, 1, "Medida geométrica")
    _header_cell(ws, 1, 2, "Valor")
    _header_cell(ws, 1, 3, "Unidad")
    ws.row_dimensions[1].height = 20

    g = p.geometria
    rows = [
        ("Superficie cubierta",     g.superficie_cubierta,  "m²"),
        ("Perímetro exterior",       g.perimetro,             "ml"),
        ("Área muros exteriores",    g.area_muros_ext,        "m²"),
        ("Área tabiques interiores", g.area_muros_int,        "m²"),
        ("Área cubierta",            g.area_cubierta,         "m²"),
        ("Área pisos",               g.area_pisos,            "m²"),
        ("Zonas húmedas (baños+coc)",g.area_zonas_humedas,   "m²"),
        ("Cimientos (ml)",           g.ml_cimientos,          "ml"),
        ("Volumen excavación",       g.vol_excavacion,        "m³"),
        ("Baños estimados",          g.n_banos,               "ud"),
        ("Pilares estimados",        g.n_pilares,             "ud"),
    ]
    for i, (label, val, unit) in enumerate(rows, start=2):
        fill = C_ALT if i % 2 == 0 else C_WHITE
        _data_cell(ws, i, 1, label, align="left",  fill_color=fill)
        _data_cell(ws, i, 2, val,   fmt="#,##0.00", fill_color=fill)
        _data_cell(ws, i, 3, unit,  align="center", fill_color=fill)


# ── Hoja 3: Resumen por Rubro ─────────────────────────────────────────────────

def _hoja_resumen_rubro(wb: Workbook, p: Presupuesto, ars: ResultadoARS):
    ws = wb.create_sheet("Resumen por Rubro")
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 6
    ws.column_dimensions["B"].width = 35
    ws.column_dimensions["C"].width = 18
    ws.column_dimensions["D"].width = 18
    ws.column_dimensions["E"].width = 14
    ws.column_dimensions["F"].width = 10

    headers = ["#", "Rubro", "EUR ref.", "ARS estimado", "USD estimado", "% total"]
    for col, h in enumerate(headers, 1):
        _header_cell(ws, 1, col, h)
    ws.row_dimensions[1].height = 20

    # Construir mapa ars por rubro
    ars_by_code = {cod: imp for cod, _, imp in ars.tareas_ars}
    rubro_ars: dict[str, float] = {}
    for tarea in p.tareas:
        rubro_ars[tarea.rubro] = rubro_ars.get(tarea.rubro, 0) + ars_by_code.get(tarea.codigo_tarea, 0)

    rubros = sorted(p.por_rubro.items())
    for i, ((letra, nombre), datos) in enumerate(rubros, start=2):
        eur = datos["total_eur"]
        ars_val = rubro_ars.get(letra, 0)
        usd_val = round(ars_val / 1150, 0) if ars_val else 0
        pct = eur / p.total_eur * 100 if p.total_eur else 0

        fill = C_ALT if i % 2 == 0 else C_WHITE
        _data_cell(ws, i, 1, letra,   align="center", fill_color=fill)
        _data_cell(ws, i, 2, nombre,  align="left",   fill_color=fill)
        _data_cell(ws, i, 3, eur,     fmt=FMT_EUR,    fill_color=fill)
        _data_cell(ws, i, 4, ars_val, fmt=FMT_ARS,    fill_color=fill)
        _data_cell(ws, i, 5, usd_val, fmt=FMT_USD,    fill_color=fill)

        # Color según % del total
        pct_fill = (C_RED if pct > 25 else C_YELLOW if pct > 15 else C_GREEN)
        c = _data_cell(ws, i, 6, pct / 100, fmt='0.0%', fill_color=pct_fill)

    # Fila total
    tr = len(rubros) + 2
    _total_row(ws, tr,
               ["", "TOTAL", p.total_eur, ars.total_ars, ars.total_usd, 1.0],
               [None, None, FMT_EUR, FMT_ARS, FMT_USD, '0%'],
               6)


# ── Hoja 4: Detalle Tareas ────────────────────────────────────────────────────

def _hoja_detalle_tareas(wb: Workbook, p: Presupuesto, ars: ResultadoARS):
    ws = wb.create_sheet("Detalle Tareas")
    ws.column_dimensions["A"].width = 10
    ws.column_dimensions["B"].width = 42
    ws.column_dimensions["C"].width = 8
    ws.column_dimensions["D"].width = 10
    ws.column_dimensions["E"].width = 12
    ws.column_dimensions["F"].width = 14
    ws.column_dimensions["G"].width = 16
    ws.column_dimensions["H"].width = 12

    headers = ["Código", "Descripción", "Ud.", "Cantidad",
               "EUR/ud", "Total EUR", "Total ARS", "Total USD"]
    for col, h in enumerate(headers, 1):
        _header_cell(ws, 1, col, h)
    ws.row_dimensions[1].height = 20
    ws.freeze_panes = "A2"

    ars_by_code = {cod: imp for cod, _, imp in ars.tareas_ars}
    usd_ars_rate = 1150.0

    for i, tarea in enumerate(p.tareas, start=2):
        ars_val = ars_by_code.get(tarea.codigo_tarea, 0)
        usd_val = round(ars_val / usd_ars_rate, 0)
        fill = C_ALT if i % 2 == 0 else C_WHITE

        _data_cell(ws, i, 1, tarea.codigo_tarea,        align="center", fill_color=fill)
        _data_cell(ws, i, 2, tarea.nombre_tarea[:60],   align="left",   fill_color=fill)
        _data_cell(ws, i, 3, tarea.unidad,              align="center", fill_color=fill)
        _data_cell(ws, i, 4, tarea.cantidad,            fmt=FMT_NUM,    fill_color=fill)
        _data_cell(ws, i, 5, tarea.precio_unitario_eur, fmt=FMT_EUR,    fill_color=fill)
        _data_cell(ws, i, 6, tarea.importe_eur,         fmt=FMT_EUR,    fill_color=fill)
        _data_cell(ws, i, 7, ars_val,                   fmt=FMT_ARS,    fill_color=fill)
        _data_cell(ws, i, 8, usd_val,                   fmt=FMT_USD,    fill_color=fill)

    # Total
    tr = len(p.tareas) + 2
    _total_row(ws, tr,
               ["", "TOTAL", "", "", "", p.total_eur, ars.total_ars, ars.total_usd],
               [None, None, None, None, None, FMT_EUR, FMT_ARS, FMT_USD],
               8)

    ws.auto_filter.ref = f"A1:H{len(p.tareas)+1}"


# ── Hoja 5: Desglose Materiales ───────────────────────────────────────────────

def _hoja_desglose_materiales(wb: Workbook, p: Presupuesto, ars: ResultadoARS):
    ws = wb.create_sheet("Desglose Materiales")
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 16
    ws.column_dimensions["C"].width = 10
    ws.column_dimensions["D"].width = 18
    ws.column_dimensions["E"].width = 14

    headers = ["Tipo de ítem", "EUR ref.", "% EUR", "ARS estimado", "% ARS"]
    for col, h in enumerate(headers, 1):
        _header_cell(ws, 1, col, h)
    ws.row_dimensions[1].height = 20

    from collections import defaultdict
    eur_by_tipo: dict = defaultdict(float)
    ars_by_tipo: dict = defaultdict(float)

    ars_by_code = {cod: imp for cod, _, imp in ars.tareas_ars}

    for tarea in p.tareas:
        ars_tarea = ars_by_code.get(tarea.codigo_tarea, 0)
        eur_total_items = sum(it.importe_eur for it in tarea.items) or tarea.importe_eur
        for item in tarea.items:
            eur_by_tipo[item.tipo] += item.importe_eur
            # Proporcionar ARS al tipo según su peso EUR
            if eur_total_items > 0:
                ars_by_tipo[item.tipo] += ars_tarea * (item.importe_eur / eur_total_items)

    total_eur_items = sum(eur_by_tipo.values()) or 1
    total_ars_items = sum(ars_by_tipo.values()) or 1

    orden = [TipoItem.MATERIAL, TipoItem.MANO_OBRA, TipoItem.MAQUINARIA, TipoItem.COMP_COMP]
    for i, tipo in enumerate(orden, start=2):
        eur = eur_by_tipo.get(tipo, 0)
        ars_v = ars_by_tipo.get(tipo, 0)
        fill = C_ALT if i % 2 == 0 else C_WHITE
        _data_cell(ws, i, 1, TIPO_LABELS[tipo],           align="left",  fill_color=fill)
        _data_cell(ws, i, 2, eur,              fmt=FMT_EUR, fill_color=fill)
        _data_cell(ws, i, 3, eur/total_eur_items, fmt='0.0%', fill_color=fill)
        _data_cell(ws, i, 4, ars_v,            fmt=FMT_ARS, fill_color=fill)
        _data_cell(ws, i, 5, ars_v/total_ars_items, fmt='0.0%', fill_color=fill)

    tr = len(orden) + 2
    _total_row(ws, tr,
               ["TOTAL", total_eur_items, 1.0, total_ars_items, 1.0],
               [None, FMT_EUR, '0%', FMT_ARS, '0%'],
               5)


# ── Función principal ─────────────────────────────────────────────────────────

def exportar_excel(
    presupuesto: Presupuesto,
    resultado_ars: ResultadoARS,
    output_path: str,
) -> str:
    wb = Workbook()
    _hoja_portada(wb, presupuesto, resultado_ars)
    _hoja_geometria(wb, presupuesto)
    _hoja_resumen_rubro(wb, presupuesto, resultado_ars)
    _hoja_detalle_tareas(wb, presupuesto, resultado_ars)
    _hoja_desglose_materiales(wb, presupuesto, resultado_ars)
    wb.save(output_path)
    return output_path


if __name__ == "__main__":
    import sys
    sys.path.insert(0, '.')
    from motor import calcular_presupuesto, convertir_presupuesto, Tipologia, Calidad
    p   = calcular_presupuesto(Tipologia.CASA_UNIFAMILIAR, Calidad.ESTANDAR, 120.0, "Buenos Aires")
    ars = convertir_presupuesto(p)
    path = exportar_excel(p, ars, "presupuesto_demo.xlsx")
    print(f"Generado: {path}")

"""
Exporta un Presupuesto a PDF profesional usando reportlab.
Genera: portada, resumen por rubro, detalle de tareas, desglose materiales.
"""
from datetime import date
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

from .models import Presupuesto, TipoItem
from .ars_layer import ResultadoARS

# ── Paleta ────────────────────────────────────────────────────────────────────
AZUL_OSC  = colors.HexColor("#1F3864")
AZUL_MED  = colors.HexColor("#2E75B6")
AZUL_CLAR = colors.HexColor("#BDD7EE")
GRIS_CLAR = colors.HexColor("#F2F2F2")
VERDE     = colors.HexColor("#E2EFDA")
AMARILLO  = colors.HexColor("#FFEB9C")
ROJO_CLAR = colors.HexColor("#FFC7CE")
BLANCO    = colors.white
NEGRO     = colors.black

TIPO_LABELS = {
    TipoItem.MATERIAL:   "Materiales",
    TipoItem.MANO_OBRA:  "Mano de obra",
    TipoItem.MAQUINARIA: "Maquinaria/Equipos",
    TipoItem.COMP_COMP:  "Costos complementarios",
}

W, H = A4
MARGIN = 2 * cm


def _fmt_eur(v): return f"€ {v:,.2f}"
def _fmt_ars(v): return f"$ {v:,.0f}"
def _fmt_usd(v): return f"USD {v:,.0f}"
def _fmt_pct(v): return f"{v:.1f}%"


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("title", fontSize=22, textColor=BLANCO,
                                alignment=TA_CENTER, spaceAfter=4,
                                fontName="Helvetica-Bold"),
        "subtitle": ParagraphStyle("subtitle", fontSize=13, textColor=AZUL_MED,
                                   alignment=TA_CENTER, spaceAfter=6,
                                   fontName="Helvetica-Oblique"),
        "section": ParagraphStyle("section", fontSize=13, textColor=BLANCO,
                                  fontName="Helvetica-Bold", spaceAfter=6,
                                  spaceBefore=14),
        "kv_key": ParagraphStyle("kv_key", fontSize=11, textColor=AZUL_MED,
                                 fontName="Helvetica-Bold"),
        "kv_val": ParagraphStyle("kv_val", fontSize=11, textColor=NEGRO),
        "note":   ParagraphStyle("note", fontSize=8, textColor=colors.grey,
                                 fontName="Helvetica-Oblique"),
        "normal": base["Normal"],
    }


def _section_header(text: str, styles) -> list:
    """Devuelve un bloque con fondo azul oscuro para encabezados de sección."""
    tbl = Table([[Paragraph(text, styles["section"])]], colWidths=[W - 2*MARGIN])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AZUL_OSC),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
    ]))
    return [tbl, Spacer(1, 6)]


def _table_style(nrows: int, header_rows=1) -> TableStyle:
    cmds = [
        ("BACKGROUND", (0, 0), (-1, header_rows - 1), AZUL_OSC),
        ("TEXTCOLOR",  (0, 0), (-1, header_rows - 1), BLANCO),
        ("FONTNAME",   (0, 0), (-1, header_rows - 1), "Helvetica-Bold"),
        ("FONTSIZE",   (0, 0), (-1, -1), 9),
        ("ALIGN",      (0, 0), (-1, -1), "RIGHT"),
        ("ALIGN",      (0, 0), (0, -1), "CENTER"),
        ("ALIGN",      (1, 0), (1, -1), "LEFT"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CCCCCC")),
        # Filas alternas
        *[("BACKGROUND", (0, r), (-1, r), GRIS_CLAR)
          for r in range(header_rows, nrows, 2)],
        # Última fila = total
        ("BACKGROUND", (0, nrows - 1), (-1, nrows - 1), AZUL_CLAR),
        ("FONTNAME",   (0, nrows - 1), (-1, nrows - 1), "Helvetica-Bold"),
    ]
    return TableStyle(cmds)


# ── Portada ───────────────────────────────────────────────────────────────────

def _portada(p: Presupuesto, ars: ResultadoARS, styles) -> list:
    story = []

    # Bloque título
    titulo_data = [[Paragraph("PRESUPUESTO DE OBRA", styles["title"])]]
    titulo_tbl = Table(titulo_data, colWidths=[W - 2*MARGIN])
    titulo_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AZUL_OSC),
        ("TOPPADDING",    (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    story.append(titulo_tbl)
    story.append(Spacer(1, 8))
    story.append(Paragraph("[Nombre del Proyecto / Comitente]", styles["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=AZUL_MED, spaceAfter=12))

    # Datos del proyecto
    tipologia_str = p.tipologia.value.replace("_", " ").title()
    kv_data = [
        ["Tipología:",   tipologia_str,
         "Fecha:",       date.today().strftime("%d/%m/%Y")],
        ["Calidad:",     p.calidad.value.title(),
         "Arquitecto:",  "[Nombre]"],
        ["Superficie:",  f"{p.superficie:,.1f} m²",
         "Provincia:",   p.provincia],
    ]
    font_b = ("Helvetica-Bold", 10)
    font_n = ("Helvetica",      10)
    kv_tbl = Table(kv_data, colWidths=[3.5*cm, 6*cm, 3.5*cm, 6*cm])
    kv_tbl.setStyle(TableStyle([
        ("FONTNAME", (0, r), (0, r), "Helvetica-Bold") for r in range(len(kv_data))
    ] + [
        ("FONTNAME", (2, r), (2, r), "Helvetica-Bold") for r in range(len(kv_data))
    ] + [
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TEXTCOLOR", (0, 0), (0, -1), AZUL_MED),
        ("TEXTCOLOR", (2, 0), (2, -1), AZUL_MED),
    ]))
    story.append(kv_tbl)
    story.append(Spacer(1, 16))

    # Bloque de totales
    tot_data = [
        ["Concepto", "Monto", "Por m²"],
        ["Total EUR (ref. España)", _fmt_eur(p.total_eur),       _fmt_eur(p.costo_eur_por_m2)],
        ["Total USD estimado",      _fmt_usd(ars.total_usd),     _fmt_usd(ars.costo_usd_por_m2)],
        ["Total ARS estimado",      _fmt_ars(ars.total_ars),     _fmt_ars(ars.costo_ars_por_m2)],
        ["Referencia CAC",          _fmt_usd(ars.cac_ref_usd_m2 * p.superficie),
                                    _fmt_usd(ars.cac_ref_usd_m2)],
    ]
    tot_tbl = Table(tot_data, colWidths=[8*cm, 6*cm, 5*cm])
    tot_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), AZUL_OSC),
        ("TEXTCOLOR",  (0, 0), (-1, 0), BLANCO),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",   (0, 0), (-1, -1), 11),
        ("ALIGN",      (1, 0), (-1, -1), "RIGHT"),
        ("ALIGN",      (0, 0), (0, -1), "LEFT"),
        ("TOPPADDING",    (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("BACKGROUND", (0, 1), (-1, 1), AZUL_CLAR),
        ("BACKGROUND", (0, 3), (-1, 3), AZUL_CLAR),
        ("FONTNAME",   (0, 1), (-1, 1), "Helvetica-Bold"),
        ("FONTNAME",   (0, 3), (-1, 3), "Helvetica-Bold"),
    ]))
    story.append(tot_tbl)
    story.append(Spacer(1, 10))

    desvio_color = "green" if abs(ars.desviacion_cac_pct) <= 20 else "red"
    story.append(Paragraph(
        f'Desviación vs CAC: <font color="{desvio_color}"><b>{ars.desviacion_cac_pct:+.1f}%</b></font> &nbsp;|&nbsp; '
        f'Tasas: 1 EUR = USD {ars.eur_to_ars/1150:.2f} · 1 USD = ARS {int(ars.eur_to_ars/1.08):,} ({ars.fecha_tasas})',
        styles["note"]
    ))

    story.append(PageBreak())
    return story


# ── Resumen por Rubro ─────────────────────────────────────────────────────────

def _resumen_rubro(p: Presupuesto, ars: ResultadoARS, styles) -> list:
    story = _section_header("PRESUPUESTO POR RUBRO", styles)

    ars_by_code = {cod: imp for cod, _, imp in ars.tareas_ars}
    rubro_ars: dict[str, float] = {}
    for tarea in p.tareas:
        rubro_ars[tarea.rubro] = rubro_ars.get(tarea.rubro, 0) + ars_by_code.get(tarea.codigo_tarea, 0)

    rows = [["Rubro", "EUR ref.", "USD est.", "ARS est.", "%"]]
    for (letra, nombre), datos in sorted(p.por_rubro.items()):
        eur = datos["total_eur"]
        ars_v = rubro_ars.get(letra, 0)
        usd_v = round(ars_v / 1150, 0)
        pct = eur / p.total_eur * 100 if p.total_eur else 0
        rows.append([nombre, _fmt_eur(eur), _fmt_usd(usd_v), _fmt_ars(ars_v), _fmt_pct(pct)])

    rows.append(["TOTAL", _fmt_eur(p.total_eur),
                 _fmt_usd(ars.total_usd), _fmt_ars(ars.total_ars), "100%"])

    tbl = Table(rows, colWidths=[7*cm, 4*cm, 3.5*cm, 4.5*cm, 2*cm])
    tbl.setStyle(_table_style(len(rows)))
    story.append(tbl)
    story.append(Spacer(1, 16))
    return story


# ── Detalle de Tareas ─────────────────────────────────────────────────────────

def _detalle_tareas(p: Presupuesto, ars: ResultadoARS, styles) -> list:
    story = [PageBreak()]
    story += _section_header("DETALLE DE TAREAS", styles)

    ars_by_code = {cod: imp for cod, _, imp in ars.tareas_ars}
    rows = [["Código", "Descripción", "Ud.", "Cant.", "EUR/ud", "Total EUR", "Total ARS"]]

    for tarea in p.tareas:
        ars_v = ars_by_code.get(tarea.codigo_tarea, 0)
        rows.append([
            tarea.codigo_tarea,
            tarea.nombre_tarea[:45],
            tarea.unidad,
            f"{tarea.cantidad:,.2f}",
            _fmt_eur(tarea.precio_unitario_eur),
            _fmt_eur(tarea.importe_eur),
            _fmt_ars(ars_v),
        ])

    rows.append(["", "TOTAL", "", "", "", _fmt_eur(p.total_eur), _fmt_ars(ars.total_ars)])

    tbl = Table(rows, colWidths=[2*cm, 6.5*cm, 1.2*cm, 1.8*cm, 2.5*cm, 3*cm, 3.5*cm],
                repeatRows=1)
    tbl.setStyle(_table_style(len(rows)))
    story.append(tbl)
    return story


# ── Desglose Materiales ───────────────────────────────────────────────────────

def _desglose_materiales(p: Presupuesto, ars: ResultadoARS, styles) -> list:
    story = [PageBreak()]
    story += _section_header("DESGLOSE POR TIPO DE ÍTEM", styles)

    from collections import defaultdict
    eur_by_tipo: dict = defaultdict(float)
    ars_by_tipo: dict = defaultdict(float)
    ars_by_code = {cod: imp for cod, _, imp in ars.tareas_ars}

    for tarea in p.tareas:
        ars_t = ars_by_code.get(tarea.codigo_tarea, 0)
        eur_t = sum(it.importe_eur for it in tarea.items) or tarea.importe_eur
        for item in tarea.items:
            eur_by_tipo[item.tipo] += item.importe_eur
            if eur_t > 0:
                ars_by_tipo[item.tipo] += ars_t * (item.importe_eur / eur_t)

    total_eur = sum(eur_by_tipo.values()) or 1
    total_ars = sum(ars_by_tipo.values()) or 1

    rows = [["Tipo de ítem", "EUR ref.", "% EUR", "ARS est.", "% ARS"]]
    orden = [TipoItem.MATERIAL, TipoItem.MANO_OBRA, TipoItem.MAQUINARIA, TipoItem.COMP_COMP]
    for tipo in orden:
        eur = eur_by_tipo.get(tipo, 0)
        ars_v = ars_by_tipo.get(tipo, 0)
        rows.append([
            TIPO_LABELS[tipo],
            _fmt_eur(eur),
            _fmt_pct(eur / total_eur * 100),
            _fmt_ars(ars_v),
            _fmt_pct(ars_v / total_ars * 100),
        ])
    rows.append(["TOTAL", _fmt_eur(total_eur), "100%", _fmt_ars(total_ars), "100%"])

    tbl = Table(rows, colWidths=[5.5*cm, 4*cm, 2.5*cm, 4.5*cm, 2.5*cm])
    tbl.setStyle(_table_style(len(rows)))
    story.append(tbl)
    story.append(Spacer(1, 20))

    story.append(Paragraph(
        "* Los precios EUR son de referencia (España/CYPE). Los valores ARS se obtienen "
        "aplicando factores de ajuste por tipo de ítem y el tipo de cambio vigente. "
        "Actualizar tasas antes de presentar el presupuesto.",
        styles["note"]
    ))
    return story


# ── Función principal ─────────────────────────────────────────────────────────

def exportar_pdf(
    presupuesto: Presupuesto,
    resultado_ars: ResultadoARS,
    output_path: str,
) -> str:
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN,  bottomMargin=MARGIN,
        title="Presupuesto de Obra",
    )
    styles = _styles()
    story = []
    story += _portada(presupuesto, resultado_ars, styles)
    story += _resumen_rubro(presupuesto, resultado_ars, styles)
    story += _detalle_tareas(presupuesto, resultado_ars, styles)
    story += _desglose_materiales(presupuesto, resultado_ars, styles)
    doc.build(story)
    return output_path


if __name__ == "__main__":
    import sys
    sys.path.insert(0, '.')
    from motor import calcular_presupuesto, convertir_presupuesto, Tipologia, Calidad
    p   = calcular_presupuesto(Tipologia.CASA_UNIFAMILIAR, Calidad.ESTANDAR, 120.0, "Buenos Aires")
    ars = convertir_presupuesto(p)
    path = exportar_pdf(p, ars, "presupuesto_demo.pdf")
    print(f"Generado: {path}")

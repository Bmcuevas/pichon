"""
Motor de cómputo paramétrico.
Entrada:  tipología, calidad, superficie, provincia
Salida:   objeto Presupuesto con todas las tareas y sus ítems
"""
from .models import (
    Tipologia, Calidad, Geometria,
    ItemPresupuesto, TareaPresupuestada, Presupuesto, TipoItem,
)
from .geometria import calcular_geometria
from .recetas import get_receta
from . import bc3_loader

TIPO_MAP = {
    "Material":          TipoItem.MATERIAL,
    "Mano de obra":      TipoItem.MANO_OBRA,
    "Maquinaria/Equipo": TipoItem.MAQUINARIA,
    "Costes compl.":     TipoItem.COMP_COMP,
}

def _base_cantidad(base: str, geo: Geometria) -> float:
    """Convierte el nombre de la base geométrica en metros/m²/unidades."""
    mapping = {
        "superficie":    geo.superficie_cubierta,
        "muros_ext":     geo.area_muros_ext,
        "muros_int":     geo.area_muros_int,
        "cubierta":      geo.area_cubierta,
        "pisos":         geo.area_pisos,
        "zonas_humedas": geo.area_zonas_humedas,
        "cimientos_ml":  geo.ml_cimientos,
        "excav_m3":      geo.vol_excavacion,
        "pilares":       float(geo.n_pilares),
        "banos":         float(geo.n_banos),
        "fijo":          1.0,
    }
    return mapping.get(base, 0.0)


def calcular_presupuesto(
    tipologia:  Tipologia,
    calidad:    Calidad,
    superficie: float,
    provincia:  str = "Buenos Aires",
) -> Presupuesto:

    geo     = calcular_geometria(superficie, tipologia, calidad)
    receta  = get_receta(tipologia, calidad)
    tareas  = []

    for task_code, base, qty_factor, label in receta:

        # Cantidad de esta tarea en la obra
        base_val = _base_cantidad(base, geo)
        cantidad = round(base_val * qty_factor, 3)
        if cantidad <= 0:
            continue

        # Buscar datos BC3
        datos = bc3_loader.get_tarea(task_code)
        if not datos:
            # Tarea no encontrada en BC3 — insertar placeholder
            tareas.append(TareaPresupuestada(
                codigo_tarea     = task_code,
                nombre_tarea     = label,
                rubro            = task_code[0],
                nombre_rubro     = bc3_loader.get_rubro(task_code)[1],
                unidad           = "—",
                cantidad         = cantidad,
                precio_unitario_eur = 0.0,
                importe_eur      = 0.0,
                items            = [],
            ))
            continue

        precio_unit = datos["total"]
        importe     = round(cantidad * precio_unit, 2)
        rubro, nombre_rubro = bc3_loader.get_rubro(task_code)

        # Construir ítems
        items = []
        for it in datos["items"]:
            tipo_str = it.get("tipo", "")
            tipo = TIPO_MAP.get(tipo_str, TipoItem.MATERIAL)
            it_qty    = round(it["qty"] * cantidad, 4)
            it_amount = round(it["unit_price"] * it_qty, 4)
            items.append(ItemPresupuesto(
                tipo             = tipo,
                codigo           = it["code"],
                descripcion      = it["desc"],
                unidad           = it["unit"],
                cantidad         = it_qty,
                precio_unitario_eur = it["unit_price"],
                importe_eur      = it_amount,
            ))

        tareas.append(TareaPresupuestada(
            codigo_tarea        = task_code,
            nombre_tarea        = datos["desc"] or label,
            rubro               = rubro,
            nombre_rubro        = nombre_rubro,
            unidad              = datos["unit"],
            cantidad            = cantidad,
            precio_unitario_eur = precio_unit,
            importe_eur         = importe,
            items               = items,
        ))

    return Presupuesto(
        tipologia  = tipologia,
        calidad    = calidad,
        superficie = superficie,
        provincia  = provincia,
        geometria  = geo,
        tareas     = tareas,
    )

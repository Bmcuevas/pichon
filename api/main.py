"""API FastAPI para el motor paramétrico de presupuestos de obra."""
import sys, os, tempfile
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'vendor'))

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from motor import calcular_presupuesto, convertir_presupuesto, actualizar_tasas, TASAS
from motor.export_excel import exportar_excel
from motor.export_pdf   import exportar_pdf
from motor.ars_layer    import eur_to_ars as calc_eur_ars

from .schemas import (
    PresupuestoRequest, PresupuestoOut, GeometriaOut,
    TareaOut, ItemOut, RubroOut, ARSOut,
    TasasIn, TasasOut,
)

app = FastAPI(
    title="Motor de Presupuestos de Obra",
    description="Genera presupuestos paramétricos de construcción para Argentina "
                "usando la base BC3/CYPE como referencia de rendimientos.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helper: armar respuesta ────────────────────────────────────────────────────

def _build_response(p, ars) -> PresupuestoOut:
    ars_by_code = {cod: imp for cod, _, imp in ars.tareas_ars}
    usd_ars = TASAS["usd_ars"]

    # Rubros
    rubro_ars: dict[str, float] = {}
    for tarea in p.tareas:
        rubro_ars[tarea.rubro] = rubro_ars.get(tarea.rubro, 0) + ars_by_code.get(tarea.codigo_tarea, 0)

    rubros_out = []
    for (letra, nombre), datos in sorted(p.por_rubro.items()):
        eur = datos["total_eur"]
        ars_v = rubro_ars.get(letra, 0)
        rubros_out.append(RubroOut(
            letra      = letra,
            nombre     = nombre,
            total_eur  = round(eur, 2),
            total_ars  = round(ars_v, 0),
            total_usd  = round(ars_v / usd_ars, 0),
            porcentaje = round(eur / p.total_eur * 100, 1) if p.total_eur else 0,
        ))

    # Tareas
    tareas_out = []
    for tarea in p.tareas:
        ars_v = ars_by_code.get(tarea.codigo_tarea, 0)
        items_out = [ItemOut(
            tipo                = it.tipo.value,
            codigo              = it.codigo,
            descripcion         = it.descripcion,
            unidad              = it.unidad,
            cantidad            = it.cantidad,
            precio_unitario_eur = it.precio_unitario_eur,
            importe_eur         = it.importe_eur,
        ) for it in tarea.items]

        tareas_out.append(TareaOut(
            codigo_tarea        = tarea.codigo_tarea,
            nombre_tarea        = tarea.nombre_tarea,
            rubro               = tarea.rubro,
            nombre_rubro        = tarea.nombre_rubro,
            unidad              = tarea.unidad,
            cantidad            = tarea.cantidad,
            precio_unitario_eur = tarea.precio_unitario_eur,
            importe_eur         = tarea.importe_eur,
            importe_ars         = round(ars_v, 0),
            importe_usd         = round(ars_v / usd_ars, 0),
            items               = items_out,
        ))

    geo = p.geometria
    return PresupuestoOut(
        tipologia        = p.tipologia.value,
        calidad          = p.calidad.value,
        superficie       = p.superficie,
        provincia        = p.provincia,
        total_eur        = round(p.total_eur, 2),
        costo_eur_por_m2 = round(p.costo_eur_por_m2, 2),
        geometria        = GeometriaOut(
            superficie_cubierta = geo.superficie_cubierta,
            perimetro           = geo.perimetro,
            area_muros_ext      = geo.area_muros_ext,
            area_muros_int      = geo.area_muros_int,
            area_cubierta       = geo.area_cubierta,
            area_pisos          = geo.area_pisos,
            area_zonas_humedas  = geo.area_zonas_humedas,
            ml_cimientos        = geo.ml_cimientos,
            vol_excavacion      = geo.vol_excavacion,
            n_banos             = geo.n_banos,
            n_pilares           = geo.n_pilares,
        ),
        rubros  = rubros_out,
        tareas  = tareas_out,
        ars     = ARSOut(
            total_ars          = ars.total_ars,
            total_usd          = ars.total_usd,
            costo_ars_por_m2   = ars.costo_ars_por_m2,
            costo_usd_por_m2   = ars.costo_usd_por_m2,
            cac_ref_usd_m2     = ars.cac_ref_usd_m2,
            desviacion_cac_pct = ars.desviacion_cac_pct,
            eur_to_ars         = ars.eur_to_ars,
            fecha_tasas        = ars.fecha_tasas,
            alerta             = ars.alerta_desviacion,
        ),
    )


# ── Rutas ─────────────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "version": app.version}


@app.post("/presupuesto", response_model=PresupuestoOut, tags=["presupuesto"])
def calcular(req: PresupuestoRequest):
    """Calcula el presupuesto paramétrico y retorna JSON completo."""
    try:
        p   = calcular_presupuesto(req.tipologia, req.calidad, req.superficie, req.provincia)
        ars = convertir_presupuesto(p)
        return _build_response(p, ars)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/presupuesto/excel", tags=["presupuesto"])
def descargar_excel(req: PresupuestoRequest):
    """Genera y descarga el presupuesto en formato Excel (.xlsx)."""
    try:
        p   = calcular_presupuesto(req.tipologia, req.calidad, req.superficie, req.provincia)
        ars = convertir_presupuesto(p)
        tmp = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
        tmp.close()
        exportar_excel(p, ars, tmp.name)
        filename = f"presupuesto_{req.tipologia.value}_{req.calidad.value}_{int(req.superficie)}m2.xlsx"
        return FileResponse(
            tmp.name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=filename,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/presupuesto/pdf", tags=["presupuesto"])
def descargar_pdf(req: PresupuestoRequest):
    """Genera y descarga el presupuesto en formato PDF."""
    try:
        p   = calcular_presupuesto(req.tipologia, req.calidad, req.superficie, req.provincia)
        ars = convertir_presupuesto(p)
        tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        tmp.close()
        exportar_pdf(p, ars, tmp.name)
        filename = f"presupuesto_{req.tipologia.value}_{req.calidad.value}_{int(req.superficie)}m2.pdf"
        return FileResponse(tmp.name, media_type="application/pdf", filename=filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasas", response_model=TasasOut, tags=["configuracion"])
def get_tasas():
    """Retorna las tasas de cambio actuales."""
    return TasasOut(
        eur_usd    = TASAS["eur_usd"],
        usd_ars    = TASAS["usd_ars"],
        fecha      = TASAS["fecha"],
        eur_to_ars = calc_eur_ars(),
    )


@app.put("/tasas", response_model=TasasOut, tags=["configuracion"])
def set_tasas(tasas: TasasIn):
    """Actualiza las tasas de cambio en memoria (vigente hasta reiniciar el server)."""
    actualizar_tasas(tasas.eur_usd, tasas.usd_ars, tasas.fecha)
    return TasasOut(
        eur_usd    = tasas.eur_usd,
        usd_ars    = tasas.usd_ars,
        fecha      = tasas.fecha,
        eur_to_ars = calc_eur_ars(),
    )

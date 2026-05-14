"""Schemas Pydantic para request/response de la API."""
from pydantic import BaseModel, Field
from typing import Optional
from motor.models import Tipologia, Calidad


class PresupuestoRequest(BaseModel):
    tipologia:  Tipologia = Field(..., example="casa_unifamiliar")
    calidad:    Calidad   = Field(..., example="estandar")
    superficie: float     = Field(..., gt=0, le=50000, example=120.0)
    provincia:  str       = Field("Buenos Aires", example="Buenos Aires")

    model_config = {"json_schema_extra": {"example": {
        "tipologia":  "casa_unifamiliar",
        "calidad":    "estandar",
        "superficie": 120.0,
        "provincia":  "Buenos Aires",
    }}}


class GeometriaOut(BaseModel):
    superficie_cubierta: float
    perimetro:           float
    area_muros_ext:      float
    area_muros_int:      float
    area_cubierta:       float
    area_pisos:          float
    area_zonas_humedas:  float
    ml_cimientos:        float
    vol_excavacion:      float
    n_banos:             int
    n_pilares:           int


class ItemOut(BaseModel):
    tipo:                str
    codigo:              str
    descripcion:         str
    unidad:              str
    cantidad:            float
    precio_unitario_eur: float
    importe_eur:         float


class TareaOut(BaseModel):
    codigo_tarea:        str
    nombre_tarea:        str
    rubro:               str
    nombre_rubro:        str
    unidad:              str
    cantidad:            float
    precio_unitario_eur: float
    importe_eur:         float
    importe_ars:         float
    importe_usd:         float
    items:               list[ItemOut]


class RubroOut(BaseModel):
    letra:      str
    nombre:     str
    total_eur:  float
    total_ars:  float
    total_usd:  float
    porcentaje: float


class ARSOut(BaseModel):
    total_ars:          float
    total_usd:          float
    costo_ars_por_m2:   float
    costo_usd_por_m2:   float
    cac_ref_usd_m2:     float
    desviacion_cac_pct: float
    eur_to_ars:         float
    fecha_tasas:        str
    alerta:             str


class PresupuestoOut(BaseModel):
    tipologia:       str
    calidad:         str
    superficie:      float
    provincia:       str
    geometria:       GeometriaOut
    total_eur:       float
    costo_eur_por_m2:float
    rubros:          list[RubroOut]
    tareas:          list[TareaOut]
    ars:             ARSOut


class TasasIn(BaseModel):
    eur_usd: float = Field(..., gt=0, example=1.08)
    usd_ars: float = Field(..., gt=0, example=1150.0)
    fecha:   str   = Field(..., example="2026-05")


class TasasOut(BaseModel):
    eur_usd:  float
    usd_ars:  float
    fecha:    str
    eur_to_ars: float

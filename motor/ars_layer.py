"""
Capa de precios ARS para Argentina.

Los rendimientos del BC3 España (horas, kg, m³ por unidad) son válidos en Argentina.
Los PRECIOS UNITARIOS se ajustan mediante:
  1. Factores por tipo de ítem (materiales, mano de obra, maquinaria)
  2. Tipo de cambio EUR → USD → ARS

Actualizar TASAS y FACTORES_TIPO periódicamente.
La referencia CAC sirve para validar que el resultado está en rango.
"""
from dataclasses import dataclass, field
from datetime import date
from .models import TipoItem, Presupuesto, TareaPresupuestada, ItemPresupuesto, Tipologia, Calidad


# ── Tasas de cambio ────────────────────────────────────────────────────────────
# Actualizar al momento de generar el presupuesto.
TASAS = {
    "eur_usd":  1.08,      # EUR → USD (mercado internacional)
    "usd_ars":  1150.0,    # USD → ARS (tipo cambio libre / blue)
    "fecha":    "2026-05",
}

# ── Factores de ajuste por tipo de ítem ───────────────────────────────────────
# Relación precio unitario Argentina / precio unitario España, en la misma divisa.
# Mano de obra Argentina (~€4-7/h UOCRA vs ~€23/h España) → ~0.25-0.30
# Materiales locales ligeramente más baratos, importados similares → ~0.65-0.75
FACTORES_TIPO = {
    TipoItem.MATERIAL:   0.70,
    TipoItem.MANO_OBRA:  0.30,
    TipoItem.MAQUINARIA: 0.45,
    TipoItem.COMP_COMP:  0.50,
}

# ── Índice CAC (referencia de validación) ─────────────────────────────────────
# Fuente: Cámara Argentina de la Construcción — www.camararg.com.ar
# Valores aproximados en USD/m² (al tipo libre). Actualizar mensualmente.
CAC_REF_USD_M2 = {
    Tipologia.CASA_UNIFAMILIAR: {
        Calidad.ECONOMICA: 320,
        Calidad.ESTANDAR:  500,
        Calidad.PREMIUM:   850,
    },
    Tipologia.DEPARTAMENTO: {
        Calidad.ECONOMICA: 300,
        Calidad.ESTANDAR:  480,
        Calidad.PREMIUM:   800,
    },
    Tipologia.LOCAL_COMERCIAL: {
        Calidad.ECONOMICA: 220,
        Calidad.ESTANDAR:  380,
        Calidad.PREMIUM:   600,
    },
    Tipologia.OFICINA: {
        Calidad.ECONOMICA: 250,
        Calidad.ESTANDAR:  420,
        Calidad.PREMIUM:   700,
    },
    Tipologia.GALPON: {
        Calidad.ECONOMICA: 150,
        Calidad.ESTANDAR:  220,
        Calidad.PREMIUM:   350,
    },
}

# Mes de referencia del índice CAC
CAC_FECHA_REF = "2025-06"


@dataclass
class ResultadoARS:
    total_ars:          float
    total_usd:          float
    costo_ars_por_m2:   float
    costo_usd_por_m2:   float
    cac_ref_usd_m2:     float     # referencia CAC para validación
    desviacion_cac_pct: float     # % desviación vs referencia CAC
    eur_to_ars:         float     # tasa efectiva usada
    fecha_tasas:        str
    tareas_ars:         list      # lista de (codigo, nombre, importe_ars)

    @property
    def alerta_desviacion(self) -> str:
        """Devuelve '' si ok, o mensaje de alerta si la desviación es grande."""
        if abs(self.desviacion_cac_pct) > 30:
            dir_ = "sobre" if self.desviacion_cac_pct > 0 else "bajo"
            return (f"ALERTA: estimado {abs(self.desviacion_cac_pct):.0f}% "
                    f"{dir_} referencia CAC. Revisar tasas y factores.")
        return ""


def eur_to_ars(tasas: dict | None = None) -> float:
    """Devuelve el tipo de cambio efectivo EUR → ARS."""
    t = tasas or TASAS
    return t["eur_usd"] * t["usd_ars"]


def convertir_presupuesto(
    presupuesto: Presupuesto,
    tasas: dict | None = None,
    factores_tipo: dict | None = None,
) -> ResultadoARS:
    """
    Convierte un Presupuesto (en EUR referencia España) a ARS argentinos.

    Aplica FACTORES_TIPO por ítem para ajustar precios unitarios,
    luego multiplica por el tipo de cambio EUR → ARS.
    """
    t = tasas or TASAS
    ft = factores_tipo or FACTORES_TIPO
    rate = eur_to_ars(t)

    total_ars = 0.0
    tareas_ars = []

    for tarea in presupuesto.tareas:
        importe_tarea_ars = 0.0

        if tarea.items:
            for item in tarea.items:
                factor = ft.get(item.tipo, 0.50)
                importe_tarea_ars += item.importe_eur * factor * rate
        else:
            # Tarea sin desglose de ítems (placeholder BC3 faltante)
            # Usar factor promedio ponderado aproximado
            importe_tarea_ars += tarea.importe_eur * 0.55 * rate

        importe_tarea_ars = round(importe_tarea_ars, 0)
        total_ars += importe_tarea_ars
        tareas_ars.append((
            tarea.codigo_tarea,
            tarea.nombre_tarea,
            importe_tarea_ars,
        ))

    total_ars = round(total_ars, 0)
    total_usd = round(total_ars / t["usd_ars"], 0)
    sup = presupuesto.superficie

    cac_usd = (CAC_REF_USD_M2
               .get(presupuesto.tipologia, {})
               .get(presupuesto.calidad, 0))
    cac_total_usd = cac_usd * sup
    desviacion = ((total_usd - cac_total_usd) / cac_total_usd * 100
                  if cac_total_usd else 0.0)

    return ResultadoARS(
        total_ars         = total_ars,
        total_usd         = total_usd,
        costo_ars_por_m2  = round(total_ars / sup, 0),
        costo_usd_por_m2  = round(total_usd / sup, 0),
        cac_ref_usd_m2    = cac_usd,
        desviacion_cac_pct= round(desviacion, 1),
        eur_to_ars        = rate,
        fecha_tasas       = t["fecha"],
        tareas_ars        = tareas_ars,
    )


def actualizar_tasas(eur_usd: float, usd_ars: float, fecha: str) -> None:
    """Actualiza las tasas globales en memoria (sin persistencia)."""
    TASAS["eur_usd"] = eur_usd
    TASAS["usd_ars"] = usd_ars
    TASAS["fecha"]   = fecha

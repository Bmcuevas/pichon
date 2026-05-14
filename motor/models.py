"""
Estructuras de datos del motor paramétrico.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class Tipologia(str, Enum):
    CASA_UNIFAMILIAR  = "casa_unifamiliar"
    DEPARTAMENTO      = "departamento"
    LOCAL_COMERCIAL   = "local_comercial"
    OFICINA           = "oficina"
    GALPON            = "galpon"


class Calidad(str, Enum):
    ECONOMICA = "economica"   # materiales básicos, mano de obra simple
    ESTANDAR  = "estandar"    # terminaciones medias, lo más común
    PREMIUM   = "premium"     # materiales de primera, mayor complejidad


class TipoItem(str, Enum):
    MATERIAL  = "mt"
    MANO_OBRA = "mo"
    MAQUINARIA = "mq"
    COMP_COMP  = "%"


@dataclass
class Geometria:
    """Medidas derivadas de la superficie total."""
    superficie_cubierta: float       # m² — input del usuario
    perimetro: float                 # ml — perímetro exterior estimado
    area_muros_ext: float            # m² — muros de fachada
    area_muros_int: float            # m² — tabiques interiores
    area_cubierta: float             # m² — cubierta/techo
    area_pisos: float                # m² — pavimentos interiores
    area_zonas_humedas: float        # m² — baños + cocina
    ml_cimientos: float              # ml — longitud de cimientos
    vol_excavacion: float            # m³ — volumen de excavación
    n_banos: int                     # cantidad estimada de baños
    n_pilares: int                   # cantidad estimada de pilares


@dataclass
class ItemPresupuesto:
    """Una línea del presupuesto — un ítem de una tarea."""
    tipo: TipoItem
    codigo: str
    descripcion: str
    unidad: str
    cantidad: float
    precio_unitario_eur: float
    importe_eur: float
    precio_unitario_ars: Optional[float] = None
    importe_ars: Optional[float] = None


@dataclass
class TareaPresupuestada:
    """Una tarea con su cantidad y su descomposición en ítems."""
    codigo_tarea: str
    nombre_tarea: str
    rubro: str                        # capítulo (A, C, E, F...)
    nombre_rubro: str
    unidad: str
    cantidad: float                   # cantidad de esta tarea en la obra
    precio_unitario_eur: float
    importe_eur: float
    items: list[ItemPresupuesto] = field(default_factory=list)
    precio_unitario_ars: Optional[float] = None
    importe_ars: Optional[float] = None


@dataclass
class Presupuesto:
    """Resultado final del cómputo paramétrico."""
    tipologia: Tipologia
    calidad: Calidad
    superficie: float
    provincia: str
    geometria: Geometria
    tareas: list[TareaPresupuestada] = field(default_factory=list)

    @property
    def total_eur(self) -> float:
        return sum(t.importe_eur for t in self.tareas)

    @property
    def total_ars(self) -> Optional[float]:
        totales = [t.importe_ars for t in self.tareas if t.importe_ars is not None]
        return sum(totales) if totales else None

    @property
    def por_rubro(self) -> dict:
        rubros = {}
        for t in self.tareas:
            k = (t.rubro, t.nombre_rubro)
            if k not in rubros:
                rubros[k] = {"tareas": [], "total_eur": 0.0}
            rubros[k]["tareas"].append(t)
            rubros[k]["total_eur"] += t.importe_eur
        return rubros

    @property
    def costo_eur_por_m2(self) -> float:
        return self.total_eur / self.superficie if self.superficie else 0

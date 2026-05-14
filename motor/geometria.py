"""
Modelo geométrico paramétrico.
A partir de la superficie cubierta, deriva todas las medidas
necesarias para cuantificar las tareas de obra.

Las fórmulas están basadas en:
- Ratios publicados por CAPSF y CAPBA para tipologías residenciales
- Proporciones típicas de plantas argentinas (forma rectangular,
  relación largo/ancho ~1.5:1)
- Bibliografía: Neufert, Plazola, y práctica local argentina
"""
import math
from .models import Geometria, Tipologia, Calidad


# ── Factores geométricos por tipología ────────────────────────────────────────
# Todos los factores son relativos a la superficie cubierta (S)

FACTORES = {
    Tipologia.CASA_UNIFAMILIAR: {
        # Planta típica rectangular 1.4:1 — perímetro ≈ 4.2 * sqrt(S)
        "factor_perimetro":       4.2,
        "altura_muros":           2.8,    # m
        "factor_muros_int":       1.8,    # m² de tabique interior / m² cubierto
        "factor_cubierta":        1.12,   # inclinada con pequeño alero
        "factor_pisos":           1.00,
        "factor_zonas_humedas":   0.15,
        "prof_excavacion":        0.70,   # m — zapata corrida superficial
        "ancho_excavacion":       0.60,   # m
        "banos_por_100m2":        1.0,
        "pilares_por_100m2":      4.0,
        Calidad.ECONOMICA: {
            "factor_muros_ext_opaco": 0.75,   # % del área de fachada que es muro
            "factor_muros_ext_vidrio": 0.10,
        },
        Calidad.ESTANDAR: {
            "factor_muros_ext_opaco": 0.70,
            "factor_muros_ext_vidrio": 0.15,
        },
        Calidad.PREMIUM: {
            "factor_muros_ext_opaco": 0.60,
            "factor_muros_ext_vidrio": 0.25,
        },
    },
    Tipologia.DEPARTAMENTO: {
        "factor_perimetro":       3.8,    # plantas más compactas en edificios
        "altura_muros":           2.65,
        "factor_muros_int":       2.2,    # más tabiques por programa
        "factor_cubierta":        0.0,    # no tiene cubierta propia
        "factor_pisos":           1.00,
        "factor_zonas_humedas":   0.18,
        "prof_excavacion":        0.0,    # no aplica para depto individual
        "ancho_excavacion":       0.0,
        "banos_por_100m2":        1.2,
        "pilares_por_100m2":      3.0,
        Calidad.ECONOMICA:  {"factor_muros_ext_opaco": 0.80, "factor_muros_ext_vidrio": 0.08},
        Calidad.ESTANDAR:   {"factor_muros_ext_opaco": 0.72, "factor_muros_ext_vidrio": 0.14},
        Calidad.PREMIUM:    {"factor_muros_ext_opaco": 0.55, "factor_muros_ext_vidrio": 0.30},
    },
    Tipologia.LOCAL_COMERCIAL: {
        "factor_perimetro":       4.0,
        "altura_muros":           3.50,
        "factor_muros_int":       0.5,    # pocos tabiques
        "factor_cubierta":        1.05,
        "factor_pisos":           1.00,
        "factor_zonas_humedas":   0.06,
        "prof_excavacion":        0.50,
        "ancho_excavacion":       0.50,
        "banos_por_100m2":        0.5,
        "pilares_por_100m2":      2.0,
        Calidad.ECONOMICA:  {"factor_muros_ext_opaco": 0.60, "factor_muros_ext_vidrio": 0.30},
        Calidad.ESTANDAR:   {"factor_muros_ext_opaco": 0.50, "factor_muros_ext_vidrio": 0.40},
        Calidad.PREMIUM:    {"factor_muros_ext_opaco": 0.35, "factor_muros_ext_vidrio": 0.55},
    },
    Tipologia.OFICINA: {
        "factor_perimetro":       3.9,
        "altura_muros":           2.80,
        "factor_muros_int":       1.5,
        "factor_cubierta":        0.0,
        "factor_pisos":           1.00,
        "factor_zonas_humedas":   0.08,
        "prof_excavacion":        0.0,
        "ancho_excavacion":       0.0,
        "banos_por_100m2":        0.6,
        "pilares_por_100m2":      3.0,
        Calidad.ECONOMICA:  {"factor_muros_ext_opaco": 0.65, "factor_muros_ext_vidrio": 0.20},
        Calidad.ESTANDAR:   {"factor_muros_ext_opaco": 0.55, "factor_muros_ext_vidrio": 0.30},
        Calidad.PREMIUM:    {"factor_muros_ext_opaco": 0.40, "factor_muros_ext_vidrio": 0.45},
    },
    Tipologia.GALPON: {
        "factor_perimetro":       3.6,
        "altura_muros":           5.00,
        "factor_muros_int":       0.1,
        "factor_cubierta":        1.08,
        "factor_pisos":           1.00,
        "factor_zonas_humedas":   0.03,
        "prof_excavacion":        0.40,
        "ancho_excavacion":       0.40,
        "banos_por_100m2":        0.2,
        "pilares_por_100m2":      1.5,
        Calidad.ECONOMICA:  {"factor_muros_ext_opaco": 0.85, "factor_muros_ext_vidrio": 0.05},
        Calidad.ESTANDAR:   {"factor_muros_ext_opaco": 0.80, "factor_muros_ext_vidrio": 0.08},
        Calidad.PREMIUM:    {"factor_muros_ext_opaco": 0.70, "factor_muros_ext_vidrio": 0.15},
    },
}


def calcular_geometria(superficie: float, tipologia: Tipologia,
                       calidad: Calidad) -> Geometria:
    """
    Deriva todas las medidas geométricas del edificio a partir
    de la superficie cubierta total.
    """
    f = FACTORES[tipologia]
    fc = f[calidad]
    S = superficie

    perimetro      = f["factor_perimetro"] * math.sqrt(S)
    area_fachada   = perimetro * f["altura_muros"]
    area_muros_ext = area_fachada * fc["factor_muros_ext_opaco"]
    area_muros_int = S * f["factor_muros_int"]
    area_cubierta  = S * f["factor_cubierta"]
    area_pisos     = S * f["factor_pisos"]
    area_zh        = S * f["factor_zonas_humedas"]

    # Cimientos: solo tipologías con excavación propia
    ml_cimientos  = perimetro if f["prof_excavacion"] > 0 else 0.0
    vol_excav     = (ml_cimientos * f["ancho_excavacion"]
                     * f["prof_excavacion"])

    n_banos  = max(1, round(S * f["banos_por_100m2"] / 100))
    n_pilares = max(2, round(S * f["pilares_por_100m2"] / 100))

    return Geometria(
        superficie_cubierta = S,
        perimetro           = round(perimetro, 2),
        area_muros_ext      = round(area_muros_ext, 2),
        area_muros_int      = round(area_muros_int, 2),
        area_cubierta       = round(area_cubierta, 2),
        area_pisos          = round(area_pisos, 2),
        area_zonas_humedas  = round(area_zh, 2),
        ml_cimientos        = round(ml_cimientos, 2),
        vol_excavacion      = round(vol_excav, 2),
        n_banos             = n_banos,
        n_pilares           = n_pilares,
    )

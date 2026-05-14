"""
Recetas paramétricas: mapeo de tipología + calidad → tareas de obra.

Cada receta es una lista de entradas con la forma:
    (codigo_tarea, base_geometrica, cantidad_por_unidad, descripcion_corta)

Donde base_geometrica puede ser:
    "superficie"    → m² cubiertos totales
    "muros_ext"     → m² de muros exteriores
    "muros_int"     → m² de tabiques interiores
    "cubierta"      → m² de cubierta
    "pisos"         → m² de pisos interiores
    "zonas_humedas" → m² de baños + cocina
    "cimientos_ml"  → metros lineales de cimientos
    "excav_m3"      → m³ de excavación
    "pilares"       → cantidad de pilares (unidades)
    "banos"         → cantidad de baños (unidades)
    "fijo"          → cantidad fija sin importar la superficie
"""
from .models import Tipologia, Calidad

# Formato: (task_code, base, qty_factor, label)
# qty_factor: cuántas unidades de la tarea por unidad de la base geométrica

RECETAS = {

    # ──────────────────────────────────────────────────────────────────────
    Tipologia.CASA_UNIFAMILIAR: {

        Calidad.ECONOMICA: [
            # Actuaciones previas
            ("ADL005", "superficie",    0.003, "Desbroce del terreno"),
            # Cimentaciones
            ("ADD010", "excav_m3",      1.0,   "Desmonte/excavación"),
            ("ANS010", "superficie",    1.0,   "Solera de hormigón"),
            ("CSV010", "cimientos_ml",  1.0,   "Zapata corrida"),
            # Estructura
            ("EHU010", "superficie",    0.0,   "Forjado (planta baja sin forjado)"),
            ("EHS010", "pilares",       3.0,   "Pilares HA (m³ x pilar)"),
            # Fachadas y tabiques
            ("FFX010", "muros_ext",     1.0,   "Hoja exterior ladrillo cara vista"),
            ("FFP010", "muros_int",     1.0,   "Tabique ladrillo hueco"),
            # Cubierta
            ("QTT210", "cubierta",      1.0,   "Cubierta inclinada teja cerámica"),
            # Carpintería (Ud/m²: ~6 ventanas y ~7 puertas por 120m²)
            ("LCL060", "superficie",    0.050, "Ventanas aluminio básico"),
            ("LPM010", "superficie",    0.060, "Puertas interiores madera"),
            # Revestimientos exteriores
            ("RFF010", "muros_ext",     0.6,   "Pintura exterior"),
            # Revestimientos interiores
            ("RPG015", "muros_int",     1.0,   "Enlucido yeso interior"),
            ("RIP030", "muros_int",     0.8,   "Pintura interior"),
            # Pavimentos
            ("RSG110", "pisos",         1.0,   "Pavimento cerámico básico"),
            # Instalaciones eléctricas
            ("IEP010", "superficie",    0.012, "Red toma tierra"),
            ("IEI001", "superficie",    3.0,   "Circuitos monofásicos empotrados (ml)"),
            ("IEM020", "superficie",    0.06,  "Interruptores empotrados"),
            ("IEM060", "superficie",    0.10,  "Bases toma de corriente"),
            # Instalaciones fontanería
            ("IFB010", "fijo",          1.0,   "Alimentación agua potable"),
            ("IFI005", "superficie",    1.0,   "Tuberías instalación interior (ml)"),
            ("IFI010", "banos",         1.0,   "Instalación interior baño"),
            ("IFI012", "fijo",          1.0,   "Instalación cocina"),
            ("ISS010", "banos",         1.0,   "Colector evacuación"),
            # Sanitarios
            ("SAI020", "banos",         1.0,   "Inodoro básico"),
            ("SAL020", "banos",         1.0,   "Lavabo básico"),
            ("SAD005", "banos",         0.5,   "Ducha básica"),
            # Cocina
            ("SCF010", "fijo",          1.0,   "Fregadero cocina"),
        ],

        Calidad.ESTANDAR: [
            # Actuaciones previas
            ("ADL005", "superficie",    0.003, "Desbroce del terreno"),
            # Cimentaciones
            ("ADD010", "excav_m3",      1.0,   "Excavación"),
            ("ANS010", "superficie",    1.0,   "Solera hormigón armado"),
            ("CSV010", "cimientos_ml",  1.0,   "Zapata corrida HA"),
            # Estructura
            ("EHU010", "superficie",    0.0,   "Forjado (planta baja)"),
            ("EHS010", "pilares",       3.0,   "Pilares HA"),
            # Fachadas
            ("FFX010", "muros_ext",     0.7,   "Hoja exterior ladrillo"),
            ("FFP010", "muros_int",     1.0,   "Tabique cerámico"),
            ("NAF010", "muros_ext",     0.7,   "Aislamiento térmico fachada"),
            # Cubierta
            ("QTT210", "cubierta",      1.0,   "Cubierta inclinada teja cerámica"),
            # Carpintería (Ud/m²: ~8 ventanas y ~8 puertas por 120m²)
            ("LCL060", "superficie",    0.065, "Ventanas aluminio rotura puente"),
            ("LPM010", "superficie",    0.068, "Puertas interiores tablero"),
            ("LEA010", "fijo",          1.0,   "Puerta entrada"),
            # Revestimientos ext
            ("RFF010", "muros_ext",     0.6,   "Pintura exterior siloxano"),
            # Revestimientos int
            ("RPG015", "muros_int",     1.0,   "Enlucido yeso"),
            ("RIP030", "muros_int",     1.0,   "Pintura interior plástica"),
            ("RAA010", "zonas_humedas", 3.0,   "Alicatado cerámico baños"),
            # Pavimentos
            ("RSG120", "pisos",         0.7,   "Pavimento gres porcelánico"),
            ("RSG110", "zonas_humedas", 0.3,   "Pavimento cerámico baños"),
            # Electricidad — circuitos por metro lineal + mecanismos por unidad
            ("IEP010", "superficie",    0.012, "Red toma tierra"),
            ("IEC010", "fijo",          1.0,   "Caja de protección y medida"),
            ("IEI001", "superficie",    3.5,   "Circuitos monofásicos empotrados (ml)"),
            ("IEI006", "superficie",    0.15,  "Cajas de derivación"),
            ("IEM020", "superficie",    0.08,  "Interruptores empotrados"),
            ("IEM060", "superficie",    0.12,  "Bases de toma de corriente"),
            ("IEX060", "fijo",          2.0,   "Interruptores diferenciales"),
            ("IEX050", "fijo",          4.0,   "Interruptores magnetotérmicos"),
            # Fontanería
            ("IFB010", "fijo",          1.0,   "Alimentación agua potable"),
            ("IFI005", "superficie",    1.2,   "Tuberías instalación interior (ml)"),
            ("IFI010", "banos",         1.0,   "Instalación interior por baño"),
            ("IFI012", "fijo",          1.0,   "Instalación cocina"),
            # Evacuación
            ("ISS010", "banos",         1.0,   "Colector evacuación por baño"),
            # Calefacción — radiadores individuales
            ("ICE040", "banos",         2.0,   "Radiadores"),
            ("ICS010", "superficie",    0.4,   "Tuberías distribución calefacción (ml)"),
            # Sanitarios
            ("SAI020", "banos",         1.0,   "Inodoro estándar"),
            ("SAL020", "banos",         1.0,   "Lavabo estándar"),
            ("SAD005", "banos",         0.5,   "Plato ducha"),
            ("SAB005", "banos",         0.3,   "Bañera acrílica"),
            # Cocina
            ("SCF010", "fijo",          1.0,   "Fregadero cocina"),
            ("SCE030", "fijo",          1.0,   "Placa encimera cocina"),
        ],

        Calidad.PREMIUM: [
            # Actuaciones previas
            ("ADL005", "superficie",    0.003, "Desbroce"),
            # Cimentaciones
            ("ADD010", "excav_m3",      1.0,   "Excavación"),
            ("ANS010", "superficie",    1.0,   "Solera HA"),
            ("CSV010", "cimientos_ml",  1.0,   "Zapata corrida HA"),
            # Estructura
            ("EHU010", "superficie",    0.0,   "Forjado"),
            ("EHS010", "pilares",       3.5,   "Pilares HA"),
            # Fachadas
            ("FFX010", "muros_ext",     0.5,   "Hoja exterior ladrillo"),
            ("FFP010", "muros_int",     1.0,   "Tabique cerámico"),
            ("NAF010", "muros_ext",     0.7,   "Aislamiento térmico premium"),
            # Cubierta
            ("QTT220", "cubierta",      1.0,   "Cubierta inclinada pizarra"),
            # Carpintería (Ud/m²: ~10 ventanas y ~9 puertas por 120m²)
            ("LCL060", "superficie",    0.080, "Ventanas aluminio triple vidrio"),
            ("LPM010", "superficie",    0.075, "Puertas interiores macizas"),
            ("LEA020", "fijo",          1.0,   "Puerta entrada blindada"),
            # Revestimientos
            ("RFM010", "muros_ext",     0.6,   "Pintura exterior silicato"),
            ("RPG015", "muros_int",     1.0,   "Enlucido yeso"),
            ("RIP035", "muros_int",     1.0,   "Pintura interior premium"),
            ("RAA040", "zonas_humedas", 3.5,   "Alicatado porcelánico gran formato"),
            # Pavimentos
            ("RSG130", "pisos",         0.6,   "Pavimento porcelánico técnico"),
            ("RSG120", "zonas_humedas", 0.3,   "Pavimento gres baños"),
            ("RSG160", "pisos",         0.2,   "Pavimento gres rústico/natural"),
            # Electricidad
            ("IEP010", "superficie",    0.012, "Red toma tierra"),
            ("IEC010", "fijo",          1.0,   "Caja de protección y medida"),
            ("IEI001", "superficie",    4.5,   "Circuitos monofásicos empotrados (ml)"),
            ("IEI006", "superficie",    0.20,  "Cajas de derivación"),
            ("IEM020", "superficie",    0.10,  "Interruptores empotrados"),
            ("IEM060", "superficie",    0.15,  "Bases toma de corriente"),
            ("IEX060", "fijo",          3.0,   "Interruptores diferenciales"),
            ("IEX050", "fijo",          6.0,   "Interruptores magnetotérmicos"),
            # Fontanería
            ("IFB010", "fijo",          1.0,   "Alimentación agua potable"),
            ("IFI005", "superficie",    1.4,   "Tuberías instalación interior (ml)"),
            ("IFI010", "banos",         1.0,   "Instalación interior baño"),
            ("IFI012", "fijo",          1.0,   "Instalación cocina"),
            ("ISS010", "banos",         1.0,   "Colector evacuación"),
            # Calefacción suelo radiante
            ("ICE040", "banos",         3.0,   "Radiadores premium"),
            ("ICS010", "superficie",    0.5,   "Tuberías distribución calefacción (ml)"),
            # Sanitarios premium
            ("SAA020", "banos",         0.5,   "Inodoro bidé premium"),
            ("SAI020", "banos",         0.5,   "Inodoro suspendido"),
            ("SAL020", "banos",         1.0,   "Lavabo premium"),
            ("SAD100", "banos",         0.5,   "Ducha italiana oculta"),
            ("SAB020", "banos",         0.3,   "Bañera acero premium"),
            # Cocina
            ("SCF010", "fijo",          1.0,   "Fregadero cocina"),
            ("SCE030", "fijo",          1.0,   "Placa encimera"),
            ("SCM020", "fijo",          1.0,   "Mobiliario cocina"),
        ],
    },

    # ──────────────────────────────────────────────────────────────────────
    Tipologia.GALPON: {

        Calidad.ECONOMICA: [
            ("ADL005", "superficie",    0.002, "Desbroce"),
            ("ADD010", "excav_m3",      1.0,   "Excavación"),
            ("ANS010", "superficie",    1.0,   "Solera industrial"),
            ("CSV010", "cimientos_ml",  1.0,   "Cimentación corrida"),
            ("EAS010", "pilares",       5.0,   "Pilares metálicos (kg/pilar)"),
            ("EAT010", "cubierta",      1.0,   "Estructura cubierta metálica"),
            ("FFX010", "muros_ext",     0.8,   "Cerramiento chapa/ladrillo"),
            ("QTM010", "cubierta",      1.0,   "Cubierta chapa"),
            ("IEP010", "superficie",    0.008, "Toma tierra"),
            ("IEG010", "superficie",    0.8,   "Instalación eléctrica básica"),
        ],

        Calidad.ESTANDAR: [
            ("ADL005", "superficie",    0.002, "Desbroce"),
            ("ADD010", "excav_m3",      1.0,   "Excavación"),
            ("ANS010", "superficie",    1.0,   "Solera industrial armada"),
            ("CSV010", "cimientos_ml",  1.0,   "Cimentación"),
            ("EAS010", "pilares",       6.0,   "Pilares metálicos"),
            ("EAT010", "cubierta",      1.0,   "Estructura cubierta"),
            ("FFX010", "muros_ext",     0.8,   "Cerramiento"),
            ("QTM020", "cubierta",      1.0,   "Cubierta sandwich"),
            ("IEP010", "superficie",    0.008, "Toma tierra"),
            ("IEG020", "superficie",    0.8,   "Instalación eléctrica"),
            ("IFF010", "banos",         1.0,   "Fontanería vestuarios"),
            ("ISS010", "banos",         1.0,   "Evacuación"),
        ],

        Calidad.PREMIUM: [
            ("ADL005", "superficie",    0.002, "Desbroce"),
            ("ADD010", "excav_m3",      1.0,   "Excavación"),
            ("ANS010", "superficie",    1.0,   "Solera industrial premium"),
            ("CSV010", "cimientos_ml",  1.0,   "Cimentación"),
            ("EAS020", "pilares",       7.0,   "Pilares metálicos premium"),
            ("EAT020", "cubierta",      1.0,   "Estructura cubierta premium"),
            ("FFX010", "muros_ext",     0.8,   "Cerramiento fachada"),
            ("QTM030", "cubierta",      1.0,   "Cubierta autoventilada"),
            ("IEP010", "superficie",    0.008, "Toma tierra"),
            ("IEG030", "superficie",    0.8,   "Instalación eléctrica industrial"),
            ("IFF020", "banos",         1.0,   "Fontanería"),
            ("ISS010", "banos",         1.0,   "Evacuación"),
            ("ICF010", "superficie",    0.005, "Climatización"),
        ],
    },
}

# Copiar departamento desde casa unifamiliar con ajustes mínimos por ahora
RECETAS[Tipologia.DEPARTAMENTO] = RECETAS[Tipologia.CASA_UNIFAMILIAR]
RECETAS[Tipologia.LOCAL_COMERCIAL] = {
    Calidad.ECONOMICA: RECETAS[Tipologia.GALPON][Calidad.ECONOMICA],
    Calidad.ESTANDAR:  RECETAS[Tipologia.CASA_UNIFAMILIAR][Calidad.ESTANDAR],
    Calidad.PREMIUM:   RECETAS[Tipologia.CASA_UNIFAMILIAR][Calidad.PREMIUM],
}
RECETAS[Tipologia.OFICINA] = RECETAS[Tipologia.DEPARTAMENTO]


def get_receta(tipologia: Tipologia, calidad: Calidad) -> list:
    return RECETAS.get(tipologia, {}).get(calidad, [])

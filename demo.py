"""Demo del motor paramétrico."""
import sys
sys.path.insert(0, '.')
from motor import calcular_presupuesto, convertir_presupuesto, Tipologia, Calidad

# ── Caso de prueba ─────────────────────────────────────────────────────────────
p = calcular_presupuesto(
    tipologia  = Tipologia.CASA_UNIFAMILIAR,
    calidad    = Calidad.ESTANDAR,
    superficie = 120.0,
    provincia  = "Buenos Aires",
)

# ── Geometría derivada ─────────────────────────────────────────────────────────
g = p.geometria
print("=" * 58)
print(f"  CASA UNIFAMILIAR ESTÁNDAR — {g.superficie_cubierta} m²")
print(f"  Provincia: {p.provincia}")
print("=" * 58)
print(f"\n  GEOMETRÍA ESTIMADA")
print(f"  Perímetro exterior:    {g.perimetro:.1f} ml")
print(f"  Área muros exteriores: {g.area_muros_ext:.1f} m²")
print(f"  Área tabiques int.:    {g.area_muros_int:.1f} m²")
print(f"  Área cubierta:         {g.area_cubierta:.1f} m²")
print(f"  Área pisos:            {g.area_pisos:.1f} m²")
print(f"  Zonas húmedas:         {g.area_zonas_humedas:.1f} m²")
print(f"  Cimientos:             {g.ml_cimientos:.1f} ml")
print(f"  Excavación:            {g.vol_excavacion:.2f} m³")
print(f"  Baños estimados:       {g.n_banos}")
print(f"  Pilares estimados:     {g.n_pilares}")

# ── Presupuesto por rubro ──────────────────────────────────────────────────────
print(f"\n  PRESUPUESTO POR RUBRO")
print(f"  {'Rubro':<35} {'EUR ref.':>12}  {'% total':>7}")
print(f"  {'-'*58}")
for (letra, nombre), datos in sorted(p.por_rubro.items()):
    pct = datos["total_eur"] / p.total_eur * 100 if p.total_eur else 0
    print(f"  {nombre:<35} {datos['total_eur']:>10,.2f}€  {pct:>6.1f}%")
print(f"  {'-'*58}")
print(f"  {'TOTAL':35} {p.total_eur:>10,.2f}€  100.0%")
print(f"\n  Costo de referencia: {p.costo_eur_por_m2:.2f} EUR/m²")

# ── Detalle de tareas ──────────────────────────────────────────────────────────
print(f"\n  TAREAS ({len(p.tareas)} tareas — primeras 10)")
print(f"  {'Código':<10} {'Descripción':<42} {'Cant':>7} {'€/ud':>8} {'Total€':>10}")
print(f"  {'-'*80}")
for t in p.tareas[:10]:
    desc = t.nombre_tarea[:40]
    print(f"  {t.codigo_tarea:<10} {desc:<42} {t.cantidad:>7.2f} "
          f"{t.precio_unitario_eur:>8.2f} {t.importe_eur:>10.2f}")

# ── Desglose materiales vs mano de obra ───────────────────────────────────────
from motor.models import TipoItem
from collections import defaultdict
tipo_totales = defaultdict(float)
for tarea in p.tareas:
    for item in tarea.items:
        tipo_totales[item.tipo] += item.importe_eur

print(f"\n  DESGLOSE POR TIPO")
labels = {
    TipoItem.MATERIAL:   "Materiales",
    TipoItem.MANO_OBRA:  "Mano de obra",
    TipoItem.MAQUINARIA: "Maquinaria/Equipos",
    TipoItem.COMP_COMP:  "Costos compl.",
}
total_items = sum(tipo_totales.values())
for tipo, label in labels.items():
    v = tipo_totales.get(tipo, 0)
    pct = v / total_items * 100 if total_items else 0
    print(f"  {label:<22} {v:>10,.2f}€  {pct:>5.1f}%")

# ── Capa ARS ──────────────────────────────────────────────────────────────────
from motor.ars_layer import TASAS
ars = convertir_presupuesto(p)
print(f"\n  ESTIMADO EN PESOS ARGENTINOS")
print(f"  Tasas ({ars.fecha_tasas}):  1 EUR = USD {TASAS['eur_usd']:.2f} x ARS {TASAS['usd_ars']:,.0f} = ARS {ars.eur_to_ars:,.0f}")
print(f"  Total estimado:       ARS {ars.total_ars:>15,.0f}")
print(f"  Total en USD:         USD {ars.total_usd:>15,.0f}")
print(f"  Costo ARS/m2:         ARS {ars.costo_ars_por_m2:>15,.0f}")
print(f"  Costo USD/m2:         USD {ars.costo_usd_por_m2:>15,.0f}")
print(f"  Referencia CAC:       USD {ars.cac_ref_usd_m2:>8}/m2")
print(f"  Desviacion vs CAC:    {ars.desviacion_cac_pct:>+.1f}%")
if ars.alerta_desviacion:
    print(f"\n  *** {ars.alerta_desviacion} ***")

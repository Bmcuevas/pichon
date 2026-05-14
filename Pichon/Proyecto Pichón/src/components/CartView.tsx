import React, { useState, useMemo } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { calculateTaskResults } from '../utils/calculations';
import { CartItem, Phase } from '../types';
import { Trash2, ChevronDown, ChevronUp, Package, Clock, ShoppingCart, ArrowLeft } from 'lucide-react';

const PHASE_CONFIG = {
  A: { label: 'Cimientos',      dot: 'bg-sky-400',     badge: 'bg-sky-50 text-sky-700 border-sky-200',     row: 'bg-sky-50/40'     },
  B: { label: 'Estructura',     dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200', row: 'bg-amber-50/40'  },
  C: { label: 'Terminaciones',  dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', row: 'bg-emerald-50/40' },
} as const;

function fmtARS(n: number) {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

interface CartViewProps {
  onBack?: () => void;
}

/* ─── Single item card ───────────────────────────────────────────────────── */
const ItemCard: React.FC<{ item: CartItem; onRemove: () => void }> = ({ item, onRemove }) => {
  const { getHourlyRate, workdayHours } = useSettingsStore();
  const [expanded, setExpanded] = useState(false);
  const results = useMemo(
    () => calculateTaskResults(item.task, item.quantity, item.appliedLeftovers, getHourlyRate),
    [item, getHourlyRate]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Row */}
      <div
        className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800 leading-snug">{item.task.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {item.quantity} <span className="font-mono">{item.task.unit}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-slate-900">${fmtARS(results.grandTotal)}</div>
          <div className="text-xs text-slate-400">{results.materials.length} materiales</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
        >
          <Trash2 size={15} />
        </button>
        <span className="text-slate-400 flex-shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 space-y-4">

          {results.materials.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Package size={13} /> Materiales a comprar
              </div>
              <div className="space-y-1.5">
                {results.materials.map(mat => (
                  <div key={mat.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{mat.name}</span>
                    <span className="font-semibold text-slate-800">
                      {mat.commercialQuantityToBuy} {mat.commercialUnit}(s)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.labor.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Clock size={13} /> Mano de obra
              </div>
              <div className="space-y-1.5">
                {results.labor.map((lab, i) => {
                  const days = (lab.totalHours / workdayHours).toFixed(1);
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-600">{lab.role}</span>
                      <span className="font-semibold text-slate-800">{days} jornadas</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">Costo directo</span>
            <span className="text-base font-bold text-slate-900">${fmtARS(results.grandTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Cart view ──────────────────────────────────────────────────────────── */
export const CartView: React.FC<CartViewProps> = ({ onBack }) => {
  const { cart, removeFromCart, clearCart, getTotalWasteVolume } = useBudgetStore();
  const { getHourlyRate } = useSettingsStore();

  const totalBudget = useMemo(() =>
    cart.reduce((acc, item) => {
      const r = calculateTaskResults(item.task, item.quantity, item.appliedLeftovers, getHourlyRate);
      return acc + r.grandTotal;
    }, 0),
    [cart, getHourlyRate]
  );

  // Group by phase
  const grouped = useMemo(() => {
    const g: Record<string, CartItem[]> = { A: [], B: [], C: [], none: [] };
    cart.forEach(item => {
      const p = item.phase || 'none';
      if (!g[p]) g[p] = [];
      g[p].push(item);
    });
    return g;
  }, [cart]);

  const phaseTotals = useMemo(() => {
    const t: Record<string, number> = {};
    cart.forEach(item => {
      const p = item.phase || 'none';
      const r = calculateTaskResults(item.task, item.quantity, item.appliedLeftovers, getHourlyRate);
      t[p] = (t[p] || 0) + r.grandTotal;
    });
    return t;
  }, [cart, getHourlyRate]);

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full">
        {onBack && (
          <div className="bg-white border-b border-slate-200 px-8 py-5">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft size={16} /> Volver
            </button>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
            <ShoppingCart size={28} className="text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg">Presupuesto vacío</h3>
          <p className="text-slate-400 mt-1 text-sm">Agregá tareas desde los rubros para comenzar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center gap-4 flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-700">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Presupuesto</h1>
          <p className="text-sm text-slate-500 mt-0.5">{cart.length} tareas seleccionadas</p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Vaciar todo
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-28 space-y-8">

        {/* Phase groups */}
        {(['A', 'B', 'C'] as Phase[]).map(p => {
          const items = grouped[p];
          if (!items?.length) return null;
          const pc = PHASE_CONFIG[p];
          return (
            <div key={p}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                  <span className="font-bold text-slate-800">{pc.label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${pc.badge}`}>
                    Fase {p}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-600">${fmtARS(phaseTotals[p] || 0)}</span>
              </div>

              <div className="space-y-2">
                {items.map(item => (
                  <ItemCard key={item.id} item={item} onRemove={() => removeFromCart(item.id)} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Items without phase */}
        {grouped.none?.length > 0 && (
          <div>
            <h3 className="font-bold text-slate-700 mb-4">Otros</h3>
            <div className="space-y-2">
              {grouped.none.map(item => (
                <ItemCard key={item.id} item={item} onRemove={() => removeFromCart(item.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Waste */}
        {getTotalWasteVolume() > 0 && (
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-5">
            <div className="text-sm font-bold text-slate-700 mb-1">Logística de residuos</div>
            <div className="text-sm text-slate-600">
              Volumen total: <strong>{getTotalWasteVolume().toFixed(2)} m³</strong>
              {' '}· Volquetes estimados: <strong>{Math.ceil(getTotalWasteVolume() / 5)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Sticky total */}
      <div className="bg-white border-t border-slate-200 px-4 md:px-8 py-4 md:py-5 flex-shrink-0 mb-16 md:mb-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500 font-medium">Total estimado</div>
            <div className="text-xs text-slate-400 mt-0.5">Sin gastos indirectos ni honorarios</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">${fmtARS(totalBudget)}</div>
        </div>

        {/* Phase breakdown */}
        {Object.keys(phaseTotals).filter(p => p !== 'none').length > 1 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(['A', 'B', 'C'] as Phase[]).map(p => {
              const t = phaseTotals[p];
              if (!t) return null;
              const pc = PHASE_CONFIG[p];
              const pct = totalBudget > 0 ? (t / totalBudget) * 100 : 0;
              return (
                <div key={p} className={`rounded-xl p-3 border ${pc.badge}`}>
                  <div className="text-xs font-semibold mb-0.5">{pc.label}</div>
                  <div className="text-sm font-bold">${fmtARS(t)}</div>
                  <div className="text-xs opacity-70">{pct.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

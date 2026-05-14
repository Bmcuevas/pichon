import React, { useMemo, useState } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { calculateTaskResults, CalculatedMaterial } from '../utils/calculations';
import { Package, ChevronDown, ChevronUp, ClipboardCopy, Check, ArrowUpDown } from 'lucide-react';

function fmtARS(n: number) {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

type SortKey = 'cost' | 'name' | 'qty';

interface AggregatedMaterial {
  mat: CalculatedMaterial;
  totalCommercialQty: number;
  totalCost: number;
  sources: { taskName: string; phase?: string; qty: number }[];
}

export const ShoppingListView: React.FC = () => {
  const { cart } = useBudgetStore();
  const { getHourlyRate } = useSettingsStore();
  const [sort, setSort] = useState<SortKey>('cost');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const aggregated = useMemo(() => {
    const map = new Map<string, AggregatedMaterial>();

    cart.forEach(item => {
      const results = calculateTaskResults(item.task, item.quantity, item.appliedLeftovers, getHourlyRate);
      results.materials.forEach(mat => {
        if (mat.commercialQuantityToBuy === 0) return;
        const existing = map.get(mat.id);
        if (existing) {
          existing.totalCommercialQty += mat.commercialQuantityToBuy;
          existing.totalCost         += mat.totalCostARS;
          existing.sources.push({ taskName: item.task.name, phase: item.phase, qty: mat.commercialQuantityToBuy });
        } else {
          map.set(mat.id, {
            mat,
            totalCommercialQty: mat.commercialQuantityToBuy,
            totalCost:          mat.totalCostARS,
            sources: [{ taskName: item.task.name, phase: item.phase, qty: mat.commercialQuantityToBuy }],
          });
        }
      });
    });

    const list = Array.from(map.values());

    if (sort === 'cost') return list.sort((a, b) => b.totalCost - a.totalCost);
    if (sort === 'name') return list.sort((a, b) => a.mat.name.localeCompare(b.mat.name));
    if (sort === 'qty')  return list.sort((a, b) => b.totalCommercialQty - a.totalCommercialQty);
    return list;
  }, [cart, getHourlyRate, sort]);

  const totalCost = useMemo(() =>
    aggregated.reduce((acc, a) => acc + a.totalCost, 0),
  [aggregated]);

  const handleCopy = () => {
    const lines = [
      'LISTA DE COMPRAS — PICHÓN',
      '─'.repeat(48),
      ...aggregated.map(a =>
        `${a.mat.name.padEnd(32)} ${String(a.totalCommercialQty).padStart(5)} ${a.mat.commercialUnit}   $${fmtARS(a.totalCost)}`
      ),
      '─'.repeat(48),
      `TOTAL MATERIALES: $${fmtARS(totalCost)}`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Package size={28} className="text-slate-400" />
        </div>
        <h3 className="font-bold text-slate-700 text-lg">Sin materiales</h3>
        <p className="text-slate-400 mt-1 text-sm">Agregá tareas al presupuesto para ver la lista de compras.</p>
      </div>
    );
  }

  const PHASE_DOT: Record<string, string> = {
    A: 'bg-sky-400',
    B: 'bg-amber-400',
    C: 'bg-emerald-400',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 md:px-8 py-4 flex items-center gap-3 flex-shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
          {([['cost','Mayor costo'],['name','Nombre'],['qty','Cantidad']] as [SortKey, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                sort === k ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ArrowUpDown size={11} />
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            copied
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
          }`}
        >
          {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
          {copied ? 'Copiado' : 'Copiar lista'}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 pb-32 md:pb-28 space-y-2">
        {aggregated.map(({ mat, totalCommercialQty, totalCost: cost, sources }) => {
          const isExpanded = expandedId === mat.id;
          const multiSource = sources.length > 1;
          return (
            <div key={mat.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div
                className={`px-4 py-3.5 flex items-center gap-3 ${multiSource ? 'cursor-pointer hover:bg-slate-50' : ''} transition-colors`}
                onClick={() => multiSource && setExpandedId(isExpanded ? null : mat.id)}
              >
                {/* Icon */}
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-slate-500" />
                </div>

                {/* Name + unit */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 leading-snug truncate">{mat.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{mat.commercialUnit}</div>
                </div>

                {/* Qty badge */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold text-slate-900 leading-none">{totalCommercialQty}</div>
                  <div className="text-xs text-slate-400 mt-0.5">unid.</div>
                </div>

                {/* Cost */}
                <div className="flex-shrink-0 text-right w-24 hidden sm:block">
                  <div className="text-sm font-semibold text-slate-700">${fmtARS(cost)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">costo total</div>
                </div>

                {/* Expand arrow */}
                {multiSource && (
                  <span className="text-slate-400 flex-shrink-0">
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </span>
                )}
              </div>

              {/* Cost on mobile */}
              <div className="sm:hidden px-4 pb-3 -mt-1 flex justify-between items-center">
                <span className="text-xs text-slate-400">Costo total</span>
                <span className="text-sm font-semibold text-slate-700">${fmtARS(cost)}</span>
              </div>

              {/* Sources breakdown */}
              {isExpanded && multiSource && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 space-y-1.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Usado en</div>
                  {sources.map((src, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      {src.phase && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PHASE_DOT[src.phase] || 'bg-slate-300'}`} />
                      )}
                      <span className="flex-1 truncate">{src.taskName}</span>
                      <span className="font-semibold text-slate-800 flex-shrink-0">{src.qty} unid.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer total */}
      <div className="bg-white border-t border-slate-200 px-4 md:px-8 py-4 md:py-5 flex-shrink-0 mb-16 md:mb-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500 font-medium">Total materiales</div>
            <div className="text-xs text-slate-400 mt-0.5">{aggregated.length} ítems distintos a comprar</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">${fmtARS(totalCost)}</div>
        </div>
      </div>
    </div>
  );
};

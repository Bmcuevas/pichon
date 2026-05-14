import React, { useState, useEffect } from 'react';
import { Task, Phase } from '../types';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useBudgetStore } from '../store/useBudgetStore';

interface TaskConfiguratorProps {
  task: Task;
  phase?: Phase;
  onQuantityChange: (qty: number) => void;
  onAppliedLeftoversChange?: (leftovers: Record<string, number>) => void;
}

export const TaskConfigurator: React.FC<TaskConfiguratorProps> = ({
  task, phase, onQuantityChange, onAppliedLeftoversChange
}) => {
  const [quantity, setQuantity]     = useState<number>(0);
  const [dims, setDims]             = useState({ length: '', width: '' });
  const [surface, setSurface]       = useState('');
  const [thickness, setThickness]   = useState('');
  const [withSlope, setWithSlope]   = useState(false);
  const [appliedLeftovers, setApplied] = useState<Record<string, number>>({});
  const [availableLeftovers, setAvailable] = useState<Record<string, number>>({});

  const { leftoverVault, cart } = useBudgetStore();

  const isVolume = task.unit === 'm3';
  const isArea   = task.unit === 'm2';
  const isLinear = task.unit === 'ml';
  const thickNum = parseFloat(thickness) || 0;

  // Compute available leftovers
  useEffect(() => {
    if (!phase) { setAvailable({}); return; }
    const compatible = phase === 'C' ? ['C','B'] : phase === 'B' ? ['B','A'] : ['A'];
    const avail: Record<string, number> = {};
    task.apu.materials.forEach(mat => {
      let total = 0;
      compatible.forEach(p => {
        const v = leftoverVault[p as Phase];
        if (v?.[mat.id]) total += v[mat.id];
      });
      if (total > 0) avail[mat.id] = total;
    });
    setAvailable(avail);
  }, [task, phase, leftoverVault]);

  // m3 auto-calc
  useEffect(() => {
    if (!isVolume) return;
    const s = parseFloat(surface) || 0;
    const t = parseFloat(thickness) || 0;
    if (s > 0 && t > 0) {
      const calc = parseFloat((s * (t / 100) * (withSlope ? 1.1 : 1)).toFixed(3));
      setQuantity(calc);
      onQuantityChange(calc);
    }
  }, [surface, thickness, withSlope, isVolume]);

  // m2/ml auto-calc
  useEffect(() => {
    if (!isArea && !isLinear) return;
    const l = parseFloat(dims.length) || 0;
    const w = parseFloat(dims.width) || 0;
    const calc = isArea && l > 0 && w > 0 ? l * w : isLinear && l > 0 ? l : 0;
    if (calc > 0) {
      const v = parseFloat(calc.toFixed(2));
      setQuantity(v);
      onQuantityChange(v);
    }
  }, [dims, isArea, isLinear]);

  const handleManual = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    setQuantity(val);
    onQuantityChange(val);
  };

  const handleApplyLeftover = (matId: string, available: number) => {
    const isApplied = !!appliedLeftovers[matId];
    const next = { ...appliedLeftovers };
    if (isApplied) {
      delete next[matId];
    } else {
      const mat = task.apu.materials.find(m => m.id === matId);
      if (mat) {
        const required = mat.yield * quantity * mat.wasteFactor;
        next[matId] = Math.min(available, required);
      }
    }
    setApplied(next);
    onAppliedLeftoversChange?.(next);
  };

  // Adjust applied amounts when quantity changes
  useEffect(() => {
    if (!Object.keys(appliedLeftovers).length) return;
    const next = { ...appliedLeftovers };
    let changed = false;
    task.apu.materials.forEach(mat => {
      if (next[mat.id] !== undefined) {
        const required = mat.yield * quantity * mat.wasteFactor;
        const newAmt = Math.min(availableLeftovers[mat.id] ?? 0, required);
        if (next[mat.id] !== newAmt) { next[mat.id] = newAmt; changed = true; }
      }
    });
    if (changed) { setApplied(next); onAppliedLeftoversChange?.(next); }
  }, [quantity]);

  return (
    <div className="space-y-6">

      {/* Section: Calculator */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Calculadora</h3>

        {isVolume && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Superficie (m²)">
                <Input type="number" placeholder="50" value={surface} onChange={e => setSurface(e.target.value)} />
              </Field>
              <Field label="Espesor (cm)">
                <Input type="number" placeholder="10" value={thickness} onChange={e => setThickness(e.target.value)} />
              </Field>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={withSlope}
                onChange={e => setWithSlope(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Con pendiente <span className="text-slate-400">(+10%)</span></span>
            </label>

            {thickNum > 0 && thickNum < 5 && (
              <Alert color="red" icon={<AlertTriangle size={15} />}>
                Riesgo de fisuras. Espesor mínimo recomendado: 5–8 cm.
              </Alert>
            )}
            {thickNum > 15 && (
              <Alert color="amber" icon={<AlertTriangle size={15} />}>
                Espesor excesivo. Considere relleno previo o hormigón alivianado.
              </Alert>
            )}
          </div>
        )}

        {(isArea || isLinear) && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Largo (m)">
              <Input type="number" placeholder="0" value={dims.length} onChange={e => setDims(d => ({ ...d, length: e.target.value }))} />
            </Field>
            {isArea && (
              <Field label="Ancho (m)">
                <Input type="number" placeholder="0" value={dims.width} onChange={e => setDims(d => ({ ...d, width: e.target.value }))} />
              </Field>
            )}
          </div>
        )}

        <div className={isVolume || isArea || isLinear ? 'mt-4' : ''}>
          <Field label={`Cantidad total (${task.unit})`}>
            <Input
              type="number"
              placeholder="Ingrese cantidad"
              value={quantity || ''}
              onChange={handleManual}
              className="text-lg font-semibold"
            />
          </Field>
        </div>
      </div>

      {/* Section: Leftover suggestions */}
      {cart.length > 0 && Object.keys(availableLeftovers).length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Sobrantes Disponibles</h3>
          <div className="space-y-2.5">
            {Object.entries(availableLeftovers).map(([matId, amount]) => {
              const mat = task.apu.materials.find(m => m.id === matId);
              if (!mat || quantity <= 0) return null;
              const isApplied = !!appliedLeftovers[matId];
              const commercial = (amount / mat.commercialPackagingQuantity).toFixed(1);

              return (
                <div
                  key={matId}
                  className={`p-4 rounded-xl border transition-colors ${
                    isApplied
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-sky-50 border-sky-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isApplied
                      ? <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                      : <AlertCircle size={16} className="text-sky-600 mt-0.5 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold mb-0.5 ${isApplied ? 'text-emerald-800' : 'text-sky-800'}`}>
                        {mat.name}
                      </div>
                      <div className={`text-xs ${isApplied ? 'text-emerald-700' : 'text-sky-700'}`}>
                        {amount.toFixed(2)} {mat.unit} disponibles (~{commercial} {mat.commercialUnit})
                      </div>
                      <button
                        onClick={() => handleApplyLeftover(matId, amount)}
                        className={`mt-2.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          isApplied
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-sky-600 text-white hover:bg-sky-700'
                        }`}
                      >
                        {isApplied ? 'Aplicado ✓' : 'Aplicar sobrante'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Small helpers ──────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({
  className = '', ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      {...props}
      className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-800 placeholder-slate-300 ${className}`}
    />
  );
}

function Alert({ color, icon, children }: {
  color: 'red' | 'amber';
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls = color === 'red'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-amber-50 border-amber-200 text-amber-800';
  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm ${cls}`}>
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <p className="font-medium leading-snug">{children}</p>
    </div>
  );
}

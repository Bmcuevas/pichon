import React from 'react';
import { TaskResults } from '../utils/calculations';
import { Task } from '../types';
import { AlertTriangle, Package, Clock, Truck, Lightbulb, Calculator } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

interface ResultsDashboardProps {
  task: Task;
  results: TaskResults | null;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ task, results }) => {
  const { workdayHours } = useSettingsStore();

  if (!results) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-16 select-none">
        <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
          <Calculator size={28} className="text-slate-400" />
        </div>
        <h3 className="font-semibold text-slate-600 text-base">Sin datos aún</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-[200px]">
          Ingresá una cantidad para ver el desglose de costos y materiales.
        </p>
      </div>
    );
  }

  const maxLaborHours  = results.labor.length ? Math.max(...results.labor.map(l => l.totalHours)) : 0;
  const estimatedDays  = maxLaborHours > 0 ? maxLaborHours / workdayHours : 0;
  const materialsShare = results.grandTotal > 0 ? (results.totalMaterialsCost / results.grandTotal) * 100 : 0;

  return (
    <div className="space-y-6">

      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Materiales"
          value={`$${fmtARS(results.totalMaterialsCost)}`}
          sub={`${materialsShare.toFixed(0)}% del total`}
          color="blue"
        />
        <KpiCard
          label="Mano de obra"
          value={`$${fmtARS(results.totalLaborCost)}`}
          sub={estimatedDays > 0 ? `~${estimatedDays.toFixed(1)} jornadas` : '—'}
          color="violet"
        />
        <KpiCard
          label="Total directo"
          value={`$${fmtARS(results.grandTotal)}`}
          sub="sin indirectos"
          color="emerald"
          highlight
        />
      </div>

      {/* ── Composition bar ───────────────────────────────────────────── */}
      {results.grandTotal > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Materiales {materialsShare.toFixed(0)}%</span>
            <span>{(100 - materialsShare).toFixed(0)}% Mano de obra</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="bg-blue-500 h-full" style={{ width: `${materialsShare}%` }} />
            <div className="bg-violet-400 h-full flex-1" />
          </div>
        </div>
      )}

      {/* ── Materials list ────────────────────────────────────────────── */}
      {results.materials.length > 0 && (
        <Section icon={<Package size={15} />} title="Lista de compras">
          <div className="space-y-2">
            {results.materials.map(mat => (
              <div key={mat.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-slate-800 text-sm leading-snug">{mat.name}</div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-slate-900">
                      {mat.commercialQuantityToBuy}{' '}
                      <span className="font-normal text-slate-400 text-xs">{mat.commercialUnit}(s)</span>
                    </div>
                    <div className="text-xs text-slate-400">${fmtARS(mat.totalCostARS)}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  {mat.totalWithWaste.toFixed(2)} {mat.unit} requeridos
                  {mat.wasteFactor > 1 && ` · ${((mat.wasteFactor - 1) * 100).toFixed(0)}% desperdicio`}
                </div>

                {mat.surplusPercentage > 15 && (
                  <Warn color="amber">
                    Sobra {mat.surplusPercentage.toFixed(0)}% del último empaque ({mat.surplusQuantity.toFixed(2)} {mat.unit})
                  </Warn>
                )}
                {mat.sensitiveToMoisture && (
                  <Warn color="sky">
                    Material sensible a la humedad — acopiar bajo techo o cubrir con nylon
                  </Warn>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Labor ─────────────────────────────────────────────────────── */}
      {results.labor.length > 0 && (
        <Section icon={<Clock size={15} />} title="Mano de obra">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {estimatedDays > 0 && (
              <div className="px-4 py-3 border-b border-slate-200 bg-violet-50 flex justify-between items-center">
                <span className="text-sm font-semibold text-violet-800">Duración estimada</span>
                <span className="text-sm font-bold text-violet-700">{estimatedDays.toFixed(1)} jornadas</span>
              </div>
            )}
            <div className="divide-y divide-slate-100">
              {results.labor.map((lab, i) => (
                <div key={i} className="px-4 py-3 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{lab.role}</div>
                    <div className="text-xs text-slate-400">
                      {lab.totalHours.toFixed(1)} hs × ${lab.hourlyRate.toLocaleString('es-AR')}/h
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-800">${fmtARS(lab.totalCostARS)}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ── Logistics ─────────────────────────────────────────────────── */}
      {(results.totalLogisticsVolume > 0 || results.totalLogisticsWeight > 0 || results.wasteVolume > 0) && (
        <Section icon={<Truck size={15} />} title="Logística">
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {results.totalLogisticsVolume > 0 && <LogRow label="Volumen de acopio" value={`~${results.totalLogisticsVolume.toFixed(2)} m³`} />}
            {results.totalLogisticsWeight > 0 && <LogRow label="Peso estimado" value={`~${results.totalLogisticsWeight.toFixed(0)} kg`} />}
            {results.totalLogisticsArea > 0  && <LogRow label="Huella de acopio" value={`~${results.totalLogisticsArea.toFixed(1)} m²`} />}
            {results.wasteVolume > 0 && (
              <LogRow
                label="Residuos estimados"
                value={`~${results.wasteVolume.toFixed(2)} m³ · ${Math.ceil(results.wasteVolume / 5)} volquete(s)`}
              />
            )}
          </div>
        </Section>
      )}

      {/* ── Suggestion ────────────────────────────────────────────────── */}
      {task.suggestion && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <Lightbulb size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 leading-relaxed">{task.suggestion}</p>
        </div>
      )}
    </div>
  );
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtARS(n: number) {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

function KpiCard({ label, value, sub, color, highlight = false }: {
  label: string; value: string; sub: string;
  color: 'blue' | 'violet' | 'emerald'; highlight?: boolean;
}) {
  const c = {
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-100',    val: 'text-blue-700',    lbl: 'text-blue-500'    },
    violet:  { bg: 'bg-violet-50',  border: 'border-violet-100',  val: 'text-violet-700',  lbl: 'text-violet-500'  },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', val: 'text-emerald-700', lbl: 'text-emerald-500' },
  }[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4 ${highlight ? 'ring-1 ring-emerald-300' : ''}`}>
      <div className={`text-xs font-semibold mb-1 ${c.lbl}`}>{label}</div>
      <div className={`text-base font-bold leading-tight ${c.val}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-500">{icon}</span>
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function LogRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex justify-between items-center">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function Warn({ color, children }: { color: 'amber' | 'sky'; children: React.ReactNode }) {
  const c = color === 'amber'
    ? 'bg-amber-50 border-amber-100 text-amber-700'
    : 'bg-sky-50 border-sky-100 text-sky-700';
  return (
    <div className={`flex items-start gap-2 text-xs rounded-lg border p-2.5 ${c}`}>
      <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

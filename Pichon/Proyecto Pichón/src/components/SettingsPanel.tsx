import React from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { X, Settings, Clock, DollarSign } from 'lucide-react';

export const SettingsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { workdayHours, dailyRates, setWorkdayHours, setDailyRates } = useSettingsStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Settings size={16} className="text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Configuración</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-7">

          {/* Labor rates */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={15} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700">Valores de mano de obra (por día)</h3>
            </div>
            <div className="space-y-3">
              <PriceField
                label="Oficial"
                value={dailyRates.oficial}
                onChange={v => setDailyRates({ oficial: v })}
              />
              <PriceField
                label="Medio oficial"
                value={dailyRates.medioOficial ?? Math.round((dailyRates.oficial + dailyRates.ayudante) / 2)}
                onChange={v => setDailyRates({ medioOficial: v })}
              />
              <PriceField
                label="Ayudante"
                value={dailyRates.ayudante}
                onChange={v => setDailyRates({ ayudante: v })}
              />
            </div>
          </section>

          {/* Workday */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={15} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700">Jornada laboral</h3>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <input
                type="number"
                min={4}
                max={12}
                value={workdayHours}
                onChange={e => setWorkdayHours(Number(e.target.value))}
                className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">horas por jornada</span>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

function PriceField({ label, value, onChange }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-slate-500 text-sm">$</span>
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-28 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

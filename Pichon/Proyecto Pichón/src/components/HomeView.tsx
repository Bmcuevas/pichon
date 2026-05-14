import React from 'react';
import { Logo } from './Logo';
import { Map as MapIcon, Hammer, Calculator } from 'lucide-react';

interface HomeViewProps {
  onSelectMode: (mode: 'obra_nueva' | 'refaccion' | 'calculadora') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectMode }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-10 animate-in fade-in zoom-in duration-500">
      
      {/* Header Logo Area */}
      <div className="flex flex-col items-center justify-center space-y-4 mt-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-[2rem] shadow-xl shadow-blue-200 text-white transform transition hover:scale-105">
          <Logo size={64} />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Pichón</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Gestión Inteligente de Obra</p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="w-full space-y-4 max-w-sm pb-8">
        <button 
          onClick={() => onSelectMode('obra_nueva')}
          className="w-full group bg-white border-2 border-slate-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-100 p-5 rounded-2xl transition-all flex items-center gap-5 text-left active:scale-[0.98]"
        >
          <div className="bg-blue-50 p-4 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <MapIcon size={28} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xl mb-0.5">Obra Nueva</h3>
            <p className="text-sm text-slate-500 font-medium">Planificación por Camino Crítico</p>
          </div>
        </button>

        <button 
          onClick={() => onSelectMode('refaccion')}
          className="w-full group bg-white border-2 border-slate-100 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-100 p-5 rounded-2xl transition-all flex items-center gap-5 text-left active:scale-[0.98]"
        >
          <div className="bg-amber-50 p-4 rounded-xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <Hammer size={28} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xl mb-0.5">Refacción</h3>
            <p className="text-sm text-slate-500 font-medium">Listado de rubros por área</p>
          </div>
        </button>

        <button 
          onClick={() => onSelectMode('calculadora')}
          className="w-full group bg-white border-2 border-slate-100 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-100 p-5 rounded-2xl transition-all flex items-center gap-5 text-left active:scale-[0.98]"
        >
          <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <Calculator size={28} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xl mb-0.5">Calculadora Rápida</h3>
            <p className="text-sm text-slate-500 font-medium">Cálculo directo de APUs</p>
          </div>
        </button>
      </div>
    </div>
  );
};

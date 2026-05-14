import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Hammer, Mountain, Building2, Layers, LayoutGrid,
  Shield, Zap, DoorOpen, Grid3X3, Tag, Clock, CheckCircle2
} from 'lucide-react';
import { Phase, CartItem } from '../types';

interface CustomNodeData {
  label: string;
  phase?: Phase;
  iconId: string;
  activeTasks?: CartItem[];
}

const iconMap: Record<string, React.ReactNode> = {
  D: <Hammer size={18} />,
  A: <Mountain size={18} />,
  C: <Building2 size={18} />,
  E: <Layers size={18} />,
  F: <LayoutGrid size={18} />,
  N: <Shield size={18} />,
  Q: <Layers size={18} />,
  I: <Zap size={18} />,
  L: <DoorOpen size={18} />,
  R: <Grid3X3 size={18} />,
  S: <Tag size={18} />,
};

const phaseStyles = {
  A: {
    border: 'border-sky-400',
    headerBg: 'bg-sky-500/10',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
    label: 'text-sky-400',
    badge: 'bg-sky-500/15 text-sky-300',
    dot: 'bg-sky-400',
    taskBg: 'bg-sky-500/5',
  },
  B: {
    border: 'border-amber-400',
    headerBg: 'bg-amber-500/10',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    label: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-300',
    dot: 'bg-amber-400',
    taskBg: 'bg-amber-500/5',
  },
  C: {
    border: 'border-emerald-400',
    headerBg: 'bg-emerald-500/10',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    label: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-300',
    dot: 'bg-emerald-400',
    taskBg: 'bg-emerald-500/5',
  },
};

const calcDays = (item: CartItem) => {
  const h = item.task.apu.labor.reduce((acc, l) => acc + l.hoursPerUnit * item.quantity, 0);
  return Math.max(1, Math.ceil(h / 8));
};

export const CustomNode = ({ data }: { data: CustomNodeData }) => {
  const style = data.phase ? phaseStyles[data.phase] : null;
  const icon  = iconMap[data.iconId] || <Layers size={18} />;
  const hasTasks = data.activeTasks && data.activeTasks.length > 0;

  return (
    <div
      className={`
        rounded-2xl overflow-hidden transition-all duration-200
        hover:scale-[1.02] hover:shadow-xl cursor-pointer
        border-2 shadow-lg
        ${style ? style.border : 'border-slate-600'}
        bg-[#1e293b]
      `}
      style={{ minWidth: 220, maxWidth: 240 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 rounded-full border-2 border-slate-700"
        style={{ background: style?.dot.replace('bg-', '') || '#64748b' }}
      />

      {/* Header */}
      <div className={`px-4 py-3 ${style ? style.headerBg : 'bg-slate-700/30'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl flex-shrink-0 ${style ? style.iconBg : 'bg-slate-700/50'}`}>
            <span className={style ? style.iconColor : 'text-slate-400'}>{icon}</span>
          </div>
          <div className="min-w-0">
            <div className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${style ? style.label : 'text-slate-500'}`}>
              {data.phase ? `Fase ${data.phase}` : 'General'}
            </div>
            <div className="text-sm font-bold text-white leading-tight truncate">{data.label}</div>
          </div>
        </div>
      </div>

      {/* Tasks in cart */}
      {hasTasks && (
        <div className="px-3 pb-3 pt-2 space-y-1.5">
          {data.activeTasks!.map(item => (
            <div
              key={item.id}
              className={`rounded-xl p-2.5 border border-white/10 ${style ? style.taskBg : 'bg-slate-700/20'}`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="text-xs font-semibold text-slate-200 leading-tight flex items-start gap-1.5 min-w-0">
                  <CheckCircle2 size={12} className={`flex-shrink-0 mt-0.5 ${style ? style.iconColor : 'text-slate-500'}`} />
                  <span className="truncate">{item.task.name}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5 pl-4">
                <span className="text-[11px] text-slate-400 font-mono">
                  {item.quantity.toLocaleString()} {item.task.unit}
                </span>
                <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-lg ${style ? style.badge : 'bg-slate-700 text-slate-300'}`}>
                  <Clock size={10} /> {calcDays(item)}d
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 rounded-full border-2 border-slate-700"
        style={{ background: style?.dot.replace('bg-', '') || '#64748b' }}
      />
    </div>
  );
};

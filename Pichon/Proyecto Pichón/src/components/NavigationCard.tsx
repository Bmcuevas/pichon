import React from 'react';
import { ChevronRight } from 'lucide-react';

interface NavigationCardProps {
  title: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export const NavigationCard: React.FC<NavigationCardProps> = ({ title, onClick, icon }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 flex items-center justify-between text-left active:scale-[0.98] border border-slate-100"
    >
      <div className="flex items-center gap-4">
        {icon && <div className="text-blue-600 bg-blue-50 p-3 rounded-xl">{icon}</div>}
        <span className="text-lg font-semibold text-slate-800">{title}</span>
      </div>
      <ChevronRight className="text-slate-400" size={24} />
    </button>
  );
};

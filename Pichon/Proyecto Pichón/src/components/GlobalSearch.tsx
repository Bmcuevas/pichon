import React, { useState, useMemo, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { Category, Task, Phase } from '../types';
import { expandQuery } from '../utils/synonyms';
import { Search, X, ArrowRight, ChevronRight } from 'lucide-react';

interface SearchableTask {
  taskId: string;
  taskName: string;
  subcategoryName: string;
  categoryName: string;
  categoryId: string;
  subcategoryId: string;
  phase?: Phase;
  task: Task;
}

interface GlobalSearchProps {
  categories: Category[];
  onSelectTask: (task: Task, categoryId: string, subcategoryId: string) => void;
  onClose: () => void;
}

const PHASE_CONFIG = {
  A: { label: 'Cimientos',     dot: 'bg-sky-400',     badge: 'bg-sky-500/10 text-sky-300 border border-sky-500/20' },
  B: { label: 'Estructura',    dot: 'bg-amber-400',   badge: 'bg-amber-500/10 text-amber-300 border border-amber-500/20' },
  C: { label: 'Terminaciones', dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' },
} as const;

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ categories, onSelectTask, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Flatten all tasks into a searchable index once
  const index = useMemo<SearchableTask[]>(() => {
    const items: SearchableTask[] = [];
    for (const cat of categories) {
      for (const sub of cat.subcategories) {
        for (const task of sub.tasks) {
          items.push({
            taskId:          task.id,
            taskName:        task.name,
            subcategoryName: sub.name,
            categoryName:    cat.name,
            categoryId:      cat.id,
            subcategoryId:   sub.id,
            phase:           cat.phase as Phase | undefined,
            task,
          });
        }
      }
    }
    return items;
  }, [categories]);

  const fuse = useMemo(() => new Fuse(index, {
    keys: [
      { name: 'taskName',        weight: 3 },
      { name: 'subcategoryName', weight: 1.5 },
      { name: 'categoryName',    weight: 1 },
    ],
    threshold:          0.35,
    includeScore:       true,
    ignoreLocation:     true,
    minMatchCharLength: 2,
    useExtendedSearch:  true,
  }), [index]);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const expanded = expandQuery(query);
    return fuse.search(expanded).slice(0, 12);
  }, [query, fuse]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="w-full max-w-2xl bg-[#1e293b] rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08]">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Buscar tarea, rubro o material…"
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-base outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-1 px-2 py-1 border border-white/10 rounded-lg"
          >
            Esc
          </button>
        </div>

        {/* Synonyms hint */}
        {query.trim().length >= 2 && expandQuery(query) !== query && (
          <div className="px-5 py-2 bg-sky-500/5 border-b border-white/[0.06]">
            <p className="text-xs text-sky-400/80">
              Buscando también términos equivalentes en otros países
            </p>
          </div>
        )}

        {/* Empty state */}
        {query.trim().length < 2 && (
          <div className="px-5 py-10 text-center">
            <p className="text-slate-500 text-sm">Escribí al menos 2 caracteres para buscar entre las 4.129 tareas.</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {['hormigón', 'revoque', 'pintura', 'excavación', 'membrana', 'cerámico'].map(hint => (
                <button
                  key={hint}
                  onClick={() => setQuery(hint)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {query.trim().length >= 2 && results.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-slate-400 text-sm">Sin resultados para "<span className="text-white">{query}</span>"</p>
            <p className="text-slate-500 text-xs mt-1">Probá con sinónimos o términos más cortos.</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-[420px] overflow-y-auto divide-y divide-white/[0.04]">
            {results.map(({ item, score }) => {
              const pc = item.phase ? PHASE_CONFIG[item.phase] : null;
              return (
                <li key={`${item.categoryId}-${item.subcategoryId}-${item.taskId}`}>
                  <button
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors text-left group"
                    onClick={() => {
                      onSelectTask(item.task, item.categoryId, item.subcategoryId);
                      onClose();
                    }}
                  >
                    {/* Phase dot */}
                    <div className="flex-shrink-0 w-2 h-2 mt-0.5">
                      {pc && <span className={`block w-2 h-2 rounded-full ${pc.dot}`} />}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 truncate">{item.taskName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-500 truncate">{item.categoryName}</span>
                        <ChevronRight size={10} className="text-slate-600 flex-shrink-0" />
                        <span className="text-xs text-slate-500 truncate">{item.subcategoryName}</span>
                      </div>
                    </div>

                    {/* Phase badge */}
                    {pc && (
                      <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${pc.badge}`}>
                        {pc.label}
                      </span>
                    )}

                    {/* Relevance score (subtle) */}
                    {score !== undefined && (
                      <span className="flex-shrink-0 text-[10px] text-slate-600">
                        {Math.round((1 - score) * 100)}%
                      </span>
                    )}

                    <ArrowRight size={14} className="flex-shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-slate-500">{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
            <span className="text-xs text-slate-600">↵ para abrir</span>
          </div>
        )}
      </div>
    </div>
  );
};

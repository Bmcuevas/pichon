import React, { useState, useMemo } from 'react';
import data from './data/data.json';
import { Category, SubCategory, Task, Phase } from './types';
import { calculateTaskResults, TaskResults } from './utils/calculations';
import { useBudgetStore } from './store/useBudgetStore';
import { useSettingsStore } from './store/useSettingsStore';
import { TaskConfigurator } from './components/TaskConfigurator';
import { ResultsDashboard } from './components/ResultsDashboard';
import { CartView } from './components/CartView';
import { SettingsPanel } from './components/SettingsPanel';
import { ConstructionMap } from './components/ConstructionMap';
import { Logo } from './components/Logo';
import {
  Home, ShoppingCart, Settings, Search, ArrowLeft,
  ChevronRight, Hammer, Mountain, Building2, Layers,
  Shield, Zap, DoorOpen, Grid3X3, Tag, LayoutGrid, X,
  Package, GitBranch, type LucideIcon
} from 'lucide-react';

/* ─── PHASE CONFIG ───────────────────────────────────────────────────────── */
const PHASE = {
  A: {
    label: 'Cimientos',
    dot: 'bg-sky-400',
    text: 'text-sky-400',
    badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20 border',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-400',
    cardHover: 'hover:border-sky-300/50',
  },
  B: {
    label: 'Estructura',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20 border',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    cardHover: 'hover:border-amber-300/50',
  },
  C: {
    label: 'Terminaciones',
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 border',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    cardHover: 'hover:border-emerald-300/50',
  },
} as const;

const CAT_ICON: Record<string, LucideIcon> = {
  D: Hammer, A: Mountain, C: Building2, E: Layers,
  F: LayoutGrid, N: Shield, Q: Layers, I: Zap,
  L: DoorOpen, R: Grid3X3, S: Tag,
};

type View = 'home' | 'workflow' | 'subs' | 'tasks' | 'config' | 'cart';

/* ─── APP ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [view, setView]           = useState<View>('home');
  const [cat, setCat]             = useState<Category | null>(null);
  const [sub, setSub]             = useState<SubCategory | null>(null);
  const [task, setTask]           = useState<Task | null>(null);
  const [qty, setQty]             = useState(0);
  const [leftovers, setLeftovers] = useState<Record<string, number>>({});
  const [settings, setSettings]   = useState(false);
  const [search, setSearch]       = useState('');

  const { cart, addToCart } = useBudgetStore();
  const { getHourlyRate }   = useSettingsStore();

  const totalBudget = useMemo(() =>
    cart.reduce((acc, item) => {
      const r = calculateTaskResults(item.task, item.quantity, item.appliedLeftovers, getHourlyRate);
      return acc + r.grandTotal;
    }, 0), [cart, getHourlyRate]);

  const results = useMemo<TaskResults | null>(() => {
    if (task && qty > 0) return calculateTaskResults(task, qty, leftovers, getHourlyRate);
    return null;
  }, [task, qty, leftovers, getHourlyRate]);

  const categories  = data as Category[];
  const catsByPhase = useMemo(() => {
    const g: Record<Phase, Category[]> = { A: [], B: [], C: [] };
    categories.forEach(c => c.phase && g[c.phase as Phase].push(c));
    return g;
  }, [categories]);

  const goCategory = (c: Category) => { setCat(c); setSub(null); setTask(null); setSearch(''); setView('subs'); };
  const goSub      = (s: SubCategory) => { setSub(s); setTask(null); setSearch(''); setView('tasks'); };
  const goTask     = (t: Task) => { setTask(t as Task); setQty(0); setLeftovers({}); setView('config'); };
  const addCart    = () => {
    if (!task || qty <= 0) return;
    addToCart({ id: Math.random().toString(36).substr(2, 9), task, quantity: qty, appliedLeftovers: leftovers, phase: cat?.phase, categoryId: cat?.id });
    setView('cart');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-slate-950">

      {/* ─── SIDEBAR (desktop only) ─────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-[#111827] border-r border-white/[0.06]">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50 flex-shrink-0">
              <Logo size={18} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none">Pichón</div>
              <div className="text-slate-500 text-[10px] mt-0.5 leading-none">Gestión de Obra</div>
            </div>
          </div>
        </div>

        {/* Top nav */}
        <div className="px-3 pt-3 pb-1 space-y-1">
          <SidebarBtn icon={<Home size={15} />} label="Inicio" active={view === 'home'} onClick={() => setView('home')} />
          <SidebarBtn icon={<GitBranch size={15} />} label="Diagrama de Obra" active={view === 'workflow'} onClick={() => setView('workflow')} />
        </div>

        {/* Categories */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-3">
          {(['A', 'B', 'C'] as Phase[]).map(p => {
            const cats = catsByPhase[p];
            if (!cats.length) return null;
            const pc = PHASE[p];
            return (
              <div key={p}>
                <div className="flex items-center gap-2 px-2.5 mb-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pc.dot}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${pc.text}`}>{pc.label}</span>
                </div>
                {cats.map(c => {
                  const Icon = CAT_ICON[c.id] || Layers;
                  return (
                    <SidebarBtn key={c.id} icon={<Icon size={15} />} label={c.name}
                      active={cat?.id === c.id} onClick={() => goCategory(c)} activeIconClass="text-blue-400" />
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/[0.06] pt-3">
          <SidebarBtn
            icon={<div className="relative"><ShoppingCart size={15} />{cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cart.length}</span>}</div>}
            label="Presupuesto" active={view === 'cart'} onClick={() => setView('cart')}
            badge={totalBudget > 0 ? `$${(totalBudget / 1_000_000).toFixed(1)}M` : undefined}
          />
          <SidebarBtn icon={<Settings size={15} />} label="Configuración" active={false} onClick={() => setSettings(true)} />
        </div>
      </aside>

      {/* ─── CONTENT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

        {/* Mobile header (visible only on mobile, not on home) */}
        {view !== 'home' && (
          <div className="md:hidden flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
            <button
              onClick={() => {
                if (view === 'subs') { setView('home'); setCat(null); }
                else if (view === 'tasks') { setView('subs'); setSub(null); }
                else if (view === 'config') { setView('tasks'); setTask(null); }
                else if (view === 'cart' || view === 'workflow') setView('home');
              }}
              className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition text-slate-500"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">
                {view === 'cart' ? 'Presupuesto'
                  : view === 'workflow' ? 'Diagrama de Obra'
                  : view === 'subs' ? cat?.name
                  : view === 'tasks' ? sub?.name
                  : view === 'config' ? task?.name
                  : 'Pichón'}
              </div>
            </div>
            <button onClick={() => setView('cart')} className="relative p-2 text-slate-500">
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cart.length}</span>
              )}
            </button>
            <button onClick={() => setSettings(true)} className="p-2 text-slate-500">
              <Settings size={20} />
            </button>
          </div>
        )}

        {/* Views */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {view === 'home'     && <HomeContent categories={categories} catsByPhase={catsByPhase} onSelect={goCategory} totalBudget={totalBudget} cartCount={cart.length} onShowCart={() => setView('cart')} onShowWorkflow={() => setView('workflow')} onShowSettings={() => setSettings(true)} />}
          {view === 'workflow' && <WorkflowView categories={categories} onSelect={c => { goCategory(c); }} />}
          {view === 'subs'     && cat && <SubsContent cat={cat} onSelect={goSub} onBack={() => { setView('home'); setCat(null); }} />}
          {view === 'tasks'    && sub && cat && <TasksContent cat={cat} sub={sub} search={search} onSearch={setSearch} onSelect={goTask} onBack={() => { setView('subs'); setSub(null); }} />}
          {view === 'config'   && task && cat && <ConfigContent task={task} cat={cat} sub={sub} results={results} qty={qty} onQtyChange={setQty} leftovers={leftovers} onLeftoversChange={setLeftovers} onAdd={addCart} onBack={() => { setView('tasks'); setTask(null); }} />}
          {view === 'cart'     && <CartView onBack={() => setView(sub ? 'tasks' : cat ? 'subs' : 'home')} />}
        </div>
      </div>

      {/* ─── BOTTOM NAV (mobile only) ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#111827] border-t border-white/[0.06] flex z-50">
        {[
          { id: 'home',     icon: <Home size={20} />,       label: 'Inicio'    },
          { id: 'workflow', icon: <GitBranch size={20} />,  label: 'Diagrama'  },
          { id: 'cart',     icon: <ShoppingCart size={20} />, label: 'Presupuesto', badge: cart.length },
          { id: 'settings', icon: <Settings size={20} />,   label: 'Config'    },
        ].map(item => {
          const isCurrent = item.id !== 'settings' && view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => item.id === 'settings' ? setSettings(true) : setView(item.id as View)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
                isCurrent ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge! > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{item.badge}</span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {settings && <SettingsPanel onClose={() => setSettings(false)} />}
    </div>
  );
}

/* ─── SIDEBAR BUTTON ─────────────────────────────────────────────────────── */
function SidebarBtn({ icon, label, active, onClick, activeIconClass, badge }: {
  icon: React.ReactNode; label: string; active: boolean;
  onClick: () => void; activeIconClass?: string; badge?: string;
}) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all text-left ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'}`}>
      <span className={`flex-shrink-0 ${active && activeIconClass ? activeIconClass : ''}`}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">{badge}</span>}
    </button>
  );
}

/* ─── HOME VIEW ──────────────────────────────────────────────────────────── */
function HomeContent({ categories, catsByPhase, onSelect, totalBudget, cartCount, onShowCart, onShowWorkflow, onShowSettings }: {
  categories: Category[]; catsByPhase: Record<Phase, Category[]>;
  onSelect: (c: Category) => void; totalBudget: number; cartCount: number;
  onShowCart: () => void; onShowWorkflow: () => void; onShowSettings: () => void;
}) {
  const totalTasks = useMemo(
    () => categories.reduce((a, c) => a + c.subcategories.reduce((b, s) => b + s.tasks.length, 0), 0),
    [categories]
  );

  return (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
      {/* Mobile logo header */}
      <div className="md:hidden flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Logo size={20} className="text-white" />
          </div>
          <div>
            <div className="text-slate-900 font-bold text-base leading-none">Pichón</div>
            <div className="text-slate-400 text-xs mt-0.5">Gestión de Obra</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onShowCart} className="relative p-2 text-slate-500">
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
          </button>
          <button onClick={onShowSettings} className="p-2 text-slate-500"><Settings size={22} /></button>
        </div>
      </div>

      {/* Desktop hero */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-10 py-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Obra</h1>
        <p className="text-slate-500 mt-1.5">Base BC3 — <span className="font-semibold text-slate-700">{categories.length}</span> rubros · <span className="font-semibold text-slate-700">{totalTasks.toLocaleString()}</span> tareas</p>
        <div className="mt-6 flex gap-4">
          {(['A', 'B', 'C'] as Phase[]).map(p => {
            const pc = PHASE[p];
            const tasks = catsByPhase[p].reduce((a, c) => a + c.subcategories.reduce((b, s) => b + s.tasks.length, 0), 0);
            return (
              <div key={p} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${pc.dot}`} />
                <div><div className="text-xs text-slate-500 font-medium">{pc.label}</div><div className="text-sm font-bold text-slate-800">{tasks.toLocaleString()} tareas</div></div>
              </div>
            );
          })}
          {cartCount > 0 && (
            <button onClick={onShowCart} className="ml-auto flex items-center gap-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl px-5 py-3 text-white shadow-lg shadow-blue-900/20">
              <ShoppingCart size={16} />
              <div className="text-left"><div className="text-xs text-blue-200 font-medium">{cartCount} tareas</div><div className="text-sm font-bold">${totalBudget.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div></div>
            </button>
          )}
        </div>
      </div>

      {/* Mobile budget card */}
      {cartCount > 0 && (
        <button onClick={onShowCart} className="md:hidden mx-4 mt-0 mb-2 w-[calc(100%-2rem)] bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-900/20">
          <div><div className="text-blue-200 text-xs font-medium mb-0.5">{cartCount} tareas cargadas</div><div className="text-xl font-bold">${totalBudget.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div></div>
          <ChevronRight size={20} className="text-blue-300" />
        </button>
      )}

      {/* Mobile workflow shortcut */}
      <button onClick={onShowWorkflow} className="md:hidden mx-4 mb-4 w-[calc(100%-2rem)] bg-slate-800 text-slate-300 p-4 rounded-2xl flex items-center gap-3 border border-white/10">
        <GitBranch size={18} className="text-slate-400" />
        <span className="text-sm font-medium">Ver Diagrama de Obra</span>
        <ChevronRight size={16} className="ml-auto text-slate-500" />
      </button>

      {/* Category sections */}
      <div className="px-4 md:px-10 pb-4 md:pb-10 space-y-6 md:space-y-10">
        {(['A', 'B', 'C'] as Phase[]).map(p => {
          const cats = catsByPhase[p];
          if (!cats.length) return null;
          const pc = PHASE[p];
          return (
            <section key={p}>
              <div className="flex items-center gap-3 mb-3 md:mb-5">
                <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                <h2 className="text-sm md:text-base font-bold text-slate-800">{pc.label}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pc.badge}`}>Fase {p}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {cats.map(c => {
                  const Icon = CAT_ICON[c.id] || Package;
                  const taskCount = c.subcategories.reduce((a, s) => a + s.tasks.length, 0);
                  return (
                    <button key={c.id} onClick={() => onSelect(c)}
                      className={`group bg-white border border-slate-200 ${pc.cardHover} hover:shadow-lg p-3 md:p-5 rounded-xl md:rounded-2xl transition-all text-left`}>
                      <div className={`inline-flex p-2 md:p-3 rounded-xl mb-2 md:mb-4 transition-transform group-hover:scale-110 ${pc.iconBg}`}>
                        <Icon size={16} className={pc.iconColor} />
                      </div>
                      <div className="font-semibold text-slate-800 text-xs md:text-sm leading-snug">{c.name}</div>
                      <div className="text-[11px] md:text-xs text-slate-400 mt-1.5">{c.subcategories.length} sec. · {taskCount} tar.</div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ─── SUBCATEGORIES ──────────────────────────────────────────────────────── */
function SubsContent({ cat, onSelect, onBack }: { cat: Category; onSelect: (s: SubCategory) => void; onBack: () => void }) {
  const p  = cat.phase as Phase | undefined;
  const pc = p ? PHASE[p] : null;
  return (
    <div className="flex flex-col h-full">
      <div className="hidden md:flex bg-white border-b border-slate-200 px-8 py-5 items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition text-slate-500"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          {pc && <div className="flex items-center gap-1.5 text-xs mb-0.5"><span className={pc.text + ' font-medium'}>{pc.label}</span><ChevronRight size={11} className="text-slate-300" /><span className="text-slate-400">{cat.name}</span></div>}
          <h1 className="text-xl font-bold text-slate-900">{cat.name}</h1>
        </div>
        {pc && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pc.badge}`}>Fase {p}</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {cat.subcategories.map(s => (
            <button key={s.id} onClick={() => onSelect(s)}
              className="group bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg p-4 md:p-5 rounded-xl transition-all text-left">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-slate-100 group-hover:bg-blue-50 rounded-xl transition-colors">
                  <LayoutGrid size={15} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <span className="text-xs font-medium text-slate-400">{s.tasks.length}</span>
              </div>
              <div className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-blue-700 transition-colors">{s.name}</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Ver tareas <ChevronRight size={11} /></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── TASK LIST ──────────────────────────────────────────────────────────── */
function TasksContent({ cat, sub, search, onSearch, onSelect, onBack }: {
  cat: Category; sub: SubCategory; search: string;
  onSearch: (s: string) => void; onSelect: (t: Task) => void; onBack: () => void;
}) {
  const filtered = search ? sub.tasks.filter(t => t.name.toLowerCase().includes(search.toLowerCase())) : sub.tasks;
  return (
    <div className="flex flex-col h-full">
      <div className="hidden md:flex bg-white border-b border-slate-200 px-8 py-4 items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition text-slate-500"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5"><span>{cat.name}</span><ChevronRight size={11} className="text-slate-300" /><span className="text-slate-600 font-medium">{sub.name}</span></div>
          <h1 className="text-lg font-bold text-slate-900">{sub.name}</h1>
        </div>
        <div className="relative flex-shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar tarea..." value={search} onChange={e => onSearch(e.target.value)}
            className="pl-9 pr-8 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
          {search && <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={13} /></button>}
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar tarea..." value={search} onChange={e => onSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {search && <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={13} /></button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        {search && <p className="text-sm text-slate-500 mb-3 font-medium">{filtered.length} resultados</p>}
        <div className="space-y-1.5">
          {filtered.map(t => (
            <button key={t.id} onClick={() => onSelect(t)}
              className="group w-full bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all text-left">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors leading-snug">{t.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                <span className="font-mono bg-slate-100 group-hover:bg-blue-50 px-2 py-0.5 rounded text-slate-500 group-hover:text-blue-600 transition-colors">{t.unit}</span>
                <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── TASK CONFIG ────────────────────────────────────────────────────────── */
function ConfigContent({ task, cat, sub, results, qty, onQtyChange, leftovers: _leftovers, onLeftoversChange, onAdd, onBack }: {
  task: Task; cat: Category; sub: SubCategory | null; results: TaskResults | null;
  qty: number; onQtyChange: (q: number) => void; leftovers: Record<string, number>;
  onLeftoversChange: (l: Record<string, number>) => void; onAdd: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Desktop header */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-8 py-4 items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition text-slate-500"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
            {sub && <><span>{sub.name}</span><ChevronRight size={11} className="text-slate-300" /></>}
          </div>
          <h1 className="text-base font-bold text-slate-900 truncate">{task.name}</h1>
        </div>
        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg flex-shrink-0 font-semibold">{task.unit}</span>
      </div>

      {/* Desktop: 2-column */}
      <div className="hidden md:grid flex-1 overflow-hidden" style={{ gridTemplateColumns: '2fr 3fr' }}>
        <div className="overflow-y-auto bg-white border-r border-slate-200 p-8 flex flex-col gap-8">
          <TaskConfigurator task={task} phase={cat.phase} onQuantityChange={onQtyChange} onAppliedLeftoversChange={onLeftoversChange} />
          <button onClick={onAdd} disabled={qty <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-900/20 text-sm flex items-center justify-center gap-2">
            {qty > 0 && results ? <>Agregar al Presupuesto <span className="font-normal opacity-80">— ${results.grandTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span></> : 'Agregar al Presupuesto'}
          </button>
        </div>
        <div className="overflow-y-auto bg-slate-50 p-8">
          <ResultsDashboard task={task} results={results} />
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden flex-1 overflow-y-auto pb-36">
        <div className="p-4 space-y-6">
          <TaskConfigurator task={task} phase={cat.phase} onQuantityChange={onQtyChange} onAppliedLeftoversChange={onLeftoversChange} />
          {results && (
            <div className="bg-slate-100 rounded-2xl p-4">
              <ResultsDashboard task={task} results={results} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile: sticky add button */}
      <div className="md:hidden fixed bottom-16 inset-x-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-40">
        <button onClick={onAdd} disabled={qty <= 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
          {qty > 0 && results ? <>Agregar — ${results.grandTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</> : 'Ingresá una cantidad'}
        </button>
      </div>
    </div>
  );
}

/* ─── WORKFLOW VIEW ──────────────────────────────────────────────────────── */
function WorkflowView({ categories, onSelect }: { categories: Category[]; onSelect: (c: Category) => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="hidden md:flex bg-white border-b border-slate-200 px-8 py-5 items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Diagrama de Obra</h1>
          <p className="text-sm text-slate-500 mt-0.5">Camino crítico — hacé click en un rubro para explorar sus tareas</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          {(['A','B','C'] as const).map(p => {
            const colors = { A: 'bg-sky-400', B: 'bg-amber-400', C: 'bg-emerald-400' };
            const labels = { A: 'Cimientos', B: 'Estructura', C: 'Terminaciones' };
            return <div key={p} className="flex items-center gap-1.5 text-slate-500"><span className={`w-2 h-2 rounded-full ${colors[p]}`} />{labels[p]}</div>;
          })}
        </div>
      </div>
      <div className="flex-1 overflow-hidden pb-16 md:pb-0">
        <ConstructionMap categories={categories} onCategorySelect={onSelect} />
      </div>
    </div>
  );
}


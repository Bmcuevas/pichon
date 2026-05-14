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
  D: Hammer,
  A: Mountain,
  C: Building2,
  E: Layers,
  F: LayoutGrid,
  N: Shield,
  Q: Layers,
  I: Zap,
  L: DoorOpen,
  R: Grid3X3,
  S: Tag,
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
    }, 0),
    [cart, getHourlyRate]
  );

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

      {/* ─── SIDEBAR ────────────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-[#111827] border-r border-white/[0.06]">

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
          <SidebarBtn
            icon={<GitBranch size={15} />}
            label="Diagrama de Obra"
            active={view === 'workflow'}
            onClick={() => setView('workflow')}
          />
        </div>

        {/* Categories grouped by phase */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
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
                    <SidebarBtn
                      key={c.id}
                      icon={<Icon size={15} />}
                      label={c.name}
                      active={cat?.id === c.id}
                      onClick={() => goCategory(c)}
                      activeIconClass="text-blue-400"
                    />
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom: cart + settings */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/[0.06] pt-3">
          <SidebarBtn
            icon={
              <div className="relative">
                <ShoppingCart size={15} />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {cart.length}
                  </span>
                )}
              </div>
            }
            label="Presupuesto"
            active={view === 'cart'}
            onClick={() => setView('cart')}
            badge={totalBudget > 0 ? `$${(totalBudget / 1_000_000).toFixed(1)}M` : undefined}
          />
          <SidebarBtn icon={<Settings size={15} />} label="Configuración" active={false} onClick={() => setSettings(true)} />
        </div>
      </aside>

      {/* ─── CONTENT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

        {view === 'home' && (
          <HomeContent
            categories={categories}
            catsByPhase={catsByPhase}
            onSelect={goCategory}
            totalBudget={totalBudget}
            cartCount={cart.length}
            onShowCart={() => setView('cart')}
          />
        )}

        {view === 'workflow' && (
          <WorkflowView
            categories={categories}
            onSelect={c => { goCategory(c); }}
          />
        )}

        {view === 'subs' && cat && (
          <SubsContent cat={cat} onSelect={goSub} onBack={() => { setView('home'); setCat(null); }} />
        )}

        {view === 'tasks' && sub && cat && (
          <TasksContent
            cat={cat} sub={sub}
            search={search} onSearch={setSearch}
            onSelect={goTask}
            onBack={() => { setView('subs'); setSub(null); }}
          />
        )}

        {view === 'config' && task && cat && (
          <ConfigContent
            task={task} cat={cat} sub={sub}
            results={results} qty={qty}
            onQtyChange={setQty}
            leftovers={leftovers} onLeftoversChange={setLeftovers}
            onAdd={addCart}
            onBack={() => { setView('tasks'); setTask(null); }}
          />
        )}

        {view === 'cart' && (
          <CartView onBack={() => setView(sub ? 'tasks' : cat ? 'subs' : 'home')} />
        )}
      </div>

      {settings && <SettingsPanel onClose={() => setSettings(false)} />}
    </div>
  );
}

/* ─── SIDEBAR BUTTON ─────────────────────────────────────────────────────── */
function SidebarBtn({
  icon, label, active, onClick, activeIconClass, badge
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  activeIconClass?: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all text-left ${
        active
          ? 'bg-white/10 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
      }`}
    >
      <span className={`flex-shrink-0 ${active && activeIconClass ? activeIconClass : ''}`}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">{badge}</span>}
    </button>
  );
}

/* ─── HOME VIEW ──────────────────────────────────────────────────────────── */
function HomeContent({
  categories, catsByPhase, onSelect, totalBudget, cartCount, onShowCart
}: {
  categories: Category[];
  catsByPhase: Record<Phase, Category[]>;
  onSelect: (c: Category) => void;
  totalBudget: number;
  cartCount: number;
  onShowCart: () => void;
}) {
  const totalTasks = useMemo(
    () => categories.reduce((a, c) => a + c.subcategories.reduce((b, s) => b + s.tasks.length, 0), 0),
    [categories]
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="bg-white border-b border-slate-200 px-10 py-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Obra</h1>
        <p className="text-slate-500 mt-1.5">
          Base BC3 — <span className="font-semibold text-slate-700">{categories.length}</span> rubros ·{' '}
          <span className="font-semibold text-slate-700">{totalTasks.toLocaleString()}</span> tareas
        </p>

        {/* Stats row */}
        <div className="mt-6 flex gap-4">
          {(['A', 'B', 'C'] as Phase[]).map(p => {
            const pc = PHASE[p];
            const cats = catsByPhase[p];
            const tasks = cats.reduce((a, c) => a + c.subcategories.reduce((b, s) => b + s.tasks.length, 0), 0);
            return (
              <div key={p} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${pc.dot}`} />
                <div>
                  <div className="text-xs text-slate-500 font-medium">{pc.label}</div>
                  <div className="text-sm font-bold text-slate-800">{tasks.toLocaleString()} tareas</div>
                </div>
              </div>
            );
          })}

          {cartCount > 0 && (
            <button
              onClick={onShowCart}
              className="ml-auto flex items-center gap-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl px-5 py-3 text-white shadow-lg shadow-blue-900/20"
            >
              <ShoppingCart size={16} />
              <div className="text-left">
                <div className="text-xs text-blue-200 font-medium">{cartCount} tareas</div>
                <div className="text-sm font-bold">${totalBudget.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Category grid grouped by phase */}
      <div className="p-10 space-y-10">
        {(['A', 'B', 'C'] as Phase[]).map(p => {
          const cats = catsByPhase[p];
          if (!cats.length) return null;
          const pc = PHASE[p];
          return (
            <section key={p}>
              <div className="flex items-center gap-3 mb-5">
                <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                <h2 className="text-base font-bold text-slate-800">{pc.label}</h2>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${pc.badge}`}>Fase {p}</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cats.map(c => {
                  const Icon = CAT_ICON[c.id] || Package;
                  const taskCount = c.subcategories.reduce((a, s) => a + s.tasks.length, 0);
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelect(c)}
                      className={`group bg-white border border-slate-200 ${pc.cardHover} hover:shadow-lg p-5 rounded-2xl transition-all text-left`}
                    >
                      <div className={`inline-flex p-3 rounded-xl mb-4 transition-transform group-hover:scale-110 ${pc.iconBg}`}>
                        <Icon size={20} className={pc.iconColor} />
                      </div>
                      <div className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                        <span>{c.subcategories.length} secciones</span>
                        <span className="text-slate-300">·</span>
                        <span>{taskCount} tareas</span>
                      </div>
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

/* ─── SUBCATEGORIES VIEW ─────────────────────────────────────────────────── */
function SubsContent({
  cat, onSelect, onBack
}: {
  cat: Category;
  onSelect: (s: SubCategory) => void;
  onBack: () => void;
}) {
  const p  = cat.phase as Phase | undefined;
  const pc = p ? PHASE[p] : null;

  return (
    <div className="flex flex-col h-full">
      <ContentHeader
        onBack={onBack}
        breadcrumb={pc ? [{ label: pc.label, className: pc.text }] : []}
        title={cat.name}
        badge={p && pc ? { label: `Fase ${p}`, className: pc.badge } : undefined}
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cat.subcategories.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="group bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 p-5 rounded-2xl transition-all text-left"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-slate-100 group-hover:bg-blue-50 rounded-xl transition-colors">
                  <LayoutGrid size={16} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <span className="text-xs font-medium text-slate-400 tabular-nums">{s.tasks.length}</span>
              </div>
              <div className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-blue-700 transition-colors">
                {s.name}
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Ver tareas <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── TASK LIST VIEW ─────────────────────────────────────────────────────── */
function TasksContent({
  cat, sub, search, onSearch, onSelect, onBack
}: {
  cat: Category;
  sub: SubCategory;
  search: string;
  onSearch: (s: string) => void;
  onSelect: (t: Task) => void;
  onBack: () => void;
}) {
  const filtered = search
    ? sub.tasks.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : sub.tasks;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-700">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
            <span>{cat.name}</span>
            <ChevronRight size={11} className="text-slate-300" />
            <span className="text-slate-600 font-medium">{sub.name}</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">{sub.name}</h1>
        </div>
        <div className="relative flex-shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar tarea..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="pl-9 pr-8 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          {search && (
            <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {search && (
          <p className="text-sm text-slate-500 mb-4 font-medium">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{search}"
          </p>
        )}
        <div className="space-y-1.5">
          {filtered.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="group w-full bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md px-5 py-3.5 rounded-xl flex items-center gap-4 transition-all text-left"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors leading-snug">
                  {t.name}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                <span className="font-mono bg-slate-100 group-hover:bg-blue-50 px-2 py-0.5 rounded text-slate-500 group-hover:text-blue-600 transition-colors">
                  {t.unit}
                </span>
                <span className="text-slate-400 w-14 text-right">{t.apu.materials.length} mat.</span>
                <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── CONFIG VIEW (2-column) ─────────────────────────────────────────────── */
function ConfigContent({
  task, cat, sub, results, qty, onQtyChange,
  leftovers: _leftovers, onLeftoversChange, onAdd, onBack
}: {
  task: Task;
  cat: Category;
  sub: SubCategory | null;
  results: TaskResults | null;
  qty: number;
  onQtyChange: (q: number) => void;
  leftovers: Record<string, number>;
  onLeftoversChange: (l: Record<string, number>) => void;
  onAdd: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-700">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
            {sub && (
              <>
                <span>{sub.name}</span>
                <ChevronRight size={11} className="text-slate-300" />
              </>
            )}
            <span className="text-slate-600 font-medium truncate">{task.name}</span>
          </div>
          <h1 className="text-base font-bold text-slate-900 truncate">{task.name}</h1>
        </div>
        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg flex-shrink-0 font-semibold">
          {task.unit}
        </span>
      </div>

      {/* 2-column body */}
      <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: '2fr 3fr' }}>

        {/* Left: inputs */}
        <div className="overflow-y-auto bg-white border-r border-slate-200 p-8 flex flex-col gap-8">
          <TaskConfigurator
            task={task}
            phase={cat.phase}
            onQuantityChange={onQtyChange}
            onAppliedLeftoversChange={onLeftoversChange}
          />

          <button
            onClick={onAdd}
            disabled={qty <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-900/20 text-sm flex items-center justify-center gap-2"
          >
            {qty > 0 && results
              ? <>Agregar al Presupuesto <span className="font-normal opacity-80">— ${results.grandTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span></>
              : 'Agregar al Presupuesto'
            }
          </button>
        </div>

        {/* Right: results */}
        <div className="overflow-y-auto bg-slate-50 p-8">
          <ResultsDashboard task={task} results={results} />
        </div>
      </div>
    </div>
  );
}

/* ─── WORKFLOW VIEW ──────────────────────────────────────────────────────── */
function WorkflowView({
  categories, onSelect
}: {
  categories: Category[];
  onSelect: (c: Category) => void;
}) {
  const hasPhases = categories.some(c => c.phase);
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Diagrama de Obra</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Camino crítico — hacé click en un rubro para explorar sus tareas
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          {(['A','B','C'] as const).map(p => {
            const colors = { A: 'bg-sky-400', B: 'bg-amber-400', C: 'bg-emerald-400' };
            const labels = { A: 'Cimientos', B: 'Estructura', C: 'Terminaciones' };
            return (
              <div key={p} className="flex items-center gap-1.5 text-slate-500">
                <span className={`w-2 h-2 rounded-full ${colors[p]}`} />
                {labels[p]}
              </div>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 overflow-hidden">
        {hasPhases ? (
          <ConstructionMap categories={categories} onCategorySelect={onSelect} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            No hay datos de fase disponibles.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CONTENT HEADER (shared) ────────────────────────────────────────────── */
function ContentHeader({
  onBack, breadcrumb, title, badge
}: {
  onBack: () => void;
  breadcrumb: { label: string; className?: string }[];
  title: string;
  badge?: { label: string; className: string };
}) {
  return (
    <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center gap-4 flex-shrink-0">
      <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-700">
        <ArrowLeft size={18} />
      </button>
      <div className="flex-1">
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs mb-0.5">
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={11} className="text-slate-300" />}
                <span className={b.className || 'text-slate-400'}>{b.label}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      </div>
      {badge && (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${badge.className}`}>
          {badge.label}
        </span>
      )}
    </div>
  );
}

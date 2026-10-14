import React, { useState, useEffect, useRef } from 'react';
import { ALL_TOOLS, TOOL_CATEGORIES, ToolId, ToolCategoryId } from '../types/tools';
import {
  Search, Sparkles, Crop, Maximize2, ArrowUpDown, Layers, Scissors,
  Minimize2 as MinimizeIcon, Ruler, QrCode, Type, Palette, Code, KeyRound,
  Clock, ArrowRight, ShieldCheck, Zap, X, Command
} from 'lucide-react';
import { animate, stagger } from 'animejs';

interface DashboardPageProps { onSelectTool: (id: ToolId) => void; }

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sparkles, Crop, Maximize2, ArrowUpDown, Layers, Scissors, Minimize2: MinimizeIcon,
  Ruler, QrCode, Type, Palette, Code, KeyRound, Clock
};
const CATEGORY_COLORS: Record<ToolCategoryId, { gradient: string; text: string; bg: string; border: string; label: string }> = {
  image: { gradient: 'from-violet-500 to-fuchsia-500', text: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', label: 'bg-violet-50 text-violet-700' },
  pdf: { gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'bg-emerald-50 text-emerald-700' },
  converters: { gradient: 'from-blue-500 to-cyan-500', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'bg-blue-50 text-blue-700' },
  developer: { gradient: 'from-rose-500 to-orange-500', text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', label: 'bg-rose-50 text-rose-700' },
  productivity: { gradient: 'from-amber-500 to-orange-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'bg-amber-50 text-amber-700' }
};

export default function DashboardPage({ onSelectTool }: DashboardPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategoryId | 'all'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = containerRef.current?.querySelectorAll('.dashboard-intro > *');
    if (items?.length) animate(items, { opacity: [0, 1], y: [14, 0], delay: stagger(75), duration: 550, ease: 'outExpo' });
  }, []);

  useEffect(() => {
    const cards = cardsContainerRef.current?.querySelectorAll('.tool-grid-card');
    if (cards?.length) {
      animate(cards, { opacity: [0, 1], y: [10, 0], delay: stagger(22), duration: 300, ease: 'outQuad' });
    }
  }, [selectedCategory, searchQuery]);

  const filteredTools = ALL_TOOLS.filter((tool) => {
    if (selectedCategory !== 'all' && tool.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return tool.name.toLowerCase().includes(query) || tool.shortDesc.toLowerCase().includes(query) ||
      tool.keywords.some((keyword) => keyword.toLowerCase().includes(query));
  });

  return (
    <div ref={containerRef} className="craze-dashboard p-4 sm:p-6 lg:p-8 space-y-8">
      <section className="dashboard-intro dashboard-hero-v2 relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="dashboard-hero-pattern" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/75 px-3 py-1.5 text-[11px] font-bold tracking-wide text-violet-700 shadow-sm backdrop-blur">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
            YOUR EVERYDAY DIGITAL WORKSPACE
          </div>
          <h2 className="mt-5 max-w-2xl text-3xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Get more done. <span className="dashboard-gradient-text">With less effort.</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            A carefully curated toolkit for images, PDFs, everyday conversions and developer tasks — fast, simple, and right in your browser.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <div className="hero-perk"><Zap size={15} className="text-amber-500" /><span>Fast, local processing</span></div>
            <div className="hero-perk"><ShieldCheck size={15} className="text-emerald-600" /><span>Privacy-minded tools</span></div>
          </div>
        </div>
        <div className="dashboard-hero-art hidden lg:flex" aria-hidden="true">
          <div className="hero-art-orbit hero-art-orbit-one" />
          <div className="hero-art-orbit hero-art-orbit-two" />
          <div className="hero-art-tile hero-art-tile-main"><Layers size={35} /><span>One workspace</span><strong>15 useful tools</strong></div>
          <div className="hero-art-tile hero-art-tile-small"><Sparkles size={18} /><span>Made to feel simple</span></div>
          <div className="hero-art-dot hero-art-dot-one" /><div className="hero-art-dot hero-art-dot-two" />
        </div>
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-fuchsia-200/45 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-36 right-1/3 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" aria-hidden="true" />
      </section>

      <section className="space-y-4" aria-label="Browse tools">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-violet-600">THE TOOLBOX</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">What do you need today?</h2>
            <p className="mt-1 text-sm text-slate-500">Pick a tool and get straight to work.</p>
          </div>
          <label className="dashboard-search group relative block w-full xl:max-w-sm">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-600" />
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search tools by name or feature" placeholder="Search all tools..." />
            {searchQuery ? <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Clear search"><X size={15} /></button> : <span className="search-shortcut hidden sm:flex"><Command size={11} /> K</span>}
          </label>
        </div>

        <div className="category-filter-row" role="group" aria-label="Filter tools by category">
          <button onClick={() => setSelectedCategory('all')} aria-pressed={selectedCategory === 'all'} className={`category-filter ${selectedCategory === 'all' ? 'is-active' : ''}`}>All tools <span>{ALL_TOOLS.length}</span></button>
          {TOOL_CATEGORIES.map((category) => {
            const theme = CATEGORY_COLORS[category.id];
            const active = selectedCategory === category.id;
            const count = ALL_TOOLS.filter((tool) => tool.category === category.id).length;
            return <button key={category.id} onClick={() => setSelectedCategory(category.id)} aria-pressed={active}
              className={`category-filter ${active ? 'is-active' : ''}`}><span className={`category-dot bg-gradient-to-r ${theme.gradient}`} />{category.name}<span>{count}</span></button>;
          })}
        </div>
      </section>

      <section ref={cardsContainerRef} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Available tools" aria-live="polite">
        {filteredTools.map((tool) => {
          const Icon = ICON_MAP[tool.iconName] || Sparkles;
          const theme = CATEGORY_COLORS[tool.category];
          return <button key={tool.id} type="button" onClick={() => onSelectTool(tool.id)}
            className="tool-grid-card-v2 group text-left" aria-label={`Open ${tool.name}: ${tool.shortDesc}`}>
            <span className={`tool-card-topline bg-gradient-to-r ${theme.gradient}`} />
            <span className="flex items-start justify-between gap-3">
              <span className={`tool-card-icon ${theme.bg} ${theme.text} `}><Icon size={22} strokeWidth={1.8} /></span>
              {tool.badge && <span className={`tool-card-badge ${theme.label}`}>{tool.badge}</span>}
            </span>
            <span className="mt-5 block">
              <span className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-violet-700">{tool.name}</span>
              <span className="mt-2 block min-h-[2.75rem] text-[13px] leading-[1.45rem] text-slate-500">{tool.shortDesc}</span>
            </span>
            <span className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
              <span className={`rounded-lg px-2 py-1 text-[10px] font-bold capitalize ${theme.label}`}>{tool.category}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors group-hover:text-violet-700">Open tool <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
            </span>
          </button>;
        })}
      </section>

      {filteredTools.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm"><Search size={20} /></div>
        <h3 className="mt-4 text-base font-extrabold text-slate-900">No matching tools</h3>
        <p className="mt-1 text-sm text-slate-500">Try another search or clear the active filters.</p>
        <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700">Clear filters</button>
      </div>}
      <div className="dashboard-bottom-note"><ShieldCheck size={15} /><span>Built for a smoother workflow.</span><span className="bottom-note-divider" /><span>{filteredTools.length} tools shown</span></div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  ALL_TOOLS,
  TOOL_CATEGORIES,
  ToolId,
  ToolCategoryId,
  ToolItem
} from '../types/tools';
import {
  Search,
  Sparkles,
  Crop,
  Maximize2,
  ArrowUpDown,
  Layers,
  Scissors,
  Minimize2 as MinimizeIcon,
  Ruler,
  QrCode,
  Type,
  Palette,
  Code,
  KeyRound,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ExternalLink,
  Flame,
  Star
} from 'lucide-react';
import { animate, stagger } from 'animejs';

interface DashboardPageProps {
  onSelectTool: (id: ToolId) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sparkles,
  Crop,
  Maximize2,
  ArrowUpDown,
  Layers,
  Scissors,
  Minimize2: MinimizeIcon,
  Ruler,
  QrCode,
  Type,
  Palette,
  Code,
  KeyRound,
  Clock
};

// Category theme colors
const CATEGORY_COLORS: Record<
  ToolCategoryId,
  { gradient: string; text: string; bg: string; border: string; badge: string }
> = {
  image: {
    gradient: 'from-violet-600 via-indigo-600 to-purple-600',
    text: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-800'
  },
  pdf: {
    gradient: 'from-emerald-600 via-teal-600 to-green-600',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800'
  },
  converters: {
    gradient: 'from-blue-600 via-sky-600 to-cyan-600',
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800'
  },
  developer: {
    gradient: 'from-rose-600 via-pink-600 to-orange-500',
    text: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-800'
  },
  productivity: {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800'
  }
};

export default function DashboardPage({ onSelectTool }: DashboardPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategoryId | 'all'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heroItems = containerRef.current?.querySelectorAll('.dashboard-hero-content > *');
    if (heroItems?.length) {
      animate(heroItems, {
        opacity: [0, 1],
        y: [18, 0],
        duration: 620,
        delay: stagger(90),
        ease: 'outExpo'
      });
    }
  }, []);

  useEffect(() => {
    if (!cardsContainerRef.current) return;
    try {
      const cards = cardsContainerRef.current.querySelectorAll('.tool-grid-card');
      if (cards.length > 0) {
        animate(cards, {
          opacity: [0, 1],
          y: [12, 0],
          duration: 320,
          delay: stagger(24),
          ease: 'outQuad'
        });
      }
    } catch (err) {
      console.warn('Anime error:', err);
    }
  }, [selectedCategory, searchQuery]);

  // Filter tools
  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const inName = tool.name.toLowerCase().includes(query);
    const inDesc = tool.shortDesc.toLowerCase().includes(query);
    const inKeywords = tool.keywords.some((k) => k.toLowerCase().includes(query));
    return inName || inDesc || inKeywords;
  });

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-8">
      {/* Colorful Gradient Hero Banner */}
      <div className="dashboard-hero bg-gradient-to-r from-indigo-950 via-violet-950 to-slate-950 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-xl border border-indigo-400/20">
        <div className="dashboard-hero-content relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-rose-500/30 border border-amber-300/40 text-amber-200 text-xs font-bold backdrop-blur-md shadow-xs">
            <Sparkles size={14} className="text-amber-300 animate-pulse" />
            <span>15 High-Performance Client-Side Utilities</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Your Colorful, All-in-One Daily Toolbox.
          </h2>

          <p className="text-sm md:text-base text-indigo-100/90 leading-relaxed font-medium">
            Smart image enhancer & compressor, interactive drag-to-reorder PDF manager, universal unit converters, QR codes, color studio, code formatters, and secure cryptotools.
          </p>

          {/* Quick perks */}
          <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-md border border-white/10 shadow-xs">
              <Zap size={15} className="text-amber-400" />
              <span>Zero file bloat & lightning fast</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-md border border-white/10 shadow-xs">
              <ShieldCheck size={15} className="text-emerald-400" />
              <span>100% Client-Side Privacy</span>
            </div>
          </div>
        </div>

        {/* Dynamic colorful background blobs */}
        <div className="dashboard-hero-orb absolute -right-10 -top-10 w-96 h-96 bg-gradient-to-br from-pink-500/35 to-indigo-500/40 rounded-full blur-3xl pointer-events-none" />
        <div className="dashboard-hero-orb absolute right-40 -bottom-20 w-80 h-80 bg-gradient-to-tr from-cyan-500/25 to-emerald-500/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Search & Category Filter Navigation */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box with glowing focus */}
          <div className="relative flex-1 max-w-md">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tools by name or feature"\n              placeholder="Search tools: compress, enhance, PDF, QR..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 text-xs font-bold rounded-2xl whitespace-nowrap transition-all border ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Tools ({ALL_TOOLS.length})
            </button>
            {TOOL_CATEGORIES.map((cat) => {
              const theme = CATEGORY_COLORS[cat.id];
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-2xl whitespace-nowrap transition-all border ${
                    isSelected
                      ? `bg-gradient-to-r ${theme.gradient} text-white border-transparent shadow-md`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Colorful Animated Tools Grid */}
      <div ref={cardsContainerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" aria-live="polite">
        {filteredTools.map((tool) => {
          const IconComp = ICON_MAP[tool.iconName] || Sparkles;
          const theme = CATEGORY_COLORS[tool.category];

          return (
            <div
              key={tool.id}
              role="button"
              tabIndex={0}
              aria-label={`Open ${tool.name}: ${tool.shortDesc}`}
              onClick={() => onSelectTool(tool.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectTool(tool.id);
                }
              }}
              className="tool-grid-card group bg-white rounded-3xl border border-slate-200 p-5 hover:border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              {/* Colorful gradient hover accent header */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
              />

              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl ${theme.bg} ${theme.text} group-hover:scale-110 flex items-center justify-center transition-transform shadow-2xs`}
                  >
                    <IconComp size={22} />
                  </div>

                  {tool.badge && (
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${theme.badge} border ${theme.border}`}
                    >
                      {tool.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                    {tool.shortDesc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                <span className="capitalize text-[11px] font-semibold text-slate-400">{tool.category}</span>
                <span className="flex items-center gap-1 text-indigo-600">
                  Open Tool <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <p className="text-sm font-bold text-slate-700">No tools found matching "{searchQuery}"</p>
          <p className="text-xs text-slate-500">Try searching for "compress", "enhance", "pdf", or "color".</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

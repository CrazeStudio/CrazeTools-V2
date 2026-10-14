import React, { useState, useEffect, useRef, Suspense } from 'react';
import { animate } from 'animejs';
import {
  ALL_TOOLS,
  TOOL_CATEGORIES,
  ToolId,
  ToolItem,
  ToolCategoryId
} from './types/tools';
import { cleanupAllBlobUrls } from './utils/memoryManager';
import StepLoader from './components/StepLoader';

// Step-by-Step Lazy Loaded Components (Zero upfront memory overhead)
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ImageEnhancePage = React.lazy(() => import('./pages/ImageEnhancePage'));
const ImageCropPage = React.lazy(() => import('./pages/ImageCropPage'));
const ImageResizePage = React.lazy(() => import('./pages/ImageResizePage'));
const ImageCompressPage = React.lazy(() => import('./pages/ImageCompressPage'));
const PdfOrganizePage = React.lazy(() => import('./pages/PdfOrganizePage'));
const PdfMergePage = React.lazy(() => import('./pages/PdfMergePage'));
const PdfSplitPage = React.lazy(() => import('./pages/PdfSplitPage'));
const PdfCompressPage = React.lazy(() => import('./pages/PdfCompressPage'));
const UnitConverterPage = React.lazy(() => import('./pages/UnitConverterPage'));
const QrCodePage = React.lazy(() => import('./pages/QrCodePage'));
const TextToolsPage = React.lazy(() => import('./pages/TextToolsPage'));
const ColorStudioPage = React.lazy(() => import('./pages/ColorStudioPage'));
const JsonFormatterPage = React.lazy(() => import('./pages/JsonFormatterPage'));
const PasswordHashPage = React.lazy(() => import('./pages/PasswordHashPage'));
const TimeToolsPage = React.lazy(() => import('./pages/TimeToolsPage'));

// SVG Icons
import {
  LayoutDashboard,
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
  Menu,
  X,
  Search,
  ChevronRight,
  ShieldCheck,
  Zap,
  Cpu,
  Flame,
  CheckCircle2,
  Trash2,
  History
} from 'lucide-react';

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

const CATEGORY_COLORS: Record<
  ToolCategoryId,
  { gradient: string; text: string; bg: string; dot: string; glow: string }
> = {
  image: {
    gradient: 'from-violet-600 via-indigo-600 to-pink-500',
    text: 'text-violet-600',
    bg: 'bg-violet-50',
    dot: 'bg-violet-500',
    glow: 'rgba(139, 92, 246, 0.3)'
  },
  pdf: {
    gradient: 'from-emerald-600 via-teal-600 to-cyan-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
    glow: 'rgba(16, 185, 129, 0.3)'
  },
  converters: {
    gradient: 'from-blue-600 via-sky-600 to-cyan-500',
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    dot: 'bg-blue-500',
    glow: 'rgba(37, 99, 235, 0.3)'
  },
  developer: {
    gradient: 'from-rose-600 via-pink-600 to-orange-500',
    text: 'text-rose-600',
    bg: 'bg-rose-50',
    dot: 'bg-rose-500',
    glow: 'rgba(225, 29, 72, 0.3)'
  },
  productivity: {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500',
    glow: 'rgba(245, 158, 11, 0.3)'
  }
};

export default function App() {
  const [currentToolId, setCurrentToolId] = useState<ToolId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentTools, setRecentTools] = useState<ToolId[]>(['image-enhance', 'image-compress', 'pdf-organize']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts (Cmd+K, Ctrl+K, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show animated toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastRef.current) {
      try {
        animate(toastRef.current, {
          y: [-20, 0],
          opacity: [0, 1],
          duration: 250,
          ease: 'outQuad'
        });
      } catch (err) {
        console.warn(err);
      }
    }
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Smooth Anime.js transition & automatic memory reclamation on page switch
  useEffect(() => {
    cleanupAllBlobUrls();

    if (contentRef.current) {
      try {
        animate(contentRef.current, {
          opacity: [0.2, 1],
          y: [14, 0],
          duration: 320,
          ease: 'outQuad'
        });
      } catch (err) {
        console.warn('Anime error:', err);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentToolId]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  const currentTool = ALL_TOOLS.find((t) => t.id === currentToolId);

  const selectTool = (id: ToolId) => {
    setCurrentToolId(id);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setSearchQuery('');

    // Update recent tools
    if (id !== 'dashboard') {
      setRecentTools((prev) => [id, ...prev.filter((t) => t !== id)].slice(0, 4));
    }
  };

  const handlePurgeMemory = () => {
    cleanupAllBlobUrls();
    showToast('Memory sandbox purged. GPU texture buffers released.');
  };

  const filteredSearchTools = ALL_TOOLS.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.shortDesc.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const renderActivePage = () => {
    switch (currentToolId) {
      case 'dashboard':
        return <DashboardPage onSelectTool={selectTool} />;
      case 'image-enhance':
        return <ImageEnhancePage />;
      case 'image-crop':
        return <ImageCropPage />;
      case 'image-resize':
        return <ImageResizePage />;
      case 'image-compress':
        return <ImageCompressPage />;
      case 'pdf-organize':
        return <PdfOrganizePage />;
      case 'pdf-merge':
        return <PdfMergePage />;
      case 'pdf-split':
        return <PdfSplitPage />;
      case 'pdf-compress':
        return <PdfCompressPage />;
      case 'unit-converter':
        return <UnitConverterPage />;
      case 'qr-generator':
        return <QrCodePage />;
      case 'text-tools':
        return <TextToolsPage />;
      case 'color-studio':
        return <ColorStudioPage />;
      case 'json-formatter':
        return <JsonFormatterPage />;
      case 'password-hash':
        return <PasswordHashPage />;
      case 'time-tools':
        return <TimeToolsPage />;
      default:
        return <DashboardPage onSelectTool={selectTool} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Floating Animated Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-600/25 via-purple-600/25 to-pink-600/20 blur-3xl animate-orb-1" />
        <div className="absolute top-1/3 right-10 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-cyan-600/20 via-emerald-600/20 to-teal-600/20 blur-3xl animate-orb-2" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-gradient-to-tr from-amber-600/20 via-rose-600/20 to-violet-600/20 blur-3xl animate-orb-1" />
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          ref={toastRef}
          className="fixed top-20 right-6 z-50 bg-slate-950/90 text-white text-xs font-bold px-4 py-3 rounded-2xl border border-indigo-500/40 shadow-2xl backdrop-blur-md flex items-center gap-2.5"
        >
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-start justify-center pt-20 px-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <Search size={18} className="text-indigo-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools (Press Esc to close)..."
                className="w-full text-sm font-semibold bg-transparent outline-none placeholder:text-slate-500 text-white"
              />
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-700">
                ESC
              </span>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2 space-y-1">
              {filteredSearchTools.map((tool) => {
                const IconComp = ICON_MAP[tool.iconName] || Sparkles;
                const theme = CATEGORY_COLORS[tool.category];
                return (
                  <button
                    key={tool.id}
                    onClick={() => selectTool(tool.id)}
                    className="w-full p-3 rounded-2xl hover:bg-slate-800/80 text-left flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl ${theme.bg} ${theme.text} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                      >
                        <IconComp size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-indigo-300">
                          {tool.name}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {tool.shortDesc}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 px-2 py-0.5 rounded-md bg-slate-800">
                      {tool.category}
                    </span>
                  </button>
                );
              })}

              {filteredSearchTools.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  No tools found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Glowing Header */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-30 shadow-lg backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger & Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <button
                onClick={() => selectTool('dashboard')}
                className="flex items-center gap-3 text-left group"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform animate-gradient">
                  <Layers size={22} />
                </div>
                <div>
                  <h1 className="text-sm font-black text-white tracking-tight leading-tight flex items-center gap-1.5">
                    Daily Tool Kit
                    <span className="text-[9px] font-extrabold bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      15 Tools
                    </span>
                  </h1>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Low Memory • Step-by-Step Architecture
                  </p>
                </div>
              </button>
            </div>

            {/* Middle: Breadcrumb & Recent Tools */}
            <div className="hidden md:flex items-center gap-3">
              {currentToolId !== 'dashboard' && currentTool && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
                  <button
                    onClick={() => selectTool('dashboard')}
                    className="hover:text-indigo-400 font-semibold transition-colors"
                  >
                    All Tools
                  </button>
                  <ChevronRight size={13} className="text-slate-500" />
                  <span className="font-bold text-white">{currentTool.name}</span>
                </div>
              )}

              {/* Recent tool quick chips */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <History size={12} /> Recents:
                </span>
                {recentTools.map((tId) => {
                  const t = ALL_TOOLS.find((tool) => tool.id === tId);
                  if (!t) return null;
                  return (
                    <button
                      key={tId}
                      onClick={() => selectTool(tId)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                        currentToolId === tId
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                      }`}
                    >
                      {t.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: RAM Flush, Search Trigger & Overview */}
            <div className="flex items-center gap-2">
              {/* RAM Flush / Purge Button */}
              <button
                onClick={handlePurgeMemory}
                title="Release canvas buffers & free browser memory"
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
              >
                <Cpu size={13} />
                <span>Purge RAM</span>
              </button>

              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-700"
              >
                <Search size={14} className="text-indigo-400" />
                <span className="hidden sm:inline">Search</span>
                <span className="hidden md:inline text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded font-mono">
                  ⌘K
                </span>
              </button>

              <button
                onClick={() => selectTool('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  currentToolId === 'dashboard'
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard size={14} />
                <span className="hidden sm:inline">Overview</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar + Tool Workspace */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-6 relative z-10">
        {/* Desktop Sidebar (Modular Navigation) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 p-4 shadow-xl space-y-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {/* Dashboard link */}
            <button
              onClick={() => selectTool('dashboard')}
              className={`w-full p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                currentToolId === 'dashboard'
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard Overview</span>
            </button>

            {/* Categorized Tools List */}
            {TOOL_CATEGORIES.map((cat) => {
              const toolsInCat = ALL_TOOLS.filter((t) => t.category === cat.id);
              const theme = CATEGORY_COLORS[cat.id];
              return (
                <div key={cat.id} className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 px-2 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      {cat.name}
                    </span>
                  </div>

                  {toolsInCat.map((tool) => {
                    const IconComp = ICON_MAP[tool.iconName] || Sparkles;
                    const isActive = currentToolId === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => selectTool(tool.id)}
                        className={`w-full p-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600/40 to-purple-600/40 text-white font-bold border border-indigo-500/50 shadow-inner'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <IconComp size={15} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                          <span className="truncate">{tool.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden bg-slate-950/70 backdrop-blur-md flex">
            <div className="w-80 bg-slate-900 border-r border-slate-800 h-full p-5 shadow-2xl flex flex-col justify-between overflow-y-auto text-white">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-extrabold text-sm text-white">All 15 Daily Tools</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <button
                  onClick={() => selectTool('dashboard')}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                    currentToolId === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard Overview</span>
                </button>

                {TOOL_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="space-y-1 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {cat.name}
                    </span>
                    {ALL_TOOLS.filter((t) => t.category === cat.id).map((tool) => {
                      const IconComp = ICON_MAP[tool.iconName] || Sparkles;
                      const isActive = currentToolId === tool.id;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => selectTool(tool.id)}
                          className={`w-full p-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                            isActive ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <IconComp size={15} />
                          <span>{tool.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Active Tool Workspace Page with Step-by-Step Suspense Loader */}
        <main className="flex-1 min-w-0">
          <div
            ref={contentRef}
            className="bg-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-slate-900 transition-all"
          >
            <Suspense fallback={<StepLoader toolName={currentTool?.name} />}>
              {renderActivePage()}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md py-5 text-center text-xs text-slate-400 mt-auto relative z-10 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>Daily Tool Kit — Modular Step-by-Step Engine for Lowest Memory Footprint.</p>
          <div className="flex items-center gap-3 text-slate-500">
            <span>On-Demand Code Splitting</span>
            <span>•</span>
            <span>Instant GPU Hardware Accelerated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

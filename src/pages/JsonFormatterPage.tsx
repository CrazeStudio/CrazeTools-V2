import React, { useState, useEffect, useRef } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Minimize2
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

export default function JsonFormatterPage() {
  const [inputJson, setInputJson] = useState(`{
  "name": "Daily Tool Kit",
  "version": "1.0.0",
  "capabilities": ["image", "pdf", "units", "dev"],
  "features": {
    "clientSide": true,
    "fastReliable": true,
    "darkMode": false
  }
}`);
  const [indentSize, setIndentSize] = useState<2 | 4 | 'tab'>(2);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  // Format
  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(inputJson);
      const indent = indentSize === 'tab' ? '\t' : indentSize;
      setInputJson(JSON.stringify(parsed, null, indent));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Minify
  const handleMinify = () => {
    try {
      const parsed = JSON.parse(inputJson);
      setInputJson(JSON.stringify(parsed));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Validate live
  useEffect(() => {
    if (!inputJson.trim()) {
      setError(null);
      return;
    }
    try {
      JSON.parse(inputJson);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [inputJson]);

  const loadSample = () => {
    const sample = {
      project: 'Daily Tool Suite',
      author: 'AI Studio Engineer',
      toolsCount: 14,
      modules: [
        { id: 'image', status: 'ready', capabilities: ['crop', 'resize', 'enhance'] },
        { id: 'pdf', status: 'ready', capabilities: ['organize', 'merge', 'split', 'compress'] },
        { id: 'converters', status: 'ready', capabilities: ['length', 'weight', 'temp', 'data'] }
      ],
      settings: {
        autoSave: true,
        analytics: false
      }
    };
    setInputJson(JSON.stringify(sample, null, 2));
    setError(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([inputJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Code size={22} />
            </div>
            JSON Formatter & Validator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Prettify, validate syntax, minify, and inspect JSON payloads with real-time error detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSample}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={13} /> Load Sample
          </button>
          <button
            onClick={() => setInputJson('')}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={13} /> Clear
          </button>
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Download size={14} /> Download .json
          </button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrettify}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Code size={14} /> Prettify
          </button>
          <button
            onClick={handleMinify}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Minimize2 size={14} /> Minify
          </button>
        </div>

        {/* Indentation Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600 font-semibold">Indentation:</span>
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
            {[
              { id: 2, label: '2 Spaces' },
              { id: 4, label: '4 Spaces' },
              { id: 'tab', label: 'Tabs' }
            ].map((ind) => (
              <button
                key={ind.id}
                onClick={() => {
                  setIndentSize(ind.id as any);
                  handlePrettify();
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  indentSize === ind.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Validation status badge */}
      <div className="flex items-center gap-2">
        {error ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 w-full">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="font-mono">{error}</span>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 w-full">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Valid JSON syntax</span>
          </div>
        )}
      </div>

      {/* JSON Editor Box */}
      <div className="relative">
        <textarea
          rows={16}
          value={inputJson}
          onChange={(e) => setInputJson(e.target.value)}
          placeholder="Paste or write raw JSON here..."
          className="w-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed shadow-inner"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

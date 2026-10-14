import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Type,
  Copy,
  Check,
  RotateCcw,
  Download,
  Trash2,
  Sliders,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

export default function TextToolsPage() {
  const [text, setText] = useState(
    'Daily Tool Kit provides fast, reliable, private utilities for all your daily workflow needs.'
  );
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  // Text Stats
  const stats = useMemo(() => {
    const raw = text;
    const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
    const chars = raw.length;
    const charsNoSpaces = raw.replace(/\s+/g, '').length;
    const lines = raw ? raw.split('\n').length : 0;
    const sentences = raw ? (raw.match(/[^.!?]+[.!?]+/g) || []).length : 0;
    const readingTimeMinutes = Math.ceil(words / 200);

    return { words, chars, charsNoSpaces, lines, sentences, readingTimeMinutes };
  }, [text]);

  // Case transforms
  const toUpper = () => setText(text.toUpperCase());
  const toLower = () => setText(text.toLowerCase());
  const toTitle = () => {
    setText(
      text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
    );
  };
  const toSentence = () => {
    setText(
      text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
    );
  };
  const toCamel = () => {
    setText(
      text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '')
    );
  };
  const toKebab = () => {
    setText(
      text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    );
  };
  const toSnake = () => {
    setText(
      text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    );
  };
  const toConstant = () => {
    setText(
      text
        .toUpperCase()
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    );
  };

  // Cleanups
  const removeEmptyLines = () => {
    setText(text.split('\n').filter((line) => line.trim().length > 0).join('\n'));
  };
  const trimSpaces = () => {
    setText(text.replace(/[ \t]+/g, ' ').trim());
  };
  const removeDuplicates = () => {
    const lines = text.split('\n');
    setText(Array.from(new Set(lines)).join('\n'));
  };
  const sortLinesAsc = () => {
    setText(text.split('\n').sort().join('\n'));
  };

  // Base64 & URL
  const encodeBase64 = () => {
    try {
      setText(btoa(unescape(encodeURIComponent(text))));
    } catch {
      alert('Error encoding text to Base64');
    }
  };
  const decodeBase64 = () => {
    try {
      setText(decodeURIComponent(escape(atob(text))));
    } catch {
      alert('Invalid Base64 string');
    }
  };
  const encodeUrl = () => setText(encodeURIComponent(text));
  const decodeUrl = () => setText(decodeURI(text));

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `text-document-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Type size={22} />
            </div>
            Text & Case Converter
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Word counting, case formatting, whitespace trimming, sorting, Base64 & URL encoding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setText('')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={13} /> Clear
          </button>
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Download size={14} /> Download .txt
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Words', val: stats.words },
          { label: 'Characters', val: stats.chars },
          { label: 'No Spaces', val: stats.charsNoSpaces },
          { label: 'Lines', val: stats.lines },
          { label: 'Sentences', val: stats.sentences },
          { label: 'Read Time', val: `~${stats.readingTimeMinutes} min` }
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {s.label}
            </span>
            <span className="text-xl font-extrabold text-slate-800 font-mono mt-0.5 block">
              {s.val}
            </span>
          </div>
        ))}
      </div>

      {/* Main Textarea */}
      <div>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here to transform..."
          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-sans focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs leading-relaxed"
        />
      </div>

      {/* Action Buttons Groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Group 1: Case Changes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Case Conversions
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={toUpper} className="p-2 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all">
              UPPERCASE
            </button>
            <button onClick={toLower} className="p-2 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all">
              lowercase
            </button>
            <button onClick={toTitle} className="p-2 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all">
              Title Case
            </button>
            <button onClick={toSentence} className="p-2 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all">
              Sentence case
            </button>
            <button onClick={toCamel} className="p-2 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all">
              camelCase
            </button>
            <button onClick={toKebab} className="p-2 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all">
              kebab-case
            </button>
            <button onClick={toSnake} className="p-2 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all">
              snake_case
            </button>
            <button onClick={toConstant} className="p-2 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all">
              CONSTANT_CASE
            </button>
          </div>
        </div>

        {/* Group 2: Formatting & Cleanups */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Formatting & Cleanups
          </span>
          <div className="space-y-2">
            <button
              onClick={trimSpaces}
              className="w-full p-2.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex items-center justify-between"
            >
              <span>Trim Extra Spaces</span>
              <span className="text-[10px] text-slate-400 font-mono">spaces → 1</span>
            </button>
            <button
              onClick={removeEmptyLines}
              className="w-full p-2.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex items-center justify-between"
            >
              <span>Remove Empty Lines</span>
              <span className="text-[10px] text-slate-400 font-mono">strip blank</span>
            </button>
            <button
              onClick={removeDuplicates}
              className="w-full p-2.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex items-center justify-between"
            >
              <span>Remove Duplicate Lines</span>
              <span className="text-[10px] text-slate-400 font-mono">unique only</span>
            </button>
            <button
              onClick={sortLinesAsc}
              className="w-full p-2.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex items-center justify-between"
            >
              <span>Sort Lines A-Z</span>
              <span className="text-[10px] text-slate-400 font-mono">alphabetical</span>
            </button>
          </div>
        </div>

        {/* Group 3: Encoding & Utilities */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Encoding & Web Utilities
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={encodeBase64}
              className="p-2.5 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all"
            >
              Base64 Encode
            </button>
            <button
              onClick={decodeBase64}
              className="p-2.5 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all"
            >
              Base64 Decode
            </button>
            <button
              onClick={encodeUrl}
              className="p-2.5 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all"
            >
              URL Encode
            </button>
            <button
              onClick={decodeUrl}
              className="p-2.5 text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all"
            >
              URL Decode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

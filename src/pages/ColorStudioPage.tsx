import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Palette,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Eye,
  Sliders
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

// Color conversion helpers
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16)
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16)
    };
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    b = x;
  }

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

// Calculate relative luminance for WCAG
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1) || { r: 0, g: 0, b: 0 };
  const rgb2 = hexToRgb(hex2) || { r: 255, g: 255, b: 255 };
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export default function ColorStudioPage() {
  const [hex, setHex] = useState('#4f46e5');
  const [bgContrastHex, setBgContrastHex] = useState('#ffffff');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  const rgb = useMemo(() => hexToRgb(hex) || { r: 79, g: 70, b: 229 }, [hex]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);

  // Harmonies
  const harmonies = useMemo(() => {
    const { h, s, l } = hsl;
    return {
      complementary: [hslToHex(h + 180, s, l)],
      analogous: [hslToHex(h - 30, s, l), hslToHex(h + 30, s, l)],
      triadic: [hslToHex(h + 120, s, l), hslToHex(h + 240, s, l)],
      monochromatic: [
        hslToHex(h, s, Math.max(15, l - 30)),
        hslToHex(h, s, Math.max(25, l - 15)),
        hslToHex(h, s, Math.min(90, l + 15)),
        hslToHex(h, s, Math.min(95, l + 30))
      ]
    };
  }, [hsl]);

  // Contrast Ratio
  const contrastRatio = useMemo(() => getContrastRatio(hex, bgContrastHex), [hex, bgContrastHex]);

  const copyVal = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const randomColor = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    setHex(rgbToHex(r, g, b));
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Palette size={22} />
            </div>
            Color Studio & Harmonies
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            HEX / RGB / HSL values, color harmony palettes, and WCAG AA / AAA contrast validation.
          </p>
        </div>

        <button
          onClick={randomColor}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={13} /> Random Color
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Color Card & Codes */}
        <div className="lg:col-span-6 space-y-6">
          <div
            className="h-48 rounded-3xl shadow-sm border border-black/10 flex items-end p-6 transition-all"
            style={{ backgroundColor: hex }}
          >
            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-white/40 flex items-center gap-3">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-none"
              />
              <span className="font-mono font-extrabold text-base text-slate-900 uppercase">
                {hex}
              </span>
            </div>
          </div>

          {/* Formats Copy List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Color Formats
            </span>

            {[
              { label: 'HEX', val: hex.toUpperCase() },
              { label: 'RGB', val: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
              { label: 'HSL', val: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
              { label: 'CSS Var', val: `--primary-color: ${hex};` }
            ].map((fmt) => (
              <div
                key={fmt.label}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-16 uppercase">{fmt.label}</span>
                  <span className="font-mono font-bold text-slate-800">{fmt.val}</span>
                </div>
                <button
                  onClick={() => copyVal(fmt.val, fmt.label)}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  {copiedKey === fmt.label ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Harmonies & WCAG Contrast */}
        <div className="lg:col-span-6 space-y-6">
          {/* Harmonies Palettes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Color Harmonies
            </span>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Complementary</span>
                <div className="flex gap-2">
                  <div className="w-12 h-10 rounded-xl border border-slate-200" style={{ backgroundColor: hex }} />
                  {harmonies.complementary.map((c) => (
                    <button
                      key={c}
                      onClick={() => setHex(c)}
                      className="w-12 h-10 rounded-xl border border-slate-200 hover:scale-105 transition-transform"
                      style={{ backgroundColor: c }}
                      title={`Switch to ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Analogous</span>
                <div className="flex gap-2">
                  {harmonies.analogous.map((c) => (
                    <button
                      key={c}
                      onClick={() => setHex(c)}
                      className="w-12 h-10 rounded-xl border border-slate-200 hover:scale-105 transition-transform"
                      style={{ backgroundColor: c }}
                      title={`Switch to ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Monochromatic</span>
                <div className="flex gap-2">
                  {harmonies.monochromatic.map((c) => (
                    <button
                      key={c}
                      onClick={() => setHex(c)}
                      className="w-12 h-10 rounded-xl border border-slate-200 hover:scale-105 transition-transform"
                      style={{ backgroundColor: c }}
                      title={`Switch to ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* WCAG Contrast Ratio Checker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              WCAG Accessibility Contrast
            </span>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Test Background:</span>
                <input
                  type="color"
                  value={bgContrastHex}
                  onChange={(e) => setBgContrastHex(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-none"
                />
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Contrast Ratio:</span>
                <div className="text-lg font-extrabold text-slate-900 font-mono">
                  {contrastRatio.toFixed(2)} : 1
                </div>
              </div>
            </div>

            {/* Test Sample Preview */}
            <div
              className="p-4 rounded-xl border border-slate-200 text-sm font-bold flex items-center justify-center transition-colors"
              style={{ backgroundColor: bgContrastHex, color: hex }}
            >
              The quick brown fox jumps over the lazy dog.
            </div>

            {/* WCAG Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className={`p-2 rounded-xl border ${contrastRatio >= 4.5 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                <div className="font-bold">AA Normal</div>
                <div className="text-[10px] mt-0.5">{contrastRatio >= 4.5 ? 'Pass (4.5+)' : 'Fail'}</div>
              </div>
              <div className={`p-2 rounded-xl border ${contrastRatio >= 7.0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                <div className="font-bold">AAA Normal</div>
                <div className="text-[10px] mt-0.5">{contrastRatio >= 7.0 ? 'Pass (7.0+)' : 'Fail'}</div>
              </div>
              <div className={`p-2 rounded-xl border ${contrastRatio >= 3.0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                <div className="font-bold">AA Large</div>
                <div className="text-[10px] mt-0.5">{contrastRatio >= 3.0 ? 'Pass (3.0+)' : 'Fail'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

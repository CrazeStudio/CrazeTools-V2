import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Sparkles,
  Upload,
  RefreshCw,
  Download,
  Palette,
  SlidersHorizontal,
  Sun,
  Contrast,
  Droplet,
  Flame,
  Layers,
  Eye,
  Sliders,
  CheckCircle2,
  FileCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  tint: number;
  vignette: number;
  sepia: number;
  grayscale: number;
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  tint: 0,
  vignette: 0,
  sepia: 0,
  grayscale: 0
};

const PRESETS = [
  {
    name: 'Auto Enhance',
    desc: 'Dynamic dynamic range & vibrance pop',
    color: 'from-amber-500 to-rose-500',
    values: { brightness: 6, contrast: 24, saturation: 26, warmth: 8 }
  },
  {
    name: 'Cinematic Teal & Orange',
    desc: 'Deep shadows with amber skin highlights',
    color: 'from-cyan-500 to-amber-500',
    values: { brightness: 4, contrast: 32, saturation: 18, warmth: 38, tint: -12, vignette: 28 }
  },
  {
    name: 'Golden Hour Glow',
    desc: 'Warm sunlit glow with rich golden tones',
    color: 'from-amber-400 to-orange-600',
    values: { brightness: 12, contrast: 18, saturation: 32, warmth: 48, vignette: 16 }
  },
  {
    name: 'Cool Crisp Film',
    desc: 'Modern high clarity with fresh coolness',
    color: 'from-blue-400 to-teal-500',
    values: { brightness: 10, contrast: 24, saturation: -5, warmth: -32 }
  },
  {
    name: 'Moody Noir B&W',
    desc: 'Fine monochrome with punchy blacks',
    color: 'from-slate-700 to-slate-950',
    values: { brightness: -5, contrast: 55, saturation: -100, grayscale: 100, vignette: 35 }
  },
  {
    name: 'Vintage 70s Nostalgia',
    desc: 'Warm faded film look with sepia tone',
    color: 'from-yellow-600 to-amber-800',
    values: { brightness: 12, contrast: -10, saturation: -12, warmth: 25, sepia: 32, vignette: 35 }
  },
  {
    name: 'Cyberpunk Neon Pop',
    desc: 'Ultra vivid saturated neon contrast',
    color: 'from-fuchsia-500 to-indigo-600',
    values: { brightness: 14, contrast: 42, saturation: 70, warmth: -15, tint: 25 }
  },
  {
    name: 'Soft Glow Portrait',
    desc: 'Flattering warm glow with gentle contrast',
    color: 'from-pink-400 to-rose-500',
    values: { brightness: 10, contrast: -6, saturation: 12, warmth: 16 }
  }
];

export default function ImageEnhancePage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('enhanced-photo');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);

  // Split comparison slider (0 to 100)
  const [splitPos, setSplitPos] = useState<number>(50);

  // Export settings - smart default to preserve file size!
  const [exportFormat, setExportFormat] = useState<'jpeg' | 'webp' | 'png'>('jpeg');
  const [exportQuality, setExportQuality] = useState<number>(88); // 88% is visually lossless without 10x size blowup!
  const [outputBlobSize, setOutputBlobSize] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Quick high-res sample photo
  const loadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 0, 1600);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.35, '#581c87');
    grad.addColorStop(0.65, '#ea580c');
    grad.addColorStop(1, '#fef08a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2400, 1600);

    const sun = ctx.createRadialGradient(1200, 1000, 20, 1200, 1000, 360);
    sun.addColorStop(0, '#ffffff');
    sun.addColorStop(0.3, '#fde047');
    sun.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(1200, 1000, 360, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, 1600);
    ctx.lineTo(0, 1100);
    ctx.lineTo(600, 840);
    ctx.lineTo(1200, 1160);
    ctx.lineTo(1800, 920);
    ctx.lineTo(2400, 1120);
    ctx.lineTo(2400, 1600);
    ctx.closePath();
    ctx.fill();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'sample-mountain-sunset.jpg', { type: 'image/jpeg' });
      setImageFile(file);
      setOriginalSize(file.size);
      setOriginalName('sample-sunset');
      setImageSrc(URL.createObjectURL(blob));
      setExportFormat('jpeg');
      setExportQuality(88);
    }, 'image/jpeg', 0.92);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setImageFile(file);
    setOriginalSize(file.size);
    setOriginalName(file.name.replace(/\.[^/.]+$/, ''));

    // Detect format to avoid turning 4MB JPEG into 41MB PNG
    if (file.type === 'image/png') {
      setExportFormat('png');
    } else if (file.type === 'image/webp') {
      setExportFormat('webp');
    } else {
      setExportFormat('jpeg');
    }
    setExportQuality(88);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageSrc(reader.result);
        setAdjustments(DEFAULT_ADJUSTMENTS);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Clipboard paste support (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          onDrop([file]);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      sourceImageRef.current = img;
      renderBothCanvases();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Render both Original and Adjusted Canvases
  const renderBothCanvases = useCallback(() => {
    const img = sourceImageRef.current;
    const canvas = canvasRef.current;
    const origCanvas = originalCanvasRef.current;
    if (!img || !canvas || !origCanvas) return;

    canvas.width = img.width;
    canvas.height = img.height;
    origCanvas.width = img.width;
    origCanvas.height = img.height;

    const ctx = canvas.getContext('2d');
    const origCtx = origCanvas.getContext('2d');
    if (!ctx || !origCtx) return;

    // Draw untouched original
    origCtx.drawImage(img, 0, 0);

    // Draw adjusted
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const len = data.length;

    const b = adjustments.brightness * 1.5;
    const cFactor = Math.tan(((adjustments.contrast + 100) * Math.PI) / 400);
    const sFactor = (adjustments.saturation + 100) / 100;
    const w = adjustments.warmth * 0.8;
    const t = adjustments.tint * 0.8;
    const sepiaF = adjustments.sepia / 100;
    const grayF = adjustments.grayscale / 100;

    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let bVal = data[i + 2];

      r += b;
      g += b;
      bVal += b;

      r = (r - 128) * cFactor + 128;
      g = (g - 128) * cFactor + 128;
      bVal = (bVal - 128) * cFactor + 128;

      r += w + t * 0.5;
      g -= t;
      bVal += -w + t * 0.5;

      const gray = 0.2989 * r + 0.587 * g + 0.114 * bVal;
      r = gray + (r - gray) * sFactor;
      g = gray + (g - gray) * sFactor;
      bVal = gray + (bVal - gray) * sFactor;

      if (sepiaF > 0) {
        const sr = r * 0.393 + g * 0.769 + bVal * 0.189;
        const sg = r * 0.349 + g * 0.686 + bVal * 0.168;
        const sb = r * 0.272 + g * 0.534 + bVal * 0.131;
        r = r * (1 - sepiaF) + sr * sepiaF;
        g = g * (1 - sepiaF) + sg * sepiaF;
        bVal = bVal * (1 - sepiaF) + sb * sepiaF;
      }

      if (grayF > 0) {
        r = r * (1 - grayF) + gray * grayF;
        g = g * (1 - grayF) + gray * grayF;
        bVal = bVal * (1 - grayF) + gray * grayF;
      }

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, bVal));
    }

    ctx.putImageData(imgData, 0, 0);

    if (adjustments.vignette > 0) {
      const radius = Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2));
      const vigGrad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        radius * 0.45,
        canvas.width / 2,
        canvas.height / 2,
        radius
      );
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, `rgba(0,0,0,${(adjustments.vignette / 100) * 0.85})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Estimate output size via blob
    const mime = exportFormat === 'png' ? 'image/png' : exportFormat === 'webp' ? 'image/webp' : 'image/jpeg';
    const q = exportFormat === 'png' ? 1.0 : exportQuality / 100;
    canvas.toBlob((b) => {
      if (b) setOutputBlobSize(b.size);
    }, mime, q);
  }, [adjustments, exportFormat, exportQuality]);

  useEffect(() => {
    renderBothCanvases();
  }, [renderBothCanvases]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);

    const mime = exportFormat === 'png' ? 'image/png' : exportFormat === 'webp' ? 'image/webp' : 'image/jpeg';
    const quality = exportFormat === 'png' ? 1.0 : exportQuality / 100;

    // Use toBlob to prevent 41MB memory spikes and data URL limits
    canvas.toBlob((blob) => {
      setIsExporting(false);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${originalName}-enhanced.${exportFormat}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, mime, quality);
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 text-white rounded-2xl shadow-md shadow-indigo-200">
              <Sparkles size={22} />
            </div>
            Auto Enhance & Color Grading
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Dynamic tone enhancement, 8 cinematic film presets, and compact lossless export.
          </p>
        </div>

        {imageSrc && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setImageSrc(null);
                setAdjustments(DEFAULT_ADJUSTMENTS);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Change Image
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> Download Enhanced ({formatBytes(outputBlobSize)})
            </button>
          </div>
        )}
      </div>

      {!imageSrc ? (
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                : 'border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/20'
            }`}
          >
            <input {...getInputProps()} />
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center mb-4 shadow-md shadow-indigo-200">
                <Upload size={30} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                Upload photo to enhance & color grade
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                PNG, JPG, or WebP. Preserves compact file sizes with true lossless-grade quality.
              </p>
              <div className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200">
                Select Photo
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={loadSample}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <Sparkles size={14} /> Try with High-Res Mountain Sunset Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Visual Preview Area with Split Slider */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 p-4 flex items-center justify-center min-h-[440px] max-h-[580px] relative select-none shadow-xl">
              {/* Offscreen original canvas */}
              <canvas ref={originalCanvasRef} className="hidden" />

              <div className="relative max-h-[500px] max-w-full flex items-center justify-center overflow-hidden rounded-xl">
                {/* Enhanced Canvas */}
                <canvas ref={canvasRef} className="max-h-[500px] max-w-full object-contain rounded-md" />

                {/* Original Overlay clipped by split slider */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                >
                  <img
                    src={imageSrc}
                    alt="Original layer"
                    className="max-h-[500px] max-w-full object-contain w-full h-full"
                  />
                </div>

                {/* Split line divider */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] pointer-events-none"
                  style={{ left: `${splitPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-white text-indigo-700 rounded-full shadow-lg flex items-center justify-center text-[10px] font-extrabold border-2 border-indigo-600">
                    VS
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white flex items-center gap-1.5 font-mono">
                <span className="text-slate-400">Original:</span>
                <span className="font-bold">{formatBytes(originalSize)}</span>
              </div>

              <div className="absolute top-4 right-4 bg-indigo-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-500/30 text-xs text-white flex items-center gap-1.5 font-mono">
                <span className="text-indigo-300">Enhanced:</span>
                <span className="font-bold text-indigo-400">{formatBytes(outputBlobSize)}</span>
              </div>
            </div>

            {/* Split Slider Bar */}
            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600">
              <span className="shrink-0 text-slate-500">Original (Left)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={splitPos}
                onChange={(e) => setSplitPos(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="shrink-0 text-indigo-700 font-bold">Enhanced (Right)</span>
            </div>

            {/* Quick Auto Enhance Button */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 rounded-2xl border border-indigo-100">
              <button
                onClick={() => setAdjustments({ ...DEFAULT_ADJUSTMENTS, ...PRESETS[0].values })}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-200 hover:opacity-95 transition-all flex items-center gap-2"
              >
                <Sparkles size={15} /> One-Click Smart Auto Enhance
              </button>

              <button
                onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={13} /> Reset Filters
              </button>
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
            {/* Presets Grid */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 block flex items-center gap-1.5">
                <Palette size={14} className="text-indigo-600" /> Color Grading Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setAdjustments({ ...DEFAULT_ADJUSTMENTS, ...p.values })}
                    className="text-left p-3 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group relative overflow-hidden"
                  >
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">{p.name}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{p.desc}</div>
                    <div className={`h-1 w-full mt-2 rounded-full bg-gradient-to-r ${p.color}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Fine Sliders */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-indigo-600" /> Tone & Color Curves
              </label>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1 font-medium">
                  <span className="flex items-center gap-1"><Sun size={13} className="text-amber-500" /> Exposure / Brightness</span>
                  <span className="font-mono text-slate-500">{adjustments.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.brightness}
                  onChange={(e) => setAdjustments({ ...adjustments, brightness: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1 font-medium">
                  <span className="flex items-center gap-1"><Contrast size={13} className="text-slate-700" /> Contrast</span>
                  <span className="font-mono text-slate-500">{adjustments.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.contrast}
                  onChange={(e) => setAdjustments({ ...adjustments, contrast: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1 font-medium">
                  <span className="flex items-center gap-1"><Droplet size={13} className="text-blue-500" /> Saturation & Vibrance</span>
                  <span className="font-mono text-slate-500">{adjustments.saturation}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.saturation}
                  onChange={(e) => setAdjustments({ ...adjustments, saturation: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1 font-medium">
                  <span className="flex items-center gap-1"><Flame size={13} className="text-orange-500" /> Color Warmth (Temp)</span>
                  <span className="font-mono text-slate-500">{adjustments.warmth}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.warmth}
                  onChange={(e) => setAdjustments({ ...adjustments, warmth: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1 font-medium">
                  <span>Vignette Falloff</span>
                  <span className="font-mono text-slate-500">{adjustments.vignette}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.vignette}
                  onChange={(e) => setAdjustments({ ...adjustments, vignette: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            {/* Smart Compact Export Settings */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Export Format & Quality Control
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'jpeg', label: 'JPEG (Compact)' },
                  { id: 'webp', label: 'WebP (Modern)' },
                  { id: 'png', label: 'PNG (Lossless)' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setExportFormat(fmt.id as any)}
                    className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      exportFormat === fmt.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              {exportFormat !== 'png' && (
                <div>
                  <div className="flex justify-between text-xs text-slate-700 mb-1 font-medium">
                    <span>Quality</span>
                    <span className="font-mono font-bold text-indigo-600">{exportQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="98"
                    value={exportQuality}
                    onChange={(e) => setExportQuality(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}

              {/* Exact output size indicator to prevent 41MB surprises */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Original Size:</span>{' '}
                  <strong className="text-slate-700 font-mono">{formatBytes(originalSize)}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Output Size:</span>{' '}
                  <strong className="text-indigo-700 font-mono">{formatBytes(outputBlobSize)}</strong>
                </div>
              </div>

              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {isExporting ? 'Processing Blob...' : `Download Enhanced Image (${formatBytes(outputBlobSize)})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

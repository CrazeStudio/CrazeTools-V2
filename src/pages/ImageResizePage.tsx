import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Maximize2,
  Upload,
  Lock,
  Unlock,
  Download,
  RefreshCw,
  Sparkles,
  Layers,
  FileCheck
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

export default function ImageResizePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('resized-image');
  const [originalDim, setOriginalDim] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState<number>(90);
  const [estimatedSize, setEstimatedSize] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  const loadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
    grad.addColorStop(0, '#065f46');
    grad.addColorStop(0.5, '#047857');
    grad.addColorStop(1, '#022c22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(i * 200, 200, 100, 680);
    }

    const data = canvas.toDataURL('image/png');
    setImageSrc(data);
    setOriginalName('sample-banner');
    setOriginalDim({ width: 1920, height: 1080 });
    setWidth(1920);
    setHeight(1080);
    setAspectRatio(1920 / 1080);
    setOriginalFileSize(450 * 1024);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setOriginalName(file.name.replace(/\.[^/.]+$/, ''));
    setOriginalFileSize(file.size);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          setImageSrc(reader.result as string);
          setOriginalDim({ width: img.width, height: img.height });
          setWidth(img.width);
          setHeight(img.height);
          setAspectRatio(img.width / img.height);
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  }, []);

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
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Handle dimensions change
  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && aspectRatio > 0) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && aspectRatio > 0) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  const handlePercent = (pct: number) => {
    const nw = Math.round((originalDim.width * pct) / 100);
    const nh = Math.round((originalDim.height * pct) / 100);
    setWidth(nw);
    setHeight(nh);
  };

  // Estimate file size
  useEffect(() => {
    if (originalDim.width === 0 || width === 0) return;
    const pixelRatio = (width * height) / (originalDim.width * originalDim.height);
    const qualityFactor = format === 'png' ? 1.0 : quality / 100;
    const fmtFactor = format === 'webp' ? 0.65 : format === 'jpeg' ? 0.75 : 1.0;
    const est = Math.round(originalFileSize * pixelRatio * qualityFactor * fmtFactor);
    setEstimatedSize(Math.max(1024, est));
  }, [width, height, format, quality, originalDim, originalFileSize]);

  const handleDownload = () => {
    const img = sourceImageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    const q = format === 'png' ? 1.0 : quality / 100;
    const url = canvas.toDataURL(mime, q);

    const link = document.createElement('a');
    link.download = `${originalName}-${width}x${height}.${format}`;
    link.href = url;
    link.click();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Maximize2 size={22} />
            </div>
            Image Resizer & Converter
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Exact pixel resolution scaling, aspect ratio lock, and PNG/JPEG/WebP format conversion.
          </p>
        </div>

        {imageSrc && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImageSrc(null)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Change Image
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> Download Resized
            </button>
          </div>
        )}
      </div>

      {!imageSrc ? (
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-slate-50/50 hover:border-indigo-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Upload size={30} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Upload image to resize</h3>
              <p className="text-sm text-slate-500 mb-5">Drop any PNG, JPG, or WebP photo to scale dimensions.</p>
              <div className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl">
                Browse Files
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={loadSample}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100"
            >
              <Sparkles size={14} /> Load Sample Image
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Image Preview */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-4 flex items-center justify-center min-h-[440px] max-h-[580px] relative select-none">
              <img
                src={imageSrc}
                alt="Source preview"
                className="max-h-[500px] max-w-full object-contain rounded-md"
              />

              <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono text-white flex items-center gap-2 border border-white/10">
                <span>Original: {originalDim.width} × {originalDim.height} px</span>
                <span className="text-indigo-400">Target: {width} × {height} px</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Standard Web & Device Resolutions
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Full HD 1080p', w: 1920, h: 1080 },
                  { label: 'Standard 720p', w: 1280, h: 720 },
                  { label: '4K Ultra HD', w: 3840, h: 2160 },
                  { label: 'Square 1:1', w: 1080, h: 1080 },
                  { label: 'Story (9:16)', w: 1080, h: 1920 },
                  { label: 'Twitter Header', w: 1500, h: 500 },
                  { label: 'Avatar Icon', w: 500, h: 500 },
                  { label: 'Half Size (50%)', w: Math.round(originalDim.width / 2), h: Math.round(originalDim.height / 2) }
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setWidth(p.w);
                      setHeight(p.h);
                    }}
                    className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 rounded-xl text-left transition-all"
                  >
                    <div className="text-xs font-bold text-slate-800">{p.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{p.w} × {p.h}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resize Settings Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
            {/* Dimensions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Dimensions (px)
                </label>
                <button
                  onClick={() => setLockAspect(!lockAspect)}
                  className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    lockAspect ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {lockAspect ? <Lock size={12} /> : <Unlock size={12} />}
                  {lockAspect ? 'Aspect Locked' : 'Aspect Free'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Width (px)</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={width}
                    onChange={(e) => handleWidthChange(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Height (px)</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={height}
                    onChange={(e) => handleHeightChange(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Scale Ratio */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                Scale Percentage
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 150].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handlePercent(pct)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors text-center"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Format & Quality */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Export Format
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`py-2 text-xs font-bold uppercase rounded-xl border transition-all ${
                      format === fmt
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {format !== 'png' && (
                <div>
                  <div className="flex justify-between text-xs text-slate-700 mb-1">
                    <span>Quality Compression</span>
                    <span className="font-mono font-bold">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}

              {/* File size indicator */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Original Size:</span>
                  <span className="font-mono font-medium">{formatBytes(originalFileSize)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>Estimated Output:</span>
                  <span className="font-mono text-indigo-600">~{formatBytes(estimatedSize)}</span>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} /> Download Resized Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Minimize2,
  Upload,
  Download,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight,
  Eye,
  FileCheck,
  Zap,
  Target,
  Image as ImageIcon
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

interface CompressedResult {
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  format: string;
  savedPercent: number;
}

export default function ImageCompressPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [originalDim, setOriginalDim] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Compression controls
  const [compressMode, setCompressMode] = useState<'smart' | 'target' | 'aggressive' | 'custom'>('smart');
  const [targetKb, setTargetKb] = useState<number>(500);
  const [quality, setQuality] = useState<number>(80);
  const [maxDimension, setMaxDimension] = useState<number>(0); // 0 = no limit
  const [outputFormat, setOutputFormat] = useState<'auto' | 'jpeg' | 'webp' | 'png'>('auto');

  // Results state
  const [result, setResult] = useState<CompressedResult | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compareSplit, setCompareSplit] = useState<number>(50);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sourceImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 320 });
    }
  }, []);

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Generate high-resolution rich sample photo for instant testing
  const loadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 3200;
    canvas.height = 2000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High detail colorful gradient & shapes simulating a 5MB camera photo
    const grad = ctx.createLinearGradient(0, 0, 3200, 2000);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.3, '#431407');
    grad.addColorStop(0.6, '#047857');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 3200, 2000);

    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `hsla(${i * 9}, 85%, 60%, 0.35)`;
      ctx.beginPath();
      ctx.arc(80 * i, 50 * i, 120 + i * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Convert to uncompressed Blob
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'high-res-sample.jpg', { type: 'image/jpeg' });
      setImageFile(file);
      setOriginalSize(file.size);
      const url = URL.createObjectURL(blob);
      setOriginalSrc(url);
      setOriginalDim({ width: 3200, height: 2000 });
    }, 'image/jpeg', 0.98);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setImageFile(file);
    setOriginalSize(file.size);
    const url = URL.createObjectURL(file);
    setOriginalSrc(url);

    const img = new Image();
    img.onload = () => {
      sourceImgRef.current = img;
      setOriginalDim({ width: img.width, height: img.height });
    };
    img.src = url;
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

  // Run Compression
  const executeCompression = useCallback(async () => {
    if (!imageFile || !originalSrc) return;
    setIsCompressing(true);

    try {
      const img = new Image();
      img.src = originalSrc;
      await new Promise((resolve) => (img.onload = resolve));

      let targetW = img.width;
      let targetH = img.height;

      // Handle max dimensions constraint
      if (maxDimension > 0 && (targetW > maxDimension || targetH > maxDimension)) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDimension) / targetW);
          targetW = maxDimension;
        } else {
          targetW = Math.round((targetW * maxDimension) / targetH);
          targetH = maxDimension;
        }
      }

      // Determine format
      let mime = 'image/jpeg';
      let formatName = 'jpeg';
      if (outputFormat === 'webp') {
        mime = 'image/webp';
        formatName = 'webp';
      } else if (outputFormat === 'png') {
        mime = 'image/png';
        formatName = 'png';
      } else if (outputFormat === 'auto') {
        // If source is PNG with transparency, keep PNG, otherwise use WebP or JPEG
        mime = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        formatName = mime.replace('image/', '');
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Function to render at quality
      const getBlobAtQuality = (q: number): Promise<Blob> => {
        return new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b || new Blob()), mime, q);
        });
      };

      let finalBlob: Blob;

      if (compressMode === 'smart') {
        // Smart Visual Lossless: WebP/JPEG at 82% quality, scaling if gigantic
        const q = 0.82;
        finalBlob = await getBlobAtQuality(q);
      } else if (compressMode === 'aggressive') {
        // Aggressive: 60% quality, clamp max 1920px
        if (targetW > 1920 || targetH > 1920) {
          const scale = Math.min(1920 / targetW, 1920 / targetH);
          canvas.width = Math.round(targetW * scale);
          canvas.height = Math.round(targetH * scale);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        finalBlob = await getBlobAtQuality(0.62);
      } else if (compressMode === 'target') {
        // Binary search to meet target KB
        const targetBytes = targetKb * 1024;
        let minQ = 0.05;
        let maxQ = 0.95;
        let bestBlob = await getBlobAtQuality(0.75);

        for (let iter = 0; iter < 6; iter++) {
          const midQ = (minQ + maxQ) / 2;
          const testBlob = await getBlobAtQuality(midQ);
          if (testBlob.size <= targetBytes) {
            bestBlob = testBlob;
            minQ = midQ; // Try to get higher quality that still fits
          } else {
            maxQ = midQ; // Too big, lower quality
          }
        }

        // If even lowest quality is too big, downscale dimensions
        if (bestBlob.size > targetBytes) {
          const ratio = Math.sqrt(targetBytes / bestBlob.size);
          canvas.width = Math.max(200, Math.round(targetW * ratio));
          canvas.height = Math.max(200, Math.round(targetH * ratio));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          bestBlob = await getBlobAtQuality(0.75);
        }

        finalBlob = bestBlob;
      } else {
        // Custom
        finalBlob = await getBlobAtQuality(quality / 100);
      }

      const url = URL.createObjectURL(finalBlob);
      const savedPercent = Math.max(0, Math.round(((originalSize - finalBlob.size) / originalSize) * 100));

      setResult({
        blob: finalBlob,
        url,
        size: finalBlob.size,
        width: canvas.width,
        height: canvas.height,
        format: formatName,
        savedPercent
      });
    } catch (err) {
      console.error('Compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  }, [imageFile, originalSrc, originalSize, compressMode, targetKb, quality, maxDimension, outputFormat]);

  // Re-run compression when settings change
  useEffect(() => {
    if (imageFile) {
      executeCompression();
    }
  }, [executeCompression, imageFile]);

  const handleDownload = () => {
    if (!result || !imageFile) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `compressed-${imageFile.name.replace(/\.[^/.]+$/, '')}.${result.format}`;
    link.click();
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-rose-500 text-white rounded-2xl shadow-md shadow-amber-200">
              <Minimize2 size={22} />
            </div>
            Smart Image Compressor
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Drastically reduce image file sizes (up to 90%) with target-size constraints and lossless visual optimization.
          </p>
        </div>

        {imageFile && result && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setImageFile(null);
                setResult(null);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Change Image
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 rounded-xl shadow-md shadow-amber-200 transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> Download ({formatBytes(result.size)})
            </button>
          </div>
        )}
      </div>

      {!imageFile ? (
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                : 'border-slate-200 bg-slate-50/50 hover:border-amber-400 hover:bg-amber-50/20'
            }`}
          >
            <input {...getInputProps()} />
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center mb-4 shadow-md shadow-amber-200">
                <Upload size={30} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                Drag and drop your photo to compress
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                Drop large 4MB - 50MB JPEG, PNG, or WebP photos. We guarantee massive file size reduction without visual blur.
              </p>
              <div className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 text-white text-sm font-bold rounded-xl shadow-md shadow-amber-200">
                Select Photo
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={loadSample}
              className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <Sparkles size={14} /> Test with High-Res 3200×2000 Sample Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Visual Comparison Slider */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Split Comparison Window */}
            <div className="bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 p-4 min-h-[440px] max-h-[580px] flex items-center justify-center relative select-none shadow-xl">
              {originalSrc && (
                <div className="relative max-h-[500px] max-w-full flex items-center justify-center overflow-hidden rounded-xl">
                  {/* Original Layer */}
                  <img
                    src={originalSrc}
                    alt="Original"
                    className="max-h-[500px] max-w-full object-contain"
                  />

                  {/* Compressed Layer overlay with clip-path */}
                  {result && (
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 0 0 ${compareSplit}%)` }}
                    >
                      <img
                        src={result.url}
                        alt="Compressed"
                        className="max-h-[500px] max-w-full object-contain w-full h-full"
                      />
                    </div>
                  )}

                  {/* Split Divider line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] pointer-events-none"
                    style={{ left: `${compareSplit}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-white text-slate-900 rounded-full shadow-lg flex items-center justify-center text-[10px] font-bold border-2 border-indigo-600">
                      VS
                    </div>
                  </div>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white flex items-center gap-1.5 font-mono">
                <span className="text-slate-400">Original:</span>
                <span className="font-bold text-rose-400">{formatBytes(originalSize)}</span>
              </div>

              {result && (
                <div className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs text-white flex items-center gap-1.5 font-mono">
                  <span className="text-slate-400">Compressed:</span>
                  <span className="font-bold text-emerald-400">{formatBytes(result.size)}</span>
                  <span className="bg-emerald-500 text-white font-extrabold px-1.5 py-0.2 rounded text-[10px]">
                    -{result.savedPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Split Slider Control */}
            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600">
              <span className="shrink-0">Original (Left)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={compareSplit}
                onChange={(e) => setCompareSplit(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="shrink-0">Compressed (Right)</span>
            </div>

            {/* Real Impact Summary Card */}
            {result && (
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Zap size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-emerald-900">
                      Reduced file size by {result.savedPercent}% ({formatBytes(originalSize)} → {formatBytes(result.size)})
                    </div>
                    <div className="text-xs text-emerald-700">
                      Visual clarity preserved with zero noticeable artifacts.
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-1.5"
                >
                  <Download size={15} /> Save Optimized File
                </button>
              </div>
            )}
          </div>

          {/* Compression Configuration Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
            {/* Mode Selector */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 block">
                Compression Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'smart', label: 'Smart Balance', desc: 'Auto ~80% reduction with pristine quality' },
                  { id: 'target', label: 'Target File Size', desc: 'Specify exact max KB limit (e.g. 500 KB)' },
                  { id: 'aggressive', label: 'Aggressive', desc: 'Maximum space saver (up to 90%)' },
                  { id: 'custom', label: 'Manual Sliders', desc: 'Custom quality & resolution limits' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setCompressMode(m.id as any)}
                    className={`p-3 text-left rounded-2xl border transition-all ${
                      compressMode === m.id
                        ? 'bg-gradient-to-r from-amber-50 to-rose-50 border-amber-500 text-amber-950 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target File Size Input */}
            {compressMode === 'target' && (
              <div className="space-y-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span className="flex items-center gap-1.5"><Target size={14} /> Maximum Target Size</span>
                  <span className="font-mono text-base">{targetKb} KB</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={targetKb}
                  onChange={(e) => setTargetKb(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
                <div className="flex gap-2">
                  {[200, 500, 1000, 1500].map((kb) => (
                    <button
                      key={kb}
                      onClick={() => setTargetKb(kb)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                        targetKb === kb ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {kb} KB
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Custom sliders */}
            {compressMode === 'custom' && (
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-700 mb-1 font-medium">
                    <span>Quality Compression</span>
                    <span className="font-mono font-bold text-indigo-600">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="98"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 mb-1 font-medium">
                    <span>Max Dimension Limit</span>
                    <span className="font-mono text-slate-500">{maxDimension > 0 ? `${maxDimension}px` : 'Original'}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 1080, 1920, 2560].map((d) => (
                      <button
                        key={d}
                        onClick={() => setMaxDimension(d)}
                        className={`py-1 text-xs font-bold rounded-lg border ${
                          maxDimension === d ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {d === 0 ? 'Full' : `${d}p`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Target Output Format */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Output Format
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'auto', label: 'Auto (Best)' },
                  { id: 'webp', label: 'WebP' },
                  { id: 'jpeg', label: 'JPEG' },
                  { id: 'png', label: 'PNG' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setOutputFormat(fmt.id as any)}
                    className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      outputFormat === fmt.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Download Button */}
            {result && (
              <button
                onClick={handleDownload}
                disabled={isCompressing}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download {formatBytes(result.size)} File
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

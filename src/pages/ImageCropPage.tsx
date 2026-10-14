import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Crop as CropIcon,
  Upload,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  RefreshCw,
  Sparkles,
  Check
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

type AspectPreset = 'free' | '1:1' | '16:9' | '4:3' | '9:16' | '3:2' | 'circle';

export default function ImageCropPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('cropped-image');
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });
  const [preset, setPreset] = useState<AspectPreset>('free');
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [cropApplied, setCropApplied] = useState<boolean>(false);

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
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#4f46e5');
    grad.addColorStop(0.5, '#7c3aed');
    grad.addColorStop(1, '#db2777');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // Geometric pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(200 * i, 400, 150, 0, Math.PI * 2);
      ctx.fill();
    }

    setImageSrc(canvas.toDataURL('image/png'));
    setOriginalName('sample-geometry');
    setCropBox({ x: 15, y: 15, width: 70, height: 70 });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setOriginalName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageSrc(reader.result);
        setCropBox({ x: 10, y: 10, width: 80, height: 80 });
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setCropApplied(false);
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
      renderBaseCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const renderBaseCanvas = useCallback(() => {
    const img = sourceImageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const isSideways = Math.abs(rotation % 180) === 90;
    const targetW = isSideways ? img.height : img.width;
    const targetH = isSideways ? img.width : img.height;

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.translate(targetW / 2, targetH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }, [rotation, flipH, flipV]);

  useEffect(() => {
    renderBaseCanvas();
  }, [renderBaseCanvas]);

  const applyAspectPreset = (asp: AspectPreset) => {
    setPreset(asp);
    if (asp === '1:1' || asp === 'circle') {
      setCropBox({ x: 20, y: 20, width: 60, height: 60 });
    } else if (asp === '16:9') {
      setCropBox({ x: 10, y: 25, width: 80, height: 45 });
    } else if (asp === '9:16') {
      setCropBox({ x: 25, y: 10, width: 50, height: 80 });
    } else if (asp === '4:3') {
      setCropBox({ x: 15, y: 20, width: 70, height: 52 });
    } else if (asp === '3:2') {
      setCropBox({ x: 15, y: 22, width: 70, height: 46 });
    } else {
      setCropBox({ x: 10, y: 10, width: 80, height: 80 });
    }
  };

  const handleApplyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cropX = Math.round((cropBox.x / 100) * canvas.width);
    const cropY = Math.round((cropBox.y / 100) * canvas.height);
    const cropW = Math.max(10, Math.round((cropBox.width / 100) * canvas.width));
    const cropH = Math.max(10, Math.round((cropBox.height / 100) * canvas.height));

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropW;
    tempCanvas.height = cropH;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    if (preset === 'circle') {
      tempCtx.beginPath();
      tempCtx.arc(cropW / 2, cropH / 2, Math.min(cropW, cropH) / 2, 0, Math.PI * 2);
      tempCtx.clip();
    }

    tempCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const newUrl = tempCanvas.toDataURL('image/png');

    setImageSrc(newUrl);
    setCropBox({ x: 5, y: 5, width: 90, height: 90 });
    setCropApplied(true);
    setTimeout(() => setCropApplied(false), 2000);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${originalName}-cropped.png`;
    link.href = url;
    link.click();
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CropIcon size={22} />
            </div>
            Image Cropper & Transform
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Visual canvas crop box, aspect ratio presets, circular avatar cutout, and 90° rotation.
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
              <Download size={14} /> Download Image
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
              <h3 className="text-lg font-bold text-slate-800 mb-1">Upload image to crop & transform</h3>
              <p className="text-sm text-slate-500 mb-5">Drag & drop PNG, JPG, or WebP file here.</p>
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
              <Sparkles size={14} /> Load Sample Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Canvas & Interactive Crop Overlay */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-4 flex items-center justify-center min-h-[440px] max-h-[580px] relative select-none">
              <canvas ref={canvasRef} className="max-h-[500px] max-w-full object-contain rounded-md" />

              {/* Crop box visual boundary */}
              <div className="absolute inset-4 pointer-events-none">
                <div
                  className={`absolute border-2 border-indigo-400 bg-indigo-500/10 pointer-events-auto cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] ${
                    preset === 'circle' ? 'rounded-full' : 'rounded-none'
                  }`}
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.width}%`,
                    height: `${cropBox.height}%`
                  }}
                >
                  {preset !== 'circle' && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                      <div />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transformations bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRotation((r) => (r - 90) % 360)}
                  title="Rotate Left 90°"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate Right 90°"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  onClick={() => setFlipH((f) => !f)}
                  title="Flip Horizontal"
                  className={`p-2 rounded-lg border border-transparent ${
                    flipH ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <FlipHorizontal size={16} />
                </button>
                <button
                  onClick={() => setFlipV((f) => !f)}
                  title="Flip Vertical"
                  className={`p-2 rounded-lg border border-transparent ${
                    flipV ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <FlipVertical size={16} />
                </button>
              </div>

              <button
                onClick={handleApplyCrop}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                {cropApplied ? <Check size={14} /> : <CropIcon size={14} />}
                {cropApplied ? 'Crop Applied!' : 'Apply Crop'}
              </button>
            </div>
          </div>

          {/* Presets and Size Inputs */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 block">
                Aspect Ratio Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'free', label: 'Freeform', desc: 'Custom rectangle' },
                  { id: '1:1', label: '1:1 Square', desc: 'Profile & Instagram' },
                  { id: '16:9', label: '16:9 Widescreen', desc: 'YouTube & Landscape' },
                  { id: '9:16', label: '9:16 Story / Reel', desc: 'TikTok & Shorts' },
                  { id: '4:3', label: '4:3 Standard', desc: 'Classic format' },
                  { id: 'circle', label: 'Circle Cutout', desc: 'Avatar circular mask' },
                ].map((asp) => (
                  <button
                    key={asp.id}
                    onClick={() => applyAspectPreset(asp.id as AspectPreset)}
                    className={`p-2.5 text-left rounded-xl border transition-all ${
                      preset === asp.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{asp.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">{asp.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Crop Box Sliders */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Crop Box Position & Scale
              </label>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Width Size</span>
                  <span className="font-mono">{cropBox.width}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={cropBox.width}
                  onChange={(e) => setCropBox({ ...cropBox, width: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Height Size</span>
                  <span className="font-mono">{cropBox.height}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={cropBox.height}
                  onChange={(e) => setCropBox({ ...cropBox, height: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Horizontal Offset X</span>
                  <span className="font-mono">{cropBox.x}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={cropBox.x}
                  onChange={(e) => setCropBox({ ...cropBox, x: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Vertical Offset Y</span>
                  <span className="font-mono">{cropBox.y}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={cropBox.y}
                  onChange={(e) => setCropBox({ ...cropBox, y: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} /> Download Cropped Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

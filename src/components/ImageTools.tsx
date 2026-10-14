import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  Sparkles,
  Sliders,
  Crop as CropIcon,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  RefreshCw,
  Maximize2,
  Lock,
  Unlock,
  Check,
  Eye,
  Layers,
  Image as ImageIcon,
  Palette,
  FileDown,
  HelpCircle,
  SlidersHorizontal,
  Contrast,
  Sun,
  Flame,
  Droplet
} from 'lucide-react';
import { animateFadeIn, animateScaleIn } from '../utils/animation';

interface Adjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  warmth: number; // -100 to 100 (blue to amber)
  tint: number; // -100 to 100 (green to magenta)
  sharpness: number; // 0 to 100
  vignette: number; // 0 to 100
  blur: number; // 0 to 20
  sepia: number; // 0 to 100
  grayscale: number; // 0 to 100
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  tint: 0,
  sharpness: 0,
  vignette: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
};

const PRESETS: { name: string; desc: string; values: Partial<Adjustments> }[] = [
  {
    name: 'Auto Enhance',
    desc: 'Dynamic contrast & rich vibrance',
    values: { brightness: 6, contrast: 24, saturation: 26, warmth: 8, sharpness: 30 }
  },
  {
    name: 'Cinematic Warm',
    desc: 'Teal shadows & golden amber highlights',
    values: { brightness: 2, contrast: 30, saturation: 15, warmth: 35, tint: -10, vignette: 28 }
  },
  {
    name: 'Golden Hour',
    desc: 'Soft golden glow with sunlit warmth',
    values: { brightness: 12, contrast: 18, saturation: 32, warmth: 48, vignette: 15 }
  },
  {
    name: 'Cool Crisp',
    desc: 'Clean modern look with cool undertones',
    values: { brightness: 8, contrast: 22, saturation: -8, warmth: -32, sharpness: 35 }
  },
  {
    name: 'Moody Noir',
    desc: 'High contrast black and white with punchy blacks',
    values: { brightness: -5, contrast: 55, saturation: -100, grayscale: 100, sharpness: 40, vignette: 35 }
  },
  {
    name: 'Vintage Retro',
    desc: '70s nostalgic film tone with warm fade',
    values: { brightness: 10, contrast: -12, saturation: -15, warmth: 25, sepia: 30, vignette: 40 }
  },
  {
    name: 'Cyber Pop',
    desc: 'Ultra saturated neon pop colors',
    values: { brightness: 14, contrast: 42, saturation: 75, warmth: -15, tint: 25, sharpness: 35 }
  }
];

export default function ImageTools() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState<string>('image');
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [activeSubTab, setActiveSubTab] = useState<'enhance' | 'crop' | 'resize'>('enhance');

  // Adjustments state
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [compareSplit, setCompareSplit] = useState<number>(50); // percentage for split view
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Resize state
  const [resizeWidth, setResizeWidth] = useState<number>(0);
  const [resizeHeight, setResizeHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  // Crop & Transform state
  const [cropAspect, setCropAspect] = useState<'free' | '1:1' | '16:9' | '4:3' | '9:16' | '3:2'>('free');
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 100, height: 100 });
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Export settings
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [exportQuality, setExportQuality] = useState<number>(90);
  const [exporting, setExporting] = useState<boolean>(false);

  // References
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation on mount
  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 320 });
    }
  }, []);

  // Initialize sample demo image if none loaded
  const loadSampleImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create rich sunset landscape graphic
    const sky = ctx.createLinearGradient(0, 0, 0, 600);
    sky.addColorStop(0, '#1e1b4b');
    sky.addColorStop(0.35, '#831843');
    sky.addColorStop(0.65, '#ea580c');
    sky.addColorStop(1, '#fde047');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1200, 800);

    // Glowing sun
    const sunGrad = ctx.createRadialGradient(600, 480, 10, 600, 480, 140);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.3, '#fef08a');
    sunGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(600, 480, 140, 0, Math.PI * 2);
    ctx.fill();

    // Mountain silhouettes
    ctx.fillStyle = '#4a044e';
    ctx.beginPath();
    ctx.moveTo(0, 800);
    ctx.lineTo(0, 520);
    ctx.lineTo(250, 400);
    ctx.lineTo(500, 560);
    ctx.lineTo(750, 430);
    ctx.lineTo(1000, 550);
    ctx.lineTo(1200, 480);
    ctx.lineTo(1200, 800);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, 800);
    ctx.lineTo(0, 620);
    ctx.lineTo(180, 540);
    ctx.lineTo(420, 680);
    ctx.lineTo(680, 560);
    ctx.lineTo(920, 650);
    ctx.lineTo(1200, 590);
    ctx.lineTo(1200, 800);
    ctx.closePath();
    ctx.fill();

    // Water reflection
    const waterGrad = ctx.createLinearGradient(0, 650, 0, 800);
    waterGrad.addColorStop(0, 'rgba(234, 88, 12, 0.4)');
    waterGrad.addColorStop(1, '#020617');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 650, 1200, 150);

    const dataUrl = canvas.toDataURL('image/png');
    setImageSrc(dataUrl);
    setOriginalName('sample-landscape');
    setOriginalDimensions({ width: 1200, height: 800 });
    setResizeWidth(1200);
    setResizeHeight(800);
    setAspectRatio(1200 / 800);
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setOriginalName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          setImageSrc(reader.result as string);
          setOriginalDimensions({ width: img.width, height: img.height });
          setResizeWidth(img.width);
          setResizeHeight(img.height);
          setAspectRatio(img.width / img.height);
          setAdjustments(DEFAULT_ADJUSTMENTS);
          setRotation(0);
          setFlipH(false);
          setFlipV(false);
          setCropBox({ x: 5, y: 5, width: 90, height: 90 });
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg'] },
    maxFiles: 1
  });

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      sourceImageRef.current = img;
      renderAdjustedCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw canvas whenever adjustments or transforms change
  const renderAdjustedCanvas = useCallback(() => {
    const img = sourceImageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    // Dimensions considering rotation
    const isSideways = Math.abs(rotation % 180) === 90;
    const targetW = isSideways ? img.height : img.width;
    const targetH = isSideways ? img.width : img.height;

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    // Center point for transformations
    ctx.translate(targetW / 2, targetH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Pixel manipulation for Color Grading & Enhancements
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;
    const len = data.length;

    // Precompute adjustment scales
    const b = adjustments.brightness * 1.5; // -150 to +150
    const cFactor = Math.tan(((adjustments.contrast + 100) * Math.PI) / 400); // Contrast curve
    const sFactor = (adjustments.saturation + 100) / 100; // 0 to 2
    const w = adjustments.warmth * 0.8; // color temp shift
    const t = adjustments.tint * 0.8; // tint shift
    const sepiaFactor = adjustments.sepia / 100;
    const grayFactor = adjustments.grayscale / 100;

    for (let i = 0; i < len; i += 4) {
      let red = data[i];
      let green = data[i + 1];
      let blue = data[i + 2];

      // 1. Exposure / Brightness
      red += b;
      green += b;
      blue += b;

      // 2. Contrast around midtone 128
      red = (red - 128) * cFactor + 128;
      green = (green - 128) * cFactor + 128;
      blue = (blue - 128) * cFactor + 128;

      // 3. Color Temperature (Warmth) & Tint
      red += w;
      blue -= w;
      red += t * 0.5;
      green -= t;
      blue += t * 0.5;

      // 4. Saturation
      const gray = 0.2989 * red + 0.587 * green + 0.114 * blue;
      red = gray + (red - gray) * sFactor;
      green = gray + (green - gray) * sFactor;
      blue = gray + (blue - gray) * sFactor;

      // 5. Sepia tone
      if (sepiaFactor > 0) {
        const sr = red * 0.393 + green * 0.769 + blue * 0.189;
        const sg = red * 0.349 + green * 0.686 + blue * 0.168;
        const sb = red * 0.272 + green * 0.534 + blue * 0.131;
        red = red * (1 - sepiaFactor) + sr * sepiaFactor;
        green = green * (1 - sepiaFactor) + sg * sepiaFactor;
        blue = blue * (1 - sepiaFactor) + sb * sepiaFactor;
      }

      // 6. Grayscale
      if (grayFactor > 0) {
        red = red * (1 - grayFactor) + gray * grayFactor;
        green = green * (1 - grayFactor) + gray * grayFactor;
        blue = blue * (1 - grayFactor) + gray * grayFactor;
      }

      // Clamp values 0 - 255
      data[i] = red < 0 ? 0 : red > 255 ? 255 : red;
      data[i + 1] = green < 0 ? 0 : green > 255 ? 255 : green;
      data[i + 2] = blue < 0 ? 0 : blue > 255 ? 255 : blue;
    }

    ctx.putImageData(imgData, 0, 0);

    // 7. Vignette effect
    if (adjustments.vignette > 0) {
      const radius = Math.sqrt(Math.pow(targetW / 2, 2) + Math.pow(targetH / 2, 2));
      const vigGrad = ctx.createRadialGradient(
        targetW / 2,
        targetH / 2,
        radius * 0.45,
        targetW / 2,
        targetH / 2,
        radius
      );
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, `rgba(0,0,0,${(adjustments.vignette / 100) * 0.85})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, targetW, targetH);
    }
  }, [adjustments, rotation, flipH, flipV]);

  useEffect(() => {
    renderAdjustedCanvas();
  }, [renderAdjustedCanvas]);

  // Apply a preset
  const applyPreset = (presetValues: Partial<Adjustments>) => {
    setAdjustments({
      ...DEFAULT_ADJUSTMENTS,
      ...presetValues
    });
  };

  // One-click Auto Enhance
  const handleAutoEnhance = () => {
    applyPreset(PRESETS[0].values);
  };

  // Reset all adjustments
  const handleResetAdjustments = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  // Resize handler with aspect lock
  const handleWidthChange = (val: number) => {
    setResizeWidth(val);
    if (lockAspect && aspectRatio > 0) {
      setResizeHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setResizeHeight(val);
    if (lockAspect && aspectRatio > 0) {
      setResizeWidth(Math.round(val * aspectRatio));
    }
  };

  const handleScalePercent = (percent: number) => {
    const nw = Math.round((originalDimensions.width * percent) / 100);
    const nh = Math.round((originalDimensions.height * percent) / 100);
    setResizeWidth(nw);
    setResizeHeight(nh);
  };

  // Apply Crop
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

    tempCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const newUrl = tempCanvas.toDataURL('image/png');

    setImageSrc(newUrl);
    setOriginalDimensions({ width: cropW, height: cropH });
    setResizeWidth(cropW);
    setResizeHeight(cropH);
    setAspectRatio(cropW / cropH);
    setCropBox({ x: 5, y: 5, width: 90, height: 90 });
    setActiveSubTab('enhance');
  };

  // Export processed image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExporting(true);

    try {
      let finalCanvas = canvas;
      // If resize is modified
      if (
        resizeWidth > 0 &&
        resizeHeight > 0 &&
        (resizeWidth !== canvas.width || resizeHeight !== canvas.height)
      ) {
        const resCanvas = document.createElement('canvas');
        resCanvas.width = resizeWidth;
        resCanvas.height = resizeHeight;
        const resCtx = resCanvas.getContext('2d');
        if (resCtx) {
          resCtx.imageSmoothingQuality = 'high';
          resCtx.drawImage(canvas, 0, 0, resizeWidth, resizeHeight);
          finalCanvas = resCanvas;
        }
      }

      const mimeType = exportFormat === 'png' ? 'image/png' : exportFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      const quality = exportFormat === 'png' ? 1.0 : exportQuality / 100;
      const dataUrl = finalCanvas.toDataURL(mimeType, quality);

      const link = document.createElement('a');
      link.download = `${originalName}-enhanced.${exportFormat}`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ImageIcon size={22} />
            </div>
            Image Toolkit
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Fast auto color grading, smart enhancement, precision cropping, and lossless resizing.
          </p>
        </div>

        {imageSrc && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setImageSrc(null);
                handleResetAdjustments();
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Change Image
            </button>
            <button
              onClick={handleDownload}
              disabled={exporting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> Download Processed
            </button>
          </div>
        )}
      </div>

      {/* Upload area if no image */}
      {!imageSrc ? (
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                : 'border-gray-200 bg-gray-50/50 hover:border-indigo-400 hover:bg-indigo-50/20'
            }`}
          >
            <input {...getInputProps()} />
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
                <Upload size={30} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Drag and drop your image here
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                Supports PNG, JPG, WebP, SVG and BMP up to 50MB. Processed completely in your browser for total privacy and speed.
              </p>
              <div className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
                Browse Files
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={loadSampleImage}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1.5 py-2 px-4 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/70 transition-colors"
            >
              <Sparkles size={14} /> Try with Sample Photo
            </button>
          </div>
        </div>
      ) : (
        /* Image Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Visual Preview Area (Canvas) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-lg relative flex items-center justify-center min-h-[420px] max-h-[580px] p-4 select-none">
              {/* Hidden source image */}
              <canvas
                ref={canvasRef}
                className="max-h-[500px] max-w-full object-contain rounded-md shadow"
                style={{
                  filter: adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : 'none'
                }}
              />

              {/* Crop Overlay when crop tab is active */}
              {activeSubTab === 'crop' && (
                <div
                  ref={cropContainerRef}
                  className="absolute inset-4 pointer-events-none border border-white/20"
                >
                  <div
                    className="absolute border-2 border-indigo-400 bg-indigo-500/10 pointer-events-auto cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.width}%`,
                      height: `${cropBox.height}%`
                    }}
                  >
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm" />
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
                  </div>
                </div>
              )}

              {/* Resolution badge */}
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white/90 text-xs px-2.5 py-1 rounded-md font-mono flex items-center gap-2 border border-white/10">
                <span>{originalDimensions.width} × {originalDimensions.height} px</span>
                <span className="text-gray-400">|</span>
                <span className="text-indigo-400 font-semibold">{aspectRatio.toFixed(2)}:1</span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoEnhance}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:from-indigo-700 hover:to-violet-700 transition-all flex items-center gap-1.5"
                >
                  <Sparkles size={14} /> One-Click Auto Enhance
                </button>
                <button
                  onClick={handleResetAdjustments}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200/80 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw size={13} /> Reset
                </button>
              </div>

              {/* Transform quick buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRotation((r) => (r - 90) % 360)}
                  title="Rotate Left 90°"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate Right 90°"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <RotateCw size={15} />
                </button>
                <button
                  onClick={() => setFlipH((f) => !f)}
                  title="Flip Horizontal"
                  className={`p-2 rounded-lg transition-colors border border-transparent ${
                    flipH ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:border-gray-200'
                  }`}
                >
                  <FlipHorizontal size={15} />
                </button>
                <button
                  onClick={() => setFlipV((f) => !f)}
                  title="Flip Vertical"
                  className={`p-2 rounded-lg transition-colors border border-transparent ${
                    flipV ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:border-gray-200'
                  }`}
                >
                  <FlipVertical size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Controls Sidebar (Enhance, Crop, Resize) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-6">
            {/* Tool Category Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveSubTab('enhance')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeSubTab === 'enhance'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles size={14} /> Enhance
              </button>
              <button
                onClick={() => setActiveSubTab('crop')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeSubTab === 'crop'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CropIcon size={14} /> Crop
              </button>
              <button
                onClick={() => setActiveSubTab('resize')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeSubTab === 'resize'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sliders size={14} /> Resize
              </button>
            </div>

            {/* TAB 1: ENHANCE & AUTO COLOR GRADING */}
            {activeSubTab === 'enhance' && (
              <div className="space-y-6">
                {/* Presets Grid */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 block flex items-center gap-1.5">
                    <Palette size={14} className="text-indigo-600" /> Color Grading Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => applyPreset(p.values)}
                        className="text-left p-2.5 rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                      >
                        <div className="text-xs font-semibold text-gray-800 group-hover:text-indigo-700">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                          {p.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Granular Sliders */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-indigo-600" /> Color & Tone Controls
                    </label>
                  </div>

                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                      <span className="flex items-center gap-1"><Sun size={13} className="text-amber-500" /> Exposure / Brightness</span>
                      <span className="font-mono text-gray-500">{adjustments.brightness}</span>
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

                  {/* Contrast */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                      <span className="flex items-center gap-1"><Contrast size={13} className="text-gray-700" /> Contrast</span>
                      <span className="font-mono text-gray-500">{adjustments.contrast}</span>
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

                  {/* Saturation */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                      <span className="flex items-center gap-1"><Droplet size={13} className="text-blue-500" /> Saturation</span>
                      <span className="font-mono text-gray-500">{adjustments.saturation}</span>
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

                  {/* Warmth / Color Temp */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                      <span className="flex items-center gap-1"><Flame size={13} className="text-orange-500" /> Warmth / Temperature</span>
                      <span className="font-mono text-gray-500">{adjustments.warmth}</span>
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

                  {/* Tint */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                      <span>Color Tint (Green - Magenta)</span>
                      <span className="font-mono text-gray-500">{adjustments.tint}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.tint}
                      onChange={(e) => setAdjustments({ ...adjustments, tint: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* Vignette */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                      <span>Vignette Falloff</span>
                      <span className="font-mono text-gray-500">{adjustments.vignette}%</span>
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
              </div>
            )}

            {/* TAB 2: CROP */}
            {activeSubTab === 'crop' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 block">
                    Aspect Ratio Presets
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'free', label: 'Freeform' },
                      { id: '1:1', label: '1:1 Square' },
                      { id: '16:9', label: '16:9 Wide' },
                      { id: '4:3', label: '4:3 Standard' },
                      { id: '9:16', label: '9:16 Story' },
                      { id: '3:2', label: '3:2 Photo' }
                    ].map((asp) => (
                      <button
                        key={asp.id}
                        onClick={() => {
                          setCropAspect(asp.id as any);
                          if (asp.id === '1:1') setCropBox({ x: 20, y: 20, width: 60, height: 60 });
                          else if (asp.id === '16:9') setCropBox({ x: 10, y: 20, width: 80, height: 45 });
                          else if (asp.id === '9:16') setCropBox({ x: 25, y: 10, width: 50, height: 80 });
                          else if (asp.id === '4:3') setCropBox({ x: 15, y: 15, width: 70, height: 52 });
                          else if (asp.id === '3:2') setCropBox({ x: 15, y: 20, width: 70, height: 46 });
                          else setCropBox({ x: 10, y: 10, width: 80, height: 80 });
                        }}
                        className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                          cropAspect === asp.id
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {asp.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
                  <div className="font-semibold text-gray-800">Crop Area Coordinates</div>
                  <div className="grid grid-cols-2 gap-2 text-gray-500">
                    <div>Offset X: {cropBox.x}%</div>
                    <div>Offset Y: {cropBox.y}%</div>
                    <div>Width: {cropBox.width}%</div>
                    <div>Height: {cropBox.height}%</div>
                  </div>
                </div>

                <button
                  onClick={handleApplyCrop}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <CropIcon size={14} /> Apply Crop Selection
                </button>
              </div>
            )}

            {/* TAB 3: RESIZE */}
            {activeSubTab === 'resize' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Target Dimensions (px)
                    </label>
                    <button
                      onClick={() => setLockAspect(!lockAspect)}
                      className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded ${
                        lockAspect ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {lockAspect ? <Lock size={12} /> : <Unlock size={12} />}
                      {lockAspect ? 'Aspect Locked' : 'Aspect Free'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-gray-500 block mb-1">Width (px)</span>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={resizeWidth}
                        onChange={(e) => handleWidthChange(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 block mb-1">Height (px)</span>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={resizeHeight}
                        onChange={(e) => handleHeightChange(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Percentage Quick Scaling */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
                    Quick Scale Ratio
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 150].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => handleScalePercent(pct)}
                        className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors text-center"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Standard presets */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
                    Social & Web Presets
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Full HD 1080p', w: 1920, h: 1080 },
                      { label: 'Instagram Square', w: 1080, h: 1080 },
                      { label: 'Story / Reel (9:16)', w: 1080, h: 1920 },
                      { label: 'Standard Web (720p)', w: 1280, h: 720 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          setResizeWidth(p.w);
                          setResizeHeight(p.h);
                        }}
                        className="w-full flex items-center justify-between p-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <span className="font-medium">{p.label}</span>
                        <span className="font-mono text-gray-400">{p.w} × {p.h}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Export Settings & Download Button */}
            <div className="pt-5 border-t border-gray-100 space-y-4">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Export Format & Quality
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`py-1.5 text-xs font-semibold uppercase rounded-lg border transition-all ${
                      exportFormat === fmt
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {exportFormat !== 'png' && (
                <div>
                  <div className="flex justify-between text-xs text-gray-700 mb-1">
                    <span>Quality</span>
                    <span className="font-mono font-semibold">{exportQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={exportQuality}
                    onChange={(e) => setExportQuality(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}

              <button
                onClick={handleDownload}
                disabled={exporting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {exporting ? 'Processing...' : 'Download Processed Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

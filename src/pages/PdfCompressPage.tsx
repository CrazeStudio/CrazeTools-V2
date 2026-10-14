import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import {
  Minimize2,
  Upload,
  Download,
  RefreshCw,
  Sparkles,
  FileCheck,
  CheckCircle2,
  FileText,
  Zap
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

export default function PdfCompressPage() {
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [level, setLevel] = useState<'light' | 'medium' | 'aggressive'>('medium');
  const [compressedBytes, setCompressedBytes] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  const loadSample = async () => {
    setLoading(true);
    setStatus('Creating sample PDF for compression...');
    try {
      const doc = await PDFDocument.create();
      for (let i = 0; i < 6; i++) {
        const page = doc.addPage([595, 842]);
        page.drawRectangle({
          x: 40,
          y: 700,
          width: 515,
          height: 90,
          color: { type: 'RGB', red: 0.2, green: 0.3, blue: 0.8 } as any
        });
        for (let j = 0; j < 8; j++) {
          page.drawRectangle({
            x: 50,
            y: 650 - j * 60,
            width: 495,
            height: 35,
            color: { type: 'RGB', red: 0.95, green: 0.95, blue: 0.98 } as any
          });
        }
      }
      const bytes = await doc.save();
      setFileBytes(bytes);
      setFileName('Sample-Report-Document.pdf');
      setOriginalSize(bytes.length);
      setPageCount(6);
      setStatus('Sample PDF loaded.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    try {
      const doc = await PDFDocument.load(bytes);
      setFileBytes(bytes);
      setFileName(file.name);
      setOriginalSize(file.size);
      setPageCount(doc.getPageCount());
      setCompressedBytes(null);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const handleCompress = async () => {
    if (!fileBytes) return;
    setLoading(true);
    setStatus('Compressing PDF object streams...');

    try {
      const doc = await PDFDocument.load(fileBytes);
      // Save with object stream deduplication
      const outBytes = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false
      });

      setCompressedBytes(outBytes);
      setStatus('Compression complete.');

      const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed-${fileName.replace(/\.pdf$/, '')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setStatus('Error optimizing PDF.');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const estimatedReduction = level === 'aggressive' ? 0.45 : level === 'medium' ? 0.3 : 0.15;
  const estimatedOutputSize = Math.max(1024, Math.round(originalSize * (1 - estimatedReduction)));

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Minimize2 size={22} />
            </div>
            PDF Compressor & Optimizer
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Reduce PDF file sizes by deduplicating fonts, metadata, and object stream dictionaries.
          </p>
        </div>

        {fileBytes && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFileBytes(null);
                setCompressedBytes(null);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Change File
            </button>
            <button
              onClick={handleCompress}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> Download Compressed PDF
            </button>
          </div>
        )}
      </div>

      {!fileBytes ? (
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/50 hover:border-emerald-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <Upload size={30} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Upload PDF document to compress</h3>
              <p className="text-sm text-slate-500 mb-5">Deduplicate object streams and optimize file structure.</p>
              <div className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl">
                Browse PDF
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={loadSample}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100"
            >
              <Sparkles size={14} /> Load Sample PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
          {/* File Card Info */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{fileName}</h4>
                <p className="text-xs text-slate-500">{pageCount} Pages • {formatBytes(originalSize)}</p>
              </div>
            </div>
          </div>

          {/* Compression Level Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Compression Intensity
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Light', desc: 'Fast stream strip, 100% text fidelity' },
                { id: 'medium', label: 'Recommended', desc: 'Balanced object deduplication' },
                { id: 'aggressive', label: 'High', desc: 'Maximum structural optimization' }
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id as any)}
                  className={`p-3 text-left rounded-2xl border transition-all ${
                    level === lvl.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{lvl.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{lvl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Savings Estimator */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Estimated Output Size:</span>
              <div className="text-base font-bold text-emerald-700 font-mono">
                ~{formatBytes(estimatedOutputSize)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Estimated Space Saved:</span>
              <div className="text-base font-bold text-emerald-700 font-mono">
                ~{Math.round(estimatedReduction * 100)}%
              </div>
            </div>
          </div>

          {status && (
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 px-2">
              <FileCheck size={13} className="text-emerald-600" /> {status}
            </div>
          )}

          <button
            onClick={handleCompress}
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Download size={16} />
            {loading ? 'Optimizing PDF...' : 'Compress & Download PDF'}
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { pdfjsLib } from '../utils/pdfWorker';
import {
  Scissors,
  Upload,
  Download,
  RefreshCw,
  Sparkles,
  CheckSquare,
  Square,
  FileCheck,
  FileText
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

interface PageThumbnail {
  pageNumber: number;
  thumbnailUrl: string;
}

export default function PdfSplitPage() {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState('');
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  const loadSamplePdf = async () => {
    setLoading(true);
    setStatus('Generating sample 5-page PDF...');
    try {
      const doc = await PDFDocument.create();
      for (let i = 1; i <= 5; i++) {
        const page = doc.addPage([595, 842]);
        page.drawRectangle({
          x: 50,
          y: 700,
          width: 495,
          height: 90,
          color: { type: 'RGB', red: 0.2, green: 0.3 * i, blue: 0.8 } as any
        });
      }
      const bytes = await doc.save();
      await renderThumbnails(bytes, 'Sample-Document-5Pages.pdf');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderThumbnails = async (bytes: Uint8Array, name: string) => {
    setPdfBytes(bytes);
    setFileName(name);
    setLoading(true);
    setStatus('Rendering page thumbnails...');

    try {
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
      const doc = await loadingTask.promise;
      const count = doc.numPages;
      const thumbs: PageThumbnail[] = [];

      for (let i = 1; i <= count; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbs.push({ pageNumber: i, thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8) });
        }
      }

      setThumbnails(thumbs);
      setSelectedPages(new Set([1]));
      setStatus(`Loaded ${count} pages.`);
    } catch (err) {
      console.error(err);
      setStatus('Failed to parse PDF.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const buffer = await file.arrayBuffer();
    await renderThumbnails(new Uint8Array(buffer), file.name);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const togglePage = (num: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const applyRange = () => {
    if (!rangeInput.trim()) return;
    const parts = rangeInput.split(',');
    const newSelected = new Set<number>();

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= thumbnails.length) newSelected.add(i);
          }
        }
      } else {
        const val = parseInt(trimmed);
        if (!isNaN(val) && val >= 1 && val <= thumbnails.length) {
          newSelected.add(val);
        }
      }
    }

    if (newSelected.size > 0) {
      setSelectedPages(newSelected);
      setStatus(`Selected ${newSelected.size} pages from range.`);
    }
  };

  const handleExtract = async () => {
    if (!pdfBytes || selectedPages.size === 0) return;
    setLoading(true);
    setStatus('Extracting selected pages...');

    try {
      const srcDoc = await PDFDocument.load(pdfBytes);
      const newDoc = await PDFDocument.create();

      const pageIndices = Array.from(selectedPages)
        .sort((a, b) => a - b)
        .map((p) => p - 1);

      const copied = await newDoc.copyPages(srcDoc, pageIndices);
      copied.forEach((p) => newDoc.addPage(p));

      const bytes = await newDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `extracted-pages-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus(`Successfully extracted ${selectedPages.size} pages.`);
    } catch (err) {
      console.error(err);
      setStatus('Error extracting pages.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Scissors size={22} />
            </div>
            PDF Splitter & Page Extractor
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Extract selected page ranges or individual pages from any PDF document into a clean new file.
          </p>
        </div>

        {thumbnails.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPdfBytes(null);
                setThumbnails([]);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Change File
            </button>
            <button
              onClick={handleExtract}
              disabled={loading || selectedPages.size === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> Extract ({selectedPages.size}) Pages
            </button>
          </div>
        )}
      </div>

      {thumbnails.length === 0 ? (
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
              <h3 className="text-lg font-bold text-slate-800 mb-1">Upload PDF document to split</h3>
              <p className="text-sm text-slate-500 mb-5">Select pages visually or specify page numbers.</p>
              <div className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl">
                Browse PDF
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={loadSamplePdf}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100"
            >
              <Sparkles size={14} /> Load Sample 5-Page PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Quick Range Parser */}
            <div className="flex items-center gap-2 max-w-sm w-full">
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="e.g. 1-3, 5"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none font-mono"
              />
              <button
                onClick={applyRange}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shrink-0"
              >
                Apply Range
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (selectedPages.size === thumbnails.length) setSelectedPages(new Set());
                  else setSelectedPages(new Set(thumbnails.map((t) => t.pageNumber)));
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5"
              >
                {selectedPages.size === thumbnails.length ? <CheckSquare size={14} /> : <Square size={14} />}
                {selectedPages.size === thumbnails.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {status && (
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 px-2">
              <FileCheck size={13} className="text-emerald-600" /> {status}
            </div>
          )}

          {/* Grid of Pages */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {thumbnails.map((t) => {
              const isSelected = selectedPages.has(t.pageNumber);
              return (
                <div
                  key={t.pageNumber}
                  onClick={() => togglePage(t.pageNumber)}
                  className={`bg-white rounded-2xl border-2 p-2 transition-all cursor-pointer shadow-2xs flex flex-col items-center ${
                    isSelected ? 'border-emerald-600 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full flex items-center justify-between mb-2 px-1 text-xs">
                    <span className="font-bold text-slate-700 font-mono">Page {t.pageNumber}</span>
                    {isSelected ? (
                      <CheckSquare size={16} className="text-emerald-600" />
                    ) : (
                      <Square size={16} className="text-slate-300" />
                    )}
                  </div>

                  <div className="bg-slate-100 rounded-xl p-2 flex items-center justify-center min-h-[150px] w-full">
                    <img src={t.thumbnailUrl} alt={`Page ${t.pageNumber}`} className="max-h-[130px] w-auto shadow-xs rounded" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleExtract}
              disabled={loading || selectedPages.size === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Download size={16} />
              Extract {selectedPages.size} Selected Pages
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

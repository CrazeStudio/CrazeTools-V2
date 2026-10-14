import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument, degrees } from 'pdf-lib';
import { pdfjsLib } from '../utils/pdfWorker';
import {
  ArrowUpDown,
  Upload,
  RotateCw,
  Trash2,
  MoveLeft,
  MoveRight,
  Download,
  Plus,
  RefreshCw,
  Sparkles,
  FileCheck,
  FileUp,
  CheckSquare,
  Square,
  Copy
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

interface PdfPageItem {
  id: string;
  originalPageIndex: number;
  rotation: number;
  thumbnailUrl: string;
  sourceDocBytes: Uint8Array;
  fileName: string;
}

export default function PdfOrganizePage() {
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  const handleLoadSamplePdf = async () => {
    setLoading(true);
    setStatusMessage('Generating 4-page sample document...');
    try {
      const doc = await PDFDocument.create();
      const colors: [number, number, number][] = [
        [0.2, 0.4, 0.9],
        [0.9, 0.4, 0.2],
        [0.1, 0.7, 0.4],
        [0.6, 0.2, 0.8]
      ];

      for (let i = 0; i < 4; i++) {
        const page = doc.addPage([595, 842]);
        const { width, height } = page.getSize();
        const [r, g, b] = colors[i];

        page.drawRectangle({
          x: 40,
          y: height - 120,
          width: width - 80,
          height: 80,
          color: { type: 'RGB', red: r, green: g, blue: b } as any
        });

        for (let row = 0; row < 5; row++) {
          page.drawRectangle({
            x: 50,
            y: height - 200 - row * 60,
            width: width - 100,
            height: 35,
            color: { type: 'RGB', red: 0.94, green: 0.95, blue: 0.98 } as any
          });
        }
      }

      const bytes = await doc.save();
      await processPdfBytes(bytes, 'Sample-Document.pdf');
    } catch (err) {
      console.error(err);
      setStatusMessage('Error generating sample document.');
    } finally {
      setLoading(false);
    }
  };

  const processPdfBytes = async (bytes: Uint8Array, fileName: string) => {
    try {
      setStatusMessage(`Rendering pages from ${fileName}...`);
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
      const pdfJsDoc = await loadingTask.promise;
      const numPages = pdfJsDoc.numPages;

      const newPages: PdfPageItem[] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfJsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.75 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);

          newPages.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            originalPageIndex: pageNum - 1,
            rotation: 0,
            thumbnailUrl,
            sourceDocBytes: bytes,
            fileName
          });
        }
      }

      setPages((prev) => [...prev, ...newPages]);
      setStatusMessage(`Loaded ${newPages.length} pages.`);
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to render PDF.');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);

    for (const file of acceptedFiles) {
      try {
        const buffer = await file.arrayBuffer();
        await processPdfBytes(new Uint8Array(buffer), file.name);
      } catch (err) {
        console.error(err);
      }
    }
    setLoading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  });

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...pages];
    const item = updated.splice(draggedIndex, 1)[0];
    updated.splice(index, 0, item);
    setPages(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const movePage = (index: number, dir: 'left' | 'right') => {
    const target = dir === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= pages.length) return;
    const updated = [...pages];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setPages(updated);
  };

  const deletePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const rotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const rotateAllPages = () => {
    setPages((prev) =>
      prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 }))
    );
  };

  const reversePages = () => {
    setPages((prev) => [...prev].reverse());
  };

  const duplicatePage = (index: number) => {
    const item = pages[index];
    const copy: PdfPageItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    const updated = [...pages];
    updated.splice(index + 1, 0, copy);
    setPages(updated);
  };

  const handleExport = async () => {
    if (pages.length === 0) return;
    setLoading(true);
    setStatusMessage('Building organized PDF...');

    try {
      const newDoc = await PDFDocument.create();
      const cache = new Map<Uint8Array, PDFDocument>();

      for (const p of pages) {
        let srcDoc = cache.get(p.sourceDocBytes);
        if (!srcDoc) {
          srcDoc = await PDFDocument.load(p.sourceDocBytes);
          cache.set(p.sourceDocBytes, srcDoc);
        }

        const [copied] = await newDoc.copyPages(srcDoc, [p.originalPageIndex]);
        if (p.rotation !== 0) {
          const cur = copied.getRotation().angle;
          copied.setRotation(degrees((cur + p.rotation) % 360));
        }
        newDoc.addPage(copied);
      }

      const bytes = await newDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reordered-document-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setStatusMessage('PDF downloaded successfully.');
    } catch (err) {
      console.error(err);
      setStatusMessage('Error compiling PDF.');
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
              <ArrowUpDown size={22} />
            </div>
            PDF Page Organizer & Reorder
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Drag and drop page cards to switch page numbers, rotate 90°, and delete unwanted pages.
          </p>
        </div>

        {pages.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPages([])}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Reset
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> Download Reordered PDF
            </button>
          </div>
        )}
      </div>

      {pages.length === 0 ? (
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
                <FileUp size={30} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Upload PDF document</h3>
              <p className="text-sm text-slate-500 mb-5">
                Pages will render into draggable cards. Drag any card to reorder page numbers.
              </p>
              <div className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl">
                Browse PDF
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleLoadSamplePdf}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100"
            >
              <Sparkles size={14} /> Load Sample 4-Page Document
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-600 font-medium mr-2">
                Total Pages: <strong className="text-slate-900">{pages.length}</strong>
              </span>

              <button
                onClick={rotateAllPages}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <RotateCw size={13} /> Rotate All 90°
              </button>
              <button
                onClick={reversePages}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <ArrowUpDown size={13} /> Reverse Order
              </button>
            </div>

            <div {...getRootProps()} className="cursor-pointer">
              <input {...getInputProps()} />
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus size={14} /> Add More Pages
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 px-2">
              <FileCheck size={13} className="text-emerald-600" /> {statusMessage}
            </div>
          )}

          {/* Draggable Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {pages.map((page, index) => (
              <div
                key={page.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-400 p-2 shadow-xs transition-all flex flex-col cursor-grab active:cursor-grabbing relative"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-mono font-bold">
                    Page #{index + 1}
                  </span>
                  <button
                    onClick={() => deletePage(page.id)}
                    title="Delete page"
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Thumbnail */}
                <div className="bg-slate-100/70 rounded-xl p-2 flex items-center justify-center min-h-[160px] select-none">
                  <img
                    src={page.thumbnailUrl}
                    alt={`Page ${index + 1}`}
                    className="max-h-[140px] w-auto object-contain shadow-xs rounded"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  />
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => movePage(index, 'left')}
                      disabled={index === 0}
                      title="Move Left"
                      className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 hover:bg-slate-100 rounded"
                    >
                      <MoveLeft size={13} />
                    </button>
                    <button
                      onClick={() => movePage(index, 'right')}
                      disabled={index === pages.length - 1}
                      title="Move Right"
                      className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 hover:bg-slate-100 rounded"
                    >
                      <MoveRight size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => duplicatePage(index)}
                      title="Duplicate Page"
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => rotatePage(page.id)}
                      title="Rotate 90°"
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    >
                      <RotateCw size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Download size={16} />
              {loading ? 'Processing...' : 'Download Processed PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

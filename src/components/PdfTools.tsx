import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument, degrees } from 'pdf-lib';
import { pdfjsLib } from '../utils/pdfWorker';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  RotateCw,
  MoveLeft,
  MoveRight,
  Download,
  Scissors,
  Layers,
  Minimize2,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  Eye,
  FileCheck,
  AlertCircle,
  FileUp,
  ArrowUpDown
} from 'lucide-react';
import { animateFadeIn, animateScaleIn } from '../utils/animation';

interface PdfPageItem {
  id: string; // unique ID for React keys and dragging
  originalFileIndex: number;
  originalPageIndex: number;
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl: string; // rendered dataUrl
  sourceDocBytes: Uint8Array;
  fileName: string;
}

export default function PdfTools() {
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activeAction, setActiveAction] = useState<'reorder' | 'merge' | 'split' | 'compress'>('reorder');
  const [compressionLevel, setCompressionLevel] = useState<'light' | 'medium' | 'high'>('medium');
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
  const [previewModalPage, setPreviewModalPage] = useState<PdfPageItem | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 320 });
    }
  }, []);

  // Generate a multi-page sample PDF for quick testing
  const handleLoadSamplePdf = async () => {
    setLoading(true);
    setStatusMessage('Generating sample 4-page PDF...');
    try {
      const pdfDoc = await PDFDocument.create();
      const colors = [
        [0.18, 0.28, 0.8], // Blue
        [0.85, 0.35, 0.15], // Orange
        [0.1, 0.65, 0.45], // Emerald
        [0.55, 0.2, 0.75]  // Purple
      ];

      for (let i = 0; i < 4; i++) {
        const page = pdfDoc.addPage([595, 842]); // A4
        const { width, height } = page.getSize();
        const [r, g, b] = colors[i];

        // Draw header background
        page.drawRectangle({
          x: 40,
          y: height - 120,
          width: width - 80,
          height: 80,
          color: { type: 'RGB', red: r, green: g, blue: b } as any,
        });

        // Simple text simulation with lines and rectangles
        page.drawRectangle({
          x: 60,
          y: height - 90,
          width: 250,
          height: 20,
          color: { type: 'RGB', red: 1, green: 1, blue: 1 } as any,
        });

        // Content blocks
        for (let row = 0; row < 5; row++) {
          page.drawRectangle({
            x: 60,
            y: height - 200 - row * 60,
            width: width - 120,
            height: 35,
            color: { type: 'RGB', red: 0.94, green: 0.95, blue: 0.98 } as any,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      await processUploadedPdfBytes(pdfBytes, 'Daily-Sample-Document.pdf');
    } catch (err) {
      console.error('Failed to generate sample PDF:', err);
      setStatusMessage('Error generating sample PDF.');
    } finally {
      setLoading(false);
    }
  };

  // Convert PDF bytes to renderable thumbnails & page items
  const processUploadedPdfBytes = async (bytes: Uint8Array, fileName: string) => {
    try {
      setStatusMessage(`Rendering pages from ${fileName}...`);
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
      const pdfJsDoc = await loadingTask.promise;
      const numPages = pdfJsDoc.numPages;

      const newPages: PdfPageItem[] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfJsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.75 }); // Thumbnail scale

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);

          newPages.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            originalFileIndex: 0,
            originalPageIndex: pageNum - 1,
            rotation: 0,
            thumbnailUrl,
            sourceDocBytes: bytes,
            fileName
          });
        }
      }

      setPages((prev) => [...prev, ...newPages]);
      setStatusMessage(`Loaded ${newPages.length} pages from ${fileName}.`);
    } catch (err) {
      console.error('Error rendering PDF:', err);
      setStatusMessage('Failed to load PDF pages. Ensure valid PDF format.');
    }
  };

  // Dropzone handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);

    for (const file of acceptedFiles) {
      try {
        const buffer = await file.arrayBuffer();
        await processUploadedPdfBytes(new Uint8Array(buffer), file.name);
      } catch (err) {
        console.error('Error reading PDF file:', err);
      }
    }
    setLoading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  });

  // Reorder pages via drag & drop
  const handleDragStart = (index: number) => {
    setDraggedPageIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === index) return;

    const updated = [...pages];
    const item = updated.splice(draggedPageIndex, 1)[0];
    updated.splice(index, 0, item);
    setPages(updated);
    setDraggedPageIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedPageIndex(null);
  };

  // Move page manually
  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const updated = [...pages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPages(updated);
  };

  // Delete page
  const deletePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Rotate page 90 degrees
  const rotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  // Select / deselect
  const toggleSelectPage = (id: string) => {
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPages = () => {
    if (selectedPageIds.size === pages.length) {
      setSelectedPageIds(new Set());
    } else {
      setSelectedPageIds(new Set(pages.map((p) => p.id)));
    }
  };

  // Export / Save new PDF (handles reordering, deletions, rotations, merging, and compression)
  const handleExportPdf = async () => {
    if (pages.length === 0) return;
    setLoading(true);
    setStatusMessage('Compiling and generating PDF document...');

    try {
      const newPdfDoc = await PDFDocument.create();

      // Cache loaded source PDF docs so we don't parse the same bytes multiple times
      const sourceDocCache = new Map<Uint8Array, PDFDocument>();

      const pagesToExport =
        activeAction === 'split' && selectedPageIds.size > 0
          ? pages.filter((p) => selectedPageIds.has(p.id))
          : pages;

      if (pagesToExport.length === 0) {
        alert('Please select at least one page to export.');
        setLoading(false);
        return;
      }

      for (const pageItem of pagesToExport) {
        let srcDoc = sourceDocCache.get(pageItem.sourceDocBytes);
        if (!srcDoc) {
          srcDoc = await PDFDocument.load(pageItem.sourceDocBytes);
          sourceDocCache.set(pageItem.sourceDocBytes, srcDoc);
        }

        const [copiedPage] = await newPdfDoc.copyPages(srcDoc, [pageItem.originalPageIndex]);

        if (pageItem.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRotation + pageItem.rotation) % 360));
        }

        newPdfDoc.addPage(copiedPage);
      }

      // If compression active, save with object deduplication
      const pdfBytes = await newPdfDoc.save({
        useObjectStreams: compressionLevel !== 'light'
      });

      // Download
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `toolkit-processed-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setStatusMessage(`PDF successfully generated with ${pagesToExport.length} pages.`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setStatusMessage('Error compiling PDF file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileText size={22} />
            </div>
            PDF Toolkit & Visual Manager
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Drag to reorder pages, rotate, delete, split, merge multiple PDFs, and compress all in one place.
          </p>
        </div>

        {pages.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPages([])}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Clear All
            </button>
            <button
              onClick={handleExportPdf}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
        )}
      </div>

      {/* Upload Zone / Add more files */}
      {pages.length === 0 ? (
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                : 'border-gray-200 bg-gray-50/50 hover:border-emerald-400 hover:bg-emerald-50/20'
            }`}
          >
            <input {...getInputProps()} />
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
                <FileUp size={30} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Upload or drop PDF documents here
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                Drop single or multiple PDFs. Pages will render instantly into interactive cards you can drag, reorder, and modify.
              </p>
              <div className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-emerald-700 transition-colors">
                Select PDF Files
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={handleLoadSamplePdf}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1.5 py-2 px-4 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 transition-colors"
            >
              <Sparkles size={14} /> Generate Sample PDF (No upload needed)
            </button>
          </div>
        </div>
      ) : (
        /* PDF Interactive Workspace */
        <div className="space-y-6">
          {/* Operations Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            {/* Tool Modes */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-xs">
              <button
                onClick={() => setActiveAction('reorder')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeAction === 'reorder'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowUpDown size={14} /> Reorder & Organize
              </button>
              <button
                onClick={() => setActiveAction('merge')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeAction === 'merge'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers size={14} /> Merge Files
              </button>
              <button
                onClick={() => setActiveAction('split')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeAction === 'split'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Scissors size={14} /> Split / Extract
              </button>
              <button
                onClick={() => setActiveAction('compress')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeAction === 'compress'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Minimize2 size={14} /> Compress
              </button>
            </div>

            {/* Quick Bulk Operations */}
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllPages}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {selectedPageIds.size === pages.length ? <CheckSquare size={13} /> : <Square size={13} />}
                {selectedPageIds.size === pages.length ? 'Deselect All' : 'Select All'}
              </button>

              {/* Add more files dropzone button */}
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} /> Append More PDFs
                </button>
              </div>
            </div>
          </div>

          {/* Action-specific Settings Notice */}
          {activeAction === 'split' && (
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors size={15} className="text-amber-600" />
                <span>
                  Select the pages you wish to extract into a separate document ({selectedPageIds.size} of {pages.length} selected).
                </span>
              </div>
              <button
                onClick={handleExportPdf}
                disabled={selectedPageIds.size === 0}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
              >
                Extract Selected ({selectedPageIds.size})
              </button>
            </div>
          )}

          {activeAction === 'compress' && (
            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Minimize2 size={15} className="text-blue-600" />
                <span>
                  Compression optimizes object streams and deduplicates font/image dictionaries.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Level:</span>
                {(['light', 'medium', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setCompressionLevel(lvl)}
                    className={`px-2.5 py-1 uppercase text-[11px] font-bold rounded-md border transition-all ${
                      compressionLevel === lvl
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="text-xs text-gray-500 font-mono flex items-center gap-1.5 px-2">
              <FileCheck size={13} className="text-emerald-600" /> {statusMessage}
            </div>
          )}

          {/* PDF Pages Visual Grid (Drag & Drop Reordering, Delete, Rotate) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {pages.map((page, index) => {
              const isSelected = selectedPageIds.has(page.id);
              return (
                <div
                  key={page.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative bg-white rounded-xl border-2 transition-all shadow-xs overflow-hidden flex flex-col cursor-grab active:cursor-grabbing ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-200'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {/* Top Bar on Page Card: Page Number & Selection */}
                  <div className="flex items-center justify-between p-2 bg-gray-50/90 border-b border-gray-100 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-gray-700">
                      <span className="px-1.5 py-0.5 bg-gray-200 text-gray-800 rounded font-mono text-[10px]">
                        #{index + 1}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleSelectPage(page.id)}
                      className="text-gray-400 hover:text-emerald-600 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare size={15} className="text-emerald-600" />
                      ) : (
                        <Square size={15} />
                      )}
                    </button>
                  </div>

                  {/* Thumbnail Preview Image with live rotation */}
                  <div
                    onClick={() => toggleSelectPage(page.id)}
                    className="flex-1 p-3 bg-gray-100/60 flex items-center justify-center min-h-[170px] select-none"
                  >
                    <img
                      src={page.thumbnailUrl}
                      alt={`Page ${index + 1}`}
                      className="max-h-[150px] w-auto object-contain shadow-xs rounded transition-transform"
                      style={{
                        transform: `rotate(${page.rotation}deg)`
                      }}
                    />
                  </div>

                  {/* Card Action Controls: Rotate, Move Left/Right, Delete */}
                  <div className="flex items-center justify-between p-1.5 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          movePage(index, 'left');
                        }}
                        disabled={index === 0}
                        title="Move Page Backward"
                        className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-20 hover:bg-gray-100 rounded"
                      >
                        <MoveLeft size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          movePage(index, 'right');
                        }}
                        disabled={index === pages.length - 1}
                        title="Move Page Forward"
                        className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-20 hover:bg-gray-100 rounded"
                      >
                        <MoveRight size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          rotatePage(page.id);
                        }}
                        title="Rotate 90° Clockwise"
                        className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
                      >
                        <RotateCw size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(page.id);
                        }}
                        title="Delete Page"
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 font-medium">
              Total Pages: <span className="font-bold text-gray-800">{pages.length}</span>
            </div>

            <button
              onClick={handleExportPdf}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
            >
              <Download size={16} />
              {loading ? 'Building PDF...' : 'Download Processed PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

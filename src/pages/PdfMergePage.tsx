import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import {
  Layers,
  Upload,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Download,
  RefreshCw,
  FileText,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

interface PdfFileItem {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  bytes: Uint8Array;
}

export default function PdfMergePage() {
  const [fileList, setFileList] = useState<PdfFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  const loadSampleFiles = async () => {
    setLoading(true);
    setStatusMessage('Creating sample PDFs...');
    try {
      // Document A (Cover + Summary)
      const docA = await PDFDocument.create();
      const p1 = docA.addPage([595, 842]);
      p1.drawRectangle({
        x: 40,
        y: 700,
        width: 515,
        height: 80,
        color: { type: 'RGB', red: 0.2, green: 0.4, blue: 0.85 } as any
      });
      const p2 = docA.addPage([595, 842]);
      p2.drawRectangle({
        x: 40,
        y: 700,
        width: 515,
        height: 80,
        color: { type: 'RGB', red: 0.2, green: 0.4, blue: 0.85 } as any
      });
      const bytesA = await docA.save();

      // Document B (Appendix)
      const docB = await PDFDocument.create();
      const p3 = docB.addPage([595, 842]);
      p3.drawRectangle({
        x: 40,
        y: 700,
        width: 515,
        height: 80,
        color: { type: 'RGB', red: 0.1, green: 0.65, blue: 0.45 } as any
      });
      const bytesB = await docB.save();

      setFileList([
        { id: '1', name: 'Document-Part1-Report.pdf', size: bytesA.length, pageCount: 2, bytes: bytesA },
        { id: '2', name: 'Document-Part2-Appendix.pdf', size: bytesB.length, pageCount: 1, bytes: bytesB }
      ]);
      setStatusMessage('Loaded 2 sample PDF documents ready to merge.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);

    for (const file of acceptedFiles) {
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const doc = await PDFDocument.load(bytes);
        const count = doc.getPageCount();

        setFileList((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: file.size,
            pageCount: count,
            bytes
          }
        ]);
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

  const moveItem = (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= fileList.length) return;
    const list = [...fileList];
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    setFileList(list);
  };

  const removeItem = (id: string) => {
    setFileList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMerge = async () => {
    if (fileList.length < 2) {
      alert('Please add at least 2 PDF files to merge.');
      return;
    }
    setLoading(true);
    setStatusMessage('Merging documents into master PDF...');

    try {
      const mergedDoc = await PDFDocument.create();

      for (const item of fileList) {
        const srcDoc = await PDFDocument.load(item.bytes);
        const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((p) => mergedDoc.addPage(p));
      }

      const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
      const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged-document-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setStatusMessage('Merged PDF successfully downloaded.');
    } catch (err) {
      console.error(err);
      setStatusMessage('Error merging PDFs.');
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

  const totalPages = fileList.reduce((acc, f) => acc + f.pageCount, 0);
  const totalSize = fileList.reduce((acc, f) => acc + f.size, 0);

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Layers size={22} />
            </div>
            PDF Merger
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Combine multiple PDF files into one consolidated master document in any custom order.
          </p>
        </div>

        {fileList.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFileList([])}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Clear All
            </button>
            <button
              onClick={handleMerge}
              disabled={loading || fileList.length < 2}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> Merge & Download
            </button>
          </div>
        )}
      </div>

      {fileList.length === 0 ? (
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
              <h3 className="text-lg font-bold text-slate-800 mb-1">Select multiple PDF files to merge</h3>
              <p className="text-sm text-slate-500 mb-5">
                Upload 2 or more PDFs. You can reorder their sequence before combining.
              </p>
              <div className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl">
                Choose PDFs
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={loadSampleFiles}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100"
            >
              <Sparkles size={14} /> Load 2 Sample PDFs for Instant Test
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary and Add More */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-600 space-x-3">
              <span>Files: <strong className="text-slate-900">{fileList.length}</strong></span>
              <span>Total Pages: <strong className="text-slate-900">{totalPages}</strong></span>
              <span>Total Size: <strong className="text-slate-900">{formatBytes(totalSize)}</strong></span>
            </div>

            <div {...getRootProps()} className="cursor-pointer">
              <input {...getInputProps()} />
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus size={14} /> Add More Files
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 px-2">
              <FileCheck size={13} className="text-emerald-600" /> {statusMessage}
            </div>
          )}

          {/* List of Files to Merge */}
          <div className="space-y-2.5">
            {fileList.map((file, idx) => (
              <div
                key={file.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{file.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{file.pageCount} pages</span>
                      <span>•</span>
                      <span>{formatBytes(file.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    title="Move Up"
                    className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-20 hover:bg-slate-100 rounded-lg"
                  >
                    <MoveUp size={16} />
                  </button>
                  <button
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === fileList.length - 1}
                    title="Move Down"
                    className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-20 hover:bg-slate-100 rounded-lg"
                  >
                    <MoveDown size={16} />
                  </button>
                  <button
                    onClick={() => removeItem(file.id)}
                    title="Remove file"
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg ml-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleMerge}
              disabled={loading || fileList.length < 2}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Download size={16} />
              {loading ? 'Merging Files...' : `Merge ${fileList.length} Files (${totalPages} Pages)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

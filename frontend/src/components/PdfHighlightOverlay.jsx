import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfHighlightOverlay({ pdfFile, highlight }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageDims, setPageDims] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [errMsg, setErrMsg] = useState('');
  const pageRefs = useRef({});
  const abortRef = useRef(null);

  const loadPdf = useCallback(async (file) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStatus('loading');
    setErrMsg('');
    setPdfDoc(null);
    setPageDims({});

    try {
      let buffer;
      if (file instanceof File || file instanceof Blob) {
        buffer = await file.arrayBuffer();
      } else if (typeof file === 'string') {
        const res = await fetch(file, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching PDF`);
        buffer = await res.arrayBuffer();
      } else {
        throw new Error('Invalid pdfFile type');
      }

      if (ctrl.signal.aborted) return;

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const doc = await loadingTask.promise;

      if (ctrl.signal.aborted) return;

      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setStatus('ready');
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[PdfHighlightOverlay] Load error:', err);
      setErrMsg(err.message || 'Failed to load PDF.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (pdfFile) loadPdf(pdfFile);
    else { setStatus('idle'); setPdfDoc(null); }
  }, [pdfFile, loadPdf]);

  useEffect(() => {
    if (highlight?.page_number && pageRefs.current[highlight.page_number]) {
      pageRefs.current[highlight.page_number].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlight]);

  if (status === 'idle' || !pdfFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#565449] text-xs gap-2">
        <span>No PDF loaded</span>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[#565449] text-xs">
        <div className="w-7 h-7 border-2 border-[#11120D] border-t-transparent rounded-full animate-spin" />
        <span>Loading PDF pages…</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-red-700 text-xs bg-red-50 border border-red-200 rounded-lg p-4">
        <span className="font-bold">PDF Error</span>
        <span className="text-center">{errMsg}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto space-y-4 flex flex-col items-center py-2">
      {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
        <PdfPage
          key={pageNum}
          pdfDoc={pdfDoc}
          pageNum={pageNum}
          highlight={highlight?.page_number === pageNum ? highlight : null}
          onDims={(dims) => setPageDims((p) => ({ ...p, [pageNum]: dims }))}
          dims={pageDims[pageNum]}
          domRef={(el) => { pageRefs.current[pageNum] = el; }}
        />
      ))}
    </div>
  );
}

function PdfPage({ pdfDoc, pageNum, highlight, onDims, dims, domRef }) {
  const canvasRef = useRef(null);
  const activeTaskRef = useRef(null);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;

    pdfDoc.getPage(pageNum).then((page) => {
      if (cancelled || !canvasRef.current) return;

      const SCALE = 1.2;
      const viewport = page.getViewport({ scale: SCALE });
      const canvas = canvasRef.current;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const view = page.view;
      onDims({
        width: (view[2] - view[0]),
        height: (view[3] - view[1]),
        scale: SCALE,
        canvasW: canvas.width,
        canvasH: canvas.height,
      });

      const ctx = canvas.getContext('2d');
      if (activeTaskRef.current) activeTaskRef.current.cancel();

      const task = page.render({ canvasContext: ctx, viewport });
      activeTaskRef.current = task;
      task.promise.catch((e) => {
        if (e?.name !== 'RenderingCancelledException') console.warn('Render error p' + pageNum, e);
      });
    });

    return () => {
      cancelled = true;
      if (activeTaskRef.current) activeTaskRef.current.cancel();
    };
  }, [pdfDoc, pageNum]);

  const renderHighlight = () => {
    if (!highlight || !dims) return null;
    const { x0, top, x1, bottom } = highlight;
    
    // Use percentages so coordinates scale nicely with CSS-responsive sizing
    const leftPercent = (x0 / dims.width) * 100;
    const topPercent = (top / dims.height) * 100;
    const widthPercent = ((x1 - x0) / dims.width) * 100;
    const heightPercent = ((bottom - top) / dims.height) * 100;

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
          backgroundColor: 'rgba(216, 207, 188, 0.55)',
          border: '2px solid #11120D',
          borderRadius: '2px',
          transition: 'all 0.25s ease',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.08)',
          zIndex: 10,
        }}
      />
    );
  };

  return (
    <div
      ref={domRef}
      className="relative shadow-md border border-[#D8CFBC] bg-white rounded overflow-hidden flex-shrink-0 w-full max-w-full"
      style={{ display: 'block', aspectRatio: dims ? `${dims.width} / ${dims.height}` : 'auto' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} />
      {renderHighlight()}
      <div className="absolute bottom-1.5 right-1.5 bg-[#11120D]/60 text-white px-1.5 py-0.5 text-[9px] rounded font-bold select-none">
        {pageNum}
      </div>
    </div>
  );
}

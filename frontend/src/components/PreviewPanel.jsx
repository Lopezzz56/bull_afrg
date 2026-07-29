import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { getPreviewHtml } from '../services/api';

export default function PreviewPanel({ reportData }) {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const html = await getPreviewHtml(reportData);
      setHtmlContent(html);
    } catch (err) {
      setError(err.message || 'Failed to load preview from server.');
    } finally {
      setLoading(false);
    }
  }, [reportData]);

  // Auto-load once on mount only — user hits "Refresh" manually after that
  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full bg-white border border-[#D8CFBC] rounded-lg overflow-hidden">

      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#D8CFBC] bg-[#FFFBF4] flex-shrink-0">
        <div className="flex items-center gap-2">
          <ExternalLink size={12} className="text-[#565449]" strokeWidth={2} />
          <span className="label-xs">Live HTML Render</span>
        </div>
        <button
          onClick={loadPreview}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#565449] border border-[#D8CFBC] px-3 py-1 rounded hover:border-[#565449] hover:text-[#11120D] transition-all duration-150 select-none"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin-slow' : ''} strokeWidth={2} />
          {loading ? 'Rendering…' : 'Refresh'}
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2 z-10">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-full border border-[#D8CFBC]" />
              <div className="absolute inset-0 rounded-full border border-transparent border-t-[#11120D] animate-spin-slow" />
            </div>
            <span className="text-[11px] text-[#565449]">Compiling report layout…</span>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
              <span className="text-red-500 text-lg leading-none">!</span>
            </div>
            <div className="text-center">
              <p className="text-[12px] font-semibold text-[#11120D] mb-1">Preview failed</p>
              <p className="text-[11px] text-[#565449] max-w-[280px] leading-relaxed">{error}</p>
            </div>
            <button onClick={loadPreview} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#565449] border border-[#D8CFBC] px-3 py-1.5 rounded hover:border-[#565449] hover:text-[#11120D] transition-all duration-150 select-none mt-1">
              <RefreshCw size={11} strokeWidth={2} /> Try again
            </button>
          </div>
        ) : (
          <iframe
            title="Live PDF Report Preview"
            srcDoc={htmlContent}
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  );
}

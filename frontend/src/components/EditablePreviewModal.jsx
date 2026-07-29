import React, { useState, useEffect } from 'react';
import { Eye, Edit3, CheckCircle, FileText, Download, AlertTriangle, Plus, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import PdfHighlightOverlay from './PdfHighlightOverlay';
import { saveStateToDB } from '../services/db';


export default function EditablePreviewModal({ initialData, file, onBack }) {
  const [reportData, setReportData] = useState(initialData.data);
  const [citations, setCitations] = useState(initialData.citations || {});
  const [validationFlags, setValidationFlags] = useState(initialData.validation_flags || {});
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [activeTab, setActiveTab] = useState('edit-header'); // edit-header, edit-financials, edit-narrative, preview
  const [previewHtml, setPreviewHtml] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Auto-persist changes to IndexedDB when reportData, validationFlags, or citations change
  useEffect(() => {
    saveStateToDB('editor', { data: reportData, citations, validation_flags: validationFlags }, file);
  }, [reportData, citations, validationFlags, file]);

  // Load preview HTML whenever active tab changes to 'preview'
  useEffect(() => {
    if (activeTab === 'preview') {
      fetchPreviewHtml();
    }
  }, [activeTab]);

  const fetchPreviewHtml = async () => {
    setIsPreviewLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/preview-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: reportData })
      });
      if (res.ok) {
        const html = await res.text();
        setPreviewHtml(html);
      }
    } catch (err) {
      console.error("Failed to load live preview HTML:", err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: reportData })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FinReport_${reportData.header.company_name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Focus coordinate handler
  const handleFieldFocus = (path) => {
    if (citations[path]) {
      setActiveHighlight(citations[path]);
    } else {
      setActiveHighlight(null);
    }
  };

  const handleFieldChange = (section, key, value, index = null, subKey = null, valueIndex = null) => {
    const updated = { ...reportData };
    
    if (index !== null) {
      if (subKey !== null) {
        if (valueIndex !== null) {
          // List of arrays, e.g., shareholding.rows[index].values[valueIndex]
          updated[section][key][index][subKey][valueIndex] = value;
        } else {
          // List of objects, e.g., pnl.rows[index].values
          updated[section][key][index][subKey] = value;
        }
      } else {
        // Simple list, e.g., narrative_bullets[index]
        updated[section][index] = value;
      }
    } else if (key) {
      // Nested object, e.g., header.company_name
      updated[section][key] = value;
    } else {
      // Root level string, e.g., narrative_headline
      updated[section] = value;
    }
    
    setReportData(updated);
    
    // Trigger client-side validation logic or recalculation here if desired
    // For simplicity, we can do a backend validate ping in the background to update validationFlags
    debouncedValidate(updated);
  };

  // Run backend math validations on changes
  const debouncedValidate = async (data) => {
    try {
      // Perform validation check
      const checkRes = await fetch('http://127.0.0.1:8000/api/preview-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      // Just to update validation flags locally, we can extract them
      // In a real production system, a separate validation endpoint is cleaner,
      // but we can compute flags via custom validation function directly
      // Let's implement local validation matching backend/validator.py for real-time responsiveness
      recalculateLocalValidations(data);
    } catch (e) {}
  };

  const recalculateLocalValidations = (data) => {
    // Simple clone of math checker logic in JS
    const flags = {};
    const cleanFloat = (val) => {
      if (!val) return NaN;
      let s = val.toString().replace(/%/g, '').replace(/,/g, '').trim();
      if (s.startsWith('(') && s.endsWith(')')) s = '-' + s.slice(1, -1);
      return parseFloat(s);
    };

    const qtr = data.quarterly_financials || {};
    const cols = qtr.columns || [];
    const rows = qtr.rows || [];
    
    let yoy_idx = cols.findIndex(c => c.toLowerCase().includes('yoy'));
    let qoq_idx = cols.findIndex(c => c.toLowerCase().includes('qoq'));
    let curr_idx = 0;
    let prev_q_idx = 1;
    let prev_y_idx = 2;

    rows.forEach((row, rowIdx) => {
      const vals = row.values || [];
      const currVal = cleanFloat(vals[curr_idx]);
      if (yoy_idx !== -1 && prev_y_idx !== -1) {
        const prevYVal = cleanFloat(vals[prev_y_idx]);
        if (!isNaN(currVal) && !isNaN(prevYVal) && prevYVal !== 0) {
          const calcYoY = ((currVal - prevYVal) / Math.abs(prevYVal)) * 100;
          const repYoY = cleanFloat(vals[yoy_idx]);
          if (!isNaN(repYoY) && Math.abs(repYoY - calcYoY) > 1.0) {
            flags[`quarterly_financials.rows[${rowIdx}].values[${yoy_idx}]`] = `Discrepancy: reported ${vals[yoy_idx]}% vs calculated ${calcYoY.toFixed(1)}%`;
          }
        }
      }
      if (qoq_idx !== -1 && prev_q_idx !== -1) {
        const prevQVal = cleanFloat(vals[prev_q_idx]);
        if (!isNaN(currVal) && !isNaN(prevQVal) && prevQVal !== 0) {
          const calcQoQ = ((currVal - prevQVal) / Math.abs(prevQVal)) * 100;
          const repQoQ = cleanFloat(vals[qoq_idx]);
          if (!isNaN(repQoQ) && Math.abs(repQoQ - calcQoQ) > 1.0) {
            flags[`quarterly_financials.rows[${rowIdx}].values[${qoq_idx}]`] = `Discrepancy: reported ${vals[qoq_idx]}% vs calculated ${calcQoQ.toFixed(1)}%`;
          }
        }
      }
    });

    setValidationFlags(flags);
  };

  const renderValidationError = (path) => {
    if (validationFlags[path]) {
      return (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-[#11120D] bg-[#D8CFBC]/50 border border-[#565449]/30 px-2 py-0.5 rounded">
          <AlertTriangle className="w-3 h-3 text-[#11120D] flex-shrink-0" />
          <span className="font-semibold">{validationFlags[path]}</span>
        </div>
      );
    }
    return null;
  };

return (
    <div className="flex h-screen w-full bg-[#FFFBF4] text-[#11120D] overflow-hidden">
      {/* LEFT COLUMN: PDF Viewer */}
      <div className="w-1/2 h-full border-r border-[#D8CFBC] flex flex-col p-4 bg-[#FFFBF4]">
        <div className="flex items-center justify-between mb-3 border-b border-[#D8CFBC] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#565449]" />
            <h2 className="font-bold text-[#11120D] text-xs uppercase tracking-wider">Source Document</h2>
          </div>
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#565449] hover:text-[#11120D] border border-[#D8CFBC] hover:border-[#565449] bg-white px-3 py-1.5 rounded transition-all shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> New Upload
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-white rounded-lg border border-[#D8CFBC] p-2 overflow-hidden">
          <PdfHighlightOverlay pdfFile={file} highlight={activeHighlight} />
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Editor & HTML Preview */}
      <div className="w-1/2 h-full flex flex-col p-4 bg-[#FFFBF4]">
        {/* Top Header / Navigation */}
        <div className="flex items-center justify-between mb-3 border-b border-[#D8CFBC] pb-3">
          <div className="flex gap-1.5 bg-white p-1 rounded-md border border-[#D8CFBC]">
            <button
              onClick={() => setActiveTab('edit-header')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                activeTab === 'edit-header' 
                  ? 'bg-[#11120D] text-white shadow-sm' 
                  : 'text-[#565449] hover:text-[#11120D] hover:bg-[#FFFBF4]'
              }`}
            >
              Header Info
            </button>
            <button
              onClick={() => setActiveTab('edit-financials')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                activeTab === 'edit-financials' 
                  ? 'bg-[#11120D] text-white shadow-sm' 
                  : 'text-[#565449] hover:text-[#11120D] hover:bg-[#FFFBF4]'
              }`}
            >
              Financial Tables
            </button>
            <button
              onClick={() => setActiveTab('edit-narrative')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                activeTab === 'edit-narrative' 
                  ? 'bg-[#11120D] text-white shadow-sm' 
                  : 'text-[#565449] hover:text-[#11120D] hover:bg-[#FFFBF4]'
              }`}
            >
              Narrative & Summary
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all flex items-center gap-1.5 ${
                activeTab === 'preview' 
                  ? 'bg-[#00A896] text-white shadow-sm' 
                  : 'text-[#00A896] hover:bg-[#FFFBF4]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Live Preview
            </button>
          </div>
          
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-[#11120D] text-white hover:bg-[#2a2b26] font-semibold text-xs px-4 py-2 rounded-md shadow-sm transition-all"
          >
            {isDownloading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" /> Download PDF
              </>
            )}
          </button>
        </div>

        {/* Editor Content Area */}
        <div className="flex-1 min-h-0 bg-white border border-[#D8CFBC] rounded-lg p-5 overflow-y-auto shadow-sm">
          
          {/* TAB 1: Header Info */}
          {activeTab === 'edit-header' && (
            <div className="space-y-4">
              <h3 className="font-bold text-[#11120D] text-xs uppercase tracking-wider border-b border-[#D8CFBC] pb-2">
                Header & Metadata
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#565449] font-bold mb-1">COMPANY NAME</label>
                  <input
                    type="text"
                    value={reportData?.header?.company_name || ''}
                    onChange={(e) => handleFieldChange('header', 'company_name', e.target.value)}
                    onFocus={() => handleFieldFocus('header.company_name')}
                    className="w-full border border-[#D8CFBC] focus:border-[#11120D] rounded px-3 py-2 text-xs bg-[#FFFBF4]/30 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#565449] font-bold mb-1">SECTOR</label>
                  <input
                    type="text"
                    value={reportData?.header?.sector || ''}
                    onChange={(e) => handleFieldChange('header', 'sector', e.target.value)}
                    onFocus={() => handleFieldFocus('header.sector')}
                    className="w-full border border-[#D8CFBC] focus:border-[#11120D] rounded px-3 py-2 text-xs bg-[#FFFBF4]/30 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#565449] font-bold mb-1">RATING</label>
                  <select
                    value={reportData?.header?.rating || 'BUY'}
                    onChange={(e) => handleFieldChange('header', 'rating', e.target.value)}
                    onFocus={() => handleFieldFocus('header.rating')}
                    className="w-full border border-[#D8CFBC] focus:border-[#11120D] rounded px-3 py-2 text-xs bg-white outline-none transition-all"
                  >
                    <option value="BUY">BUY</option>
                    <option value="ACCUMULATE">ACCUMULATE</option>
                    <option value="HOLD">HOLD</option>
                    <option value="REDUCE">REDUCE</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#565449] font-bold mb-1">TARGET PRICE (Rs.)</label>
                  <input
                    type="text"
                    value={reportData?.header?.target_price || ''}
                    onChange={(e) => handleFieldChange('header', 'target_price', e.target.value)}
                    onFocus={() => handleFieldFocus('header.target_price')}
                    className="w-full border border-[#D8CFBC] focus:border-[#11120D] rounded px-3 py-2 text-xs bg-[#FFFBF4]/30 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Financial Tables */}
          {activeTab === 'edit-financials' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-[#11120D] text-xs uppercase tracking-wider border-b border-[#D8CFBC] pb-2 mb-3">
                  Quarterly Financials (Rs. Cr)
                </h3>
                <div className="overflow-x-auto border border-[#D8CFBC] rounded">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FFFBF4] text-[#11120D] font-semibold border-b border-[#D8CFBC]">
                        <th className="p-2 border-r border-[#D8CFBC]">Metric</th>
                        {reportData?.quarterly_financials?.columns?.map((col, idx) => (
                          <th key={idx} className="p-2 border-r border-[#D8CFBC] text-right">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.quarterly_financials?.rows?.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-[#D8CFBC] hover:bg-[#FFFBF4]/50">
                          <td className="p-2 border-r border-[#D8CFBC] font-medium text-[#11120D] bg-[#FFFBF4]/20">{row.label}</td>
                          {row.values.map((val, valIdx) => (
                            <td key={valIdx} className="p-1 border-r border-[#D8CFBC] text-right">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleFieldChange('quarterly_financials', 'rows', e.target.value, rowIdx, 'values', valIdx)}
                                onFocus={() => handleFieldFocus(`quarterly_financials.rows[${rowIdx}].values[${valIdx}]`)}
                                className="w-full text-right bg-transparent p-1 border border-transparent hover:border-[#D8CFBC] focus:border-[#11120D] focus:bg-white rounded text-xs outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Narrative & Bullet Points */}
          {activeTab === 'edit-narrative' && (
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] text-[#565449] font-bold mb-1">NARRATIVE HEADLINE</label>
                <input
                  type="text"
                  value={reportData?.narrative_headline || ''}
                  onChange={(e) => handleFieldChange('narrative_headline', null, e.target.value)}
                  onFocus={() => handleFieldFocus('narrative_headline')}
                  className="w-full border border-[#D8CFBC] focus:border-[#11120D] rounded px-3 py-2 text-xs font-semibold bg-[#FFFBF4]/30 outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] text-[#565449] font-bold">KEY BULLET HIGHLIGHTS</label>
                  <button 
                    onClick={() => {
                      const updated = [...(reportData?.narrative_bullets || []), 'New summary point'];
                      handleFieldChange('narrative_bullets', null, updated);
                    }}
                    className="text-[11px] font-semibold text-[#00A896] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Highlight
                  </button>
                </div>
                <div className="space-y-2">
                  {reportData?.narrative_bullets?.map((bullet, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => handleFieldChange('narrative_bullets', null, e.target.value, idx)}
                        onFocus={() => handleFieldFocus(`narrative_bullets[${idx}]`)}
                        className="flex-1 border border-[#D8CFBC] focus:border-[#11120D] rounded px-3 py-2 text-xs bg-[#FFFBF4]/30 outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = reportData.narrative_bullets.filter((_, i) => i !== idx);
                          handleFieldChange('narrative_bullets', null, updated);
                        }}
                        className="text-[#565449] hover:text-red-600 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Live PDF Preview */}
          {activeTab === 'preview' && (
            <div className="w-full h-full flex flex-col relative min-h-[500px]">
              {isPreviewLoading && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center space-y-2 z-10 backdrop-blur-xs">
                  <RefreshCw className="w-6 h-6 text-[#00A896] animate-spin" />
                  <span className="text-xs font-semibold text-[#565449]">Compiling live HTML report...</span>
                </div>
              )}
              <iframe
                title="Live PDF Report Preview"
                srcDoc={previewHtml}
                className="w-full h-full min-h-[500px] border border-[#D8CFBC] rounded-md bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
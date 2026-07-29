import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileDropzone from './components/FileDropzone';
import EditablePreviewModal from './components/EditablePreviewModal';
import { extractFinancialData, getMockPdfFile } from './services/api';
import { AlertCircle, Server } from 'lucide-react';
import { saveStateToDB, loadStateFromDB, clearStateInDB } from './services/db';
import './App.css';

export default function App() {
  const [screen, setScreen]             = useState('upload');
  const [pdfFile, setPdfFile]           = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError]               = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [extractLog, setExtractLog]     = useState('');   // status messages during extraction
  const [isLoadingState, setIsLoadingState] = useState(true);

  // Load state from IndexedDB on mount
  useEffect(() => {
    async function init() {
      try {
        const saved = await loadStateFromDB();
        if (saved.screen) setScreen(saved.screen);
        if (saved.pdfFile) setPdfFile(saved.pdfFile);
        if (saved.extractedData) setExtractedData(saved.extractedData);
      } catch (e) {
        console.error('Error loading saved state:', e);
      } finally {
        setIsLoadingState(false);
      }
    }
    init();
  }, []);

  // Save state to IndexedDB on changes
  useEffect(() => {
    if (!isLoadingState) {
      saveStateToDB(screen, extractedData, pdfFile);
    }
  }, [screen, extractedData, pdfFile, isLoadingState]);


  // ── Core extraction pipeline ───────────────────────────────────────────────
  const processFile = async (file) => {
    setPdfFile(file);
    setIsExtracting(true);
    setError('');
    setIsNetworkError(false);
    setExtractLog('Uploading PDF to backend…');

    try {
      setExtractLog('Calling Gemini 2.0 Flash for extraction…');
      const result = await extractFinancialData(file);

      // Merge server-side + client-side validation flags
      const serverFlags = result.validation_flags || {};
      setExtractedData({ ...result, validation_flags: serverFlags });

      setExtractLog('');
      setScreen('editor');
    } catch (err) {
      const msg = err.message || 'Extraction failed. Please try again.';
      setError(msg);
      setIsNetworkError(
        msg.toLowerCase().includes('connect') ||
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('failed to fetch')
      );
      setExtractLog('');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsExtracting(true);
    setError('');
    setIsNetworkError(false);
    setExtractLog('Fetching demo PDF…');
    try {
      const blob = await getMockPdfFile();
      const file = new File([blob], 'ICICI_Q2FY26_Demo.pdf', { type: 'application/pdf' });
      await processFile(file);
    } catch (err) {
      const msg = err.message || 'Failed to load demo report.';
      setError(msg);
      setIsNetworkError(msg.toLowerCase().includes('connect'));
      setExtractLog('');
      setIsExtracting(false);
    }
  };

  if (isLoadingState) {
    return (
      <div className="min-h-screen bg-[#FFFBF4] flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#D8CFBC] border-t-[#565449] rounded-full animate-spin" />
      </div>
    );
  }

  // ── EDITOR SCREEN → delegate entirely to EditablePreviewModal ─────────────
  if (screen === 'editor' && extractedData) {
    return (
      <EditablePreviewModal
        initialData={extractedData}
        file={pdfFile}
        onBack={() => {
          setScreen('upload');
          setError('');
          setExtractedData(null);
          setPdfFile(null);
          clearStateInDB();
        }}
      />
    );
  }

  // ── UPLOAD SCREEN ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FFFBF4] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-10 max-w-md">
          <p className="label-sm mb-3">AI-Powered Financial Extraction</p>
          <h2
            className="text-[2.25rem] font-bold text-[#11120D] leading-[1.15] tracking-tight mb-4"
            style={{ letterSpacing: '-0.03em' }}
          >
            Financial Report<br />Compiler
          </h2>
          <p className="text-[13px] text-[#565449] leading-relaxed max-w-sm mx-auto">
            Upload a brokerage research PDF. Gemini 2.0 Flash extracts every metric with
            page-exact coordinate citations, validates all YoY/QoQ math, generates charts,
            and compiles a pixel-perfect Geojit A4 layout.
          </p>
        </div>

        {/* Dropzone */}
        <FileDropzone onFileUploaded={processFile} isExtracting={isExtracting} />

        {/* Extraction status */}
        {isExtracting && extractLog && (
          <div className="mt-4 flex items-center gap-2 text-[11px] text-[#565449]">
            <div className="w-3.5 h-3.5 border-2 border-[#D8CFBC] border-t-[#565449] rounded-full animate-spin" />
            {extractLog}
          </div>
        )}

        {/* Demo link */}
        {!isExtracting && (
          <button
            id="load-demo-btn"
            onClick={handleLoadDemo}
            className="mt-5 text-[11px] font-semibold text-[#565449] hover:text-[#11120D] transition-colors tracking-wide"
          >
            or load the demo report →
          </button>
        )}

        {/* Error banner */}
        {error && (
          <div className="mt-6 w-full max-w-lg border border-[#D8CFBC] rounded-lg bg-white overflow-hidden">
            <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${isNetworkError ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              {isNetworkError
                ? <Server size={13} className="text-amber-600 flex-shrink-0" strokeWidth={2} />
                : <AlertCircle size={13} className="text-red-500 flex-shrink-0" strokeWidth={2} />
              }
              <span className={`text-[11px] font-semibold ${isNetworkError ? 'text-amber-800' : 'text-red-700'}`}>
                {isNetworkError ? 'Backend not reachable' : 'Extraction Error'}
              </span>
            </div>
            <div className="px-4 py-3">
              <p className="text-[11px] text-[#565449] leading-relaxed">{error}</p>
              {isNetworkError && (
                <div className="mt-2.5 bg-[#FFFBF4] border border-[#D8CFBC] rounded p-3">
                  <p className="label-xs mb-2">Start the backend server:</p>
                  <code className="block text-[11px] font-mono text-[#11120D] leading-5">
                    # In your project root:<br />
                    .{'\\'}{'\\'}.venv\Scripts\Activate.ps1<br />
                    uvicorn backend.main:app --reload --port 8000
                  </code>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#D8CFBC] py-3 text-center">
        <p className="text-[10px] text-[#D8CFBC] tracking-wide">
          FinReport AI · Gemini 2.0 Flash · Playwright Chromium
        </p>
      </footer>
    </div>
  );
}

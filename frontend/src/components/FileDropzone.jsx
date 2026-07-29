import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

export default function FileDropzone({ onFileUploaded, isExtracting }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const validateAndProcessFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'csv', 'txt'].includes(ext)) {
      setError('Unsupported file type. Please upload a .pdf, .csv, or .txt file.');
      return;
    }
    setError('');
    onFileUploaded(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndProcessFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files?.[0]) validateAndProcessFile(e.target.files[0]);
  };

  return (
    <div className="w-full max-w-lg">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          border border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${isDragActive
            ? 'border-[#11120D] bg-white scale-[1.01]'
            : 'border-[#D8CFBC] bg-white hover:border-[#565449]'
          }
          ${isExtracting ? 'pointer-events-none' : ''}
        `}
        style={{ minHeight: 200 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          accept=".pdf,.csv,.txt"
          onChange={handleChange}
          disabled={isExtracting}
        />

        <div className="flex flex-col items-center text-center px-8 py-10">
          {isExtracting ? (
            <div className="flex flex-col items-center gap-4">
              {/* Spinner */}
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-[#D8CFBC]" />
                <div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#11120D] animate-spin-slow"
                />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#11120D] tracking-tight">
                  Analyzing…
                </p>
                <p className="text-[11px] text-[#565449] mt-1 leading-relaxed max-w-[260px]">
                  Extracting vectors, parsing formulas, and verifying YoY/QoQ variances
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-[#FFFBF4] border border-[#D8CFBC] flex items-center justify-center mb-4">
                <Upload className="w-4 h-4 text-[#565449]" strokeWidth={1.75} />
              </div>
              <p className="text-[13px] font-semibold text-[#11120D] mb-1">
                Drop your financial report here
              </p>
              <p className="text-[11px] text-[#565449] mb-5 leading-relaxed">
                or click to browse from your computer
              </p>
              {/* Badges */}
              <div className="flex items-center gap-2">
                {['PDF', 'CSV', 'TXT'].map((ext) => (
                  <span
                    key={ext}
                    className="flex items-center gap-1 px-2 py-0.5 bg-[#FFFBF4] border border-[#D8CFBC] rounded text-[10px] font-semibold text-[#565449] tracking-wider"
                  >
                    <FileText className="w-2.5 h-2.5" strokeWidth={2} />
                    {ext}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2.5 px-3 py-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
          {error}
        </div>
      )}
    </div>
  );
}

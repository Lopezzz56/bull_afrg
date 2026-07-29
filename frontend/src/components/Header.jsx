import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function Header({ isBackendActive }) {
  return (
    <header
      className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#D8CFBC]"
      style={{ minHeight: 52 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded bg-[#11120D] flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-[13px] font-bold text-[#11120D] leading-none tracking-tight">
            FinReport AI
          </h1>
          <p className="text-[9px] font-medium text-[#565449] tracking-widest uppercase mt-0.5">
            Extraction & Compiler
          </p>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#565449]">
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isBackendActive ? 'bg-[#00A896]' : 'bg-red-500'}`} />
        {isBackendActive ? 'Backend Active' : 'Backend Inactive'}
      </div>
    </header>
  );
}

import React from 'react';
import { AlertTriangle, Plus, Trash2, ChevronDown } from 'lucide-react';

// ─── Tiny helpers ──────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-6">
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#565449] border-b border-[#D8CFBC] pb-2 mb-3">{title}</div>
      {children}
    </div>
  );
}

function Grid2({ children }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>;
}

function Field({ label, children, span = 1 }) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="label-xs block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Flag({ path, validationFlags }) {
  const msg = validationFlags?.[path];
  if (!msg) return null;
  return (
    <div className="flag-chip mt-1">
      <AlertTriangle size={10} className="flex-shrink-0 mt-px" />
      <span>{msg}</span>
    </div>
  );
}

function TableWrapper({ children }) {
  return (
    <div className="overflow-x-auto border border-[#D8CFBC] rounded">
      <table className="data-table">{children}</table>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function EditorPanel({
  reportData,
  validationFlags,
  activeSubTab,
  setActiveSubTab,
  handleFieldChange,
  handleFieldFocus,
}) {
  if (!reportData) return null;

  const inp = (path, value, extraClass = '') => (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => handleFieldChange(path, e.target.value)}
      onFocus={() => handleFieldFocus(path)}
      className={`w-full bg-white border border-[#D8CFBC] rounded px-2.5 py-1.5 text-[12px] text-[#11120D] focus:outline-none focus:border-[#565449] transition-colors duration-150 ${extraClass}`}
    />
  );

  const tabs = [
    { id: 'header-info',       label: 'Header Info' },
    { id: 'financial-tables',  label: 'Financials' },
    { id: 'narrative-summary', label: 'Narrative' },
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-[#D8CFBC] rounded-lg overflow-hidden">

      {/* Tab bar */}
      <div className="flex gap-1.5 px-4 py-3 border-b border-[#D8CFBC] bg-[#FFFBF4] flex-shrink-0">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveSubTab(id)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded transition-all duration-150 border select-none cursor-pointer ${
              activeSubTab === id
                ? 'bg-[#11120D] text-white border-[#11120D]'
                : 'bg-transparent text-[#565449] border-[#D8CFBC] hover:border-[#565449] hover:text-[#11120D]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-0">

        {/* ── HEADER INFO ───────────────────────────── */}
        {activeSubTab === 'header-info' && (
          <>
            <Section title="Company Identification">
              <Grid2>
                <Field label="Company Name" span={2}>
                  {inp('header.company_name', reportData.header?.company_name, 'font-semibold')}
                </Field>
                <Field label="Sector">
                  {inp('header.sector', reportData.header?.sector)}
                </Field>
                <Field label="Report Date">
                  {inp('header.report_date', reportData.header?.report_date)}
                </Field>
                <Field label="Rating">
                  <div className="relative">
                    <select
                      value={reportData.header?.rating ?? 'HOLD'}
                      onChange={(e) => handleFieldChange('header.rating', e.target.value)}
                      onFocus={() => handleFieldFocus('header.rating')}
                      className="w-full bg-white border border-[#D8CFBC] rounded px-2.5 py-1.5 text-[12px] text-[#11120D] focus:outline-none focus:border-[#565449] transition-colors duration-150 pr-7 cursor-pointer appearance-none">
                      {['BUY', 'ACCUMULATE', 'HOLD', 'REDUCE', 'SELL'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#565449] pointer-events-none" strokeWidth={2} />
                  </div>
                </Field>
                <Field label="Stock Type">
                  {inp('header.stock_type', reportData.header?.stock_type)}
                </Field>
              </Grid2>
            </Section>

            <Section title="Price Targets">
              <Grid2>
                <Field label="CMP (Rs.)">
                  {inp('header.cmp', reportData.header?.cmp, 'font-semibold')}
                </Field>
                <Field label="Target Price (Rs.)">
                  {inp('header.target_price', reportData.header?.target_price)}
                </Field>
                <Field label="Upside / Return (%)">
                  {inp('header.return_pct', reportData.header?.return_pct)}
                </Field>
                <Field label="Time Frame">
                  {inp('header.time_frame', reportData.header?.time_frame)}
                </Field>
              </Grid2>
            </Section>

            <Section title="Exchange Codes">
              <Grid2>
                <Field label="NSE Code">
                  {inp('header.nse_code', reportData.header?.nse_code)}
                </Field>
                <Field label="BSE Code">
                  {inp('header.bse_code', reportData.header?.bse_code)}
                </Field>
                <Field label="Bloomberg Code">
                  {inp('header.bloomberg_code', reportData.header?.bloomberg_code)}
                </Field>
                <Field label="Sensex">
                  {inp('header.sensex', reportData.header?.sensex)}
                </Field>
              </Grid2>
            </Section>
          </>
        )}

        {/* ── FINANCIAL TABLES ──────────────────────── */}
        {activeSubTab === 'financial-tables' && (
          <>
            <Section title="Quarterly Financials (Rs. Cr)">
              <TableWrapper>
                <thead>
                  <tr>
                    <th className="text-left sticky left-0 bg-[#FFFBF4]">Metric</th>
                    {(reportData.quarterly_financials?.columns || []).map((col, ci) => (
                      <th key={ci} className="min-w-[80px]">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(reportData.quarterly_financials?.rows || []).map((row, ri) => (
                    <tr key={ri}>
                      <td className="sticky left-0 bg-white font-medium text-[#565449] whitespace-nowrap text-[11px]">
                        {row.label}
                      </td>
                      {(row.values || []).map((val, vi) => {
                        const path = `quarterly_financials.rows[${ri}].values[${vi}]`;
                        const flagged = !!validationFlags?.[path];
                        return (
                          <td key={vi} className="p-0 align-top min-w-[72px]">
                            <input
                              type="text"
                              value={val ?? ''}
                              onChange={(e) => handleFieldChange(path, e.target.value)}
                              onFocus={() => handleFieldFocus(path)}
                              className={`cell-input${flagged ? ' flagged' : ''}`}
                            />
                            {flagged && (
                              <div className="px-2 pb-1">
                                <Flag path={path} validationFlags={validationFlags} />
                              </div>
                            )}
                          </td>

                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </TableWrapper>
            </Section>

            <Section title="Y.E March Summary (Rs. Cr)">
              <TableWrapper>
                <thead>
                  <tr>
                    <th className="text-left sticky left-0 bg-[#FFFBF4]">Metric</th>
                    {(reportData.ye_march_summary?.years || []).map((yr, yi) => (
                      <th key={yi} className="min-w-[64px]">{yr}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(reportData.ye_march_summary?.rows || []).map((row, ri) => (
                    <tr key={ri}>
                      <td className="sticky left-0 bg-white font-medium text-[#565449] whitespace-nowrap text-[11px]">
                        {row.label}
                      </td>
                      {(row.values || []).map((val, vi) => {
                        const path = `ye_march_summary.rows[${ri}].values[${vi}]`;
                        return (
                          <td key={vi} className="p-0 min-w-[64px]">
                            <input
                              type="text"
                              value={val ?? ''}
                              onChange={(e) => handleFieldChange(path, e.target.value)}
                              onFocus={() => handleFieldFocus(path)}
                              className="w-full text-right text-[11px] px-2 py-1.5 outline-none border-0 bg-transparent hover:bg-[#FFFBF4] focus:bg-white focus:ring-inset focus:ring-1 focus:ring-[#565449] transition-colors duration-100"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </TableWrapper>
            </Section>
          </>
        )}

        {/* ── NARRATIVE ─────────────────────────────── */}
        {activeSubTab === 'narrative-summary' && (
          <>
            <Section title="Report Narrative">
              <div className="space-y-3">
                <Field label="Headline">
                  {inp('narrative_headline', reportData.narrative_headline, 'font-semibold')}
                </Field>
                <Field label="Company Description">
                  <textarea
                    rows={4}
                    value={reportData.company_description ?? ''}
                    onChange={(e) => handleFieldChange('company_description', e.target.value)}
                    onFocus={() => handleFieldFocus('company_description')}
                    className="w-full bg-white border border-[#D8CFBC] rounded px-2.5 py-1.5 text-[12px] text-[#11120D] focus:outline-none focus:border-[#565449] transition-colors duration-150 resize-none leading-relaxed"
                  />
                </Field>
                <Field label="Outlook & Valuation">
                  <textarea
                    rows={3}
                    value={reportData.outlook_valuation ?? ''}
                    onChange={(e) => handleFieldChange('outlook_valuation', e.target.value)}
                    onFocus={() => handleFieldFocus('outlook_valuation')}
                    className="w-full bg-white border border-[#D8CFBC] rounded px-2.5 py-1.5 text-[12px] text-[#11120D] focus:outline-none focus:border-[#565449] transition-colors duration-150 resize-none leading-relaxed"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Key Bullet Points">
              <div className="space-y-1.5">
                {(reportData.narrative_bullets || []).map((bullet, bi) => (
                  <div key={bi} className="flex items-center gap-2">
                    <span className="text-[#D8CFBC] text-base leading-none select-none">—</span>
                    <input
                      type="text"
                      value={bullet ?? ''}
                      onChange={(e) => {
                        const updated = [...(reportData.narrative_bullets || [])];
                        updated[bi] = e.target.value;
                        handleFieldChange('narrative_bullets', updated);
                      }}
                      onFocus={() => handleFieldFocus(`narrative_bullets[${bi}]`)}
                      className="w-full bg-white border border-[#D8CFBC] rounded px-2.5 py-1.5 text-[12px] text-[#11120D] focus:outline-none focus:border-[#565449] transition-colors duration-150 flex-1"
                    />
                    <button
                      onClick={() => {
                        const updated = (reportData.narrative_bullets || []).filter((_, i) => i !== bi);
                        handleFieldChange('narrative_bullets', updated);
                      }}
                      className="p-1 text-[#D8CFBC] hover:text-[#11120D] transition-colors"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const updated = [...(reportData.narrative_bullets || []), ''];
                    handleFieldChange('narrative_bullets', updated);
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-[#565449] hover:text-[#11120D] mt-2 transition-colors"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  Add bullet point
                </button>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function extractFinancialData(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  let res;
  try {
    res = await fetch(`${API_BASE}/api/extract`, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    throw new Error(`Cannot connect to the backend server at ${API_BASE}. Make sure the backend server is running.`);
  }
  
  if (!res.ok) {
    const errorDetails = await res.json().catch(() => ({ detail: 'Failed to extract financial data.' }));
    throw new Error(errorDetails.detail || 'Failed to extract financial data.');
  }
  
  return res.json();
}

export async function getPreviewHtml(reportData) {
  const res = await fetch(`${API_BASE}/api/preview-html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: reportData })
  });
  
  if (!res.ok) {
    const errorDetails = await res.json();
    throw new Error(errorDetails.detail || 'Failed to fetch live preview HTML.');
  }
  
  return res.text();
}

export async function getMockPdfFile() {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/mock-pdf`);
  } catch (err) {
    throw new Error(`Cannot connect to the backend server at ${API_BASE}. Make sure the backend server is running.`);
  }
  if (!res.ok) {
    throw new Error('Failed to load demo report PDF.');
  }
  return res.blob();
}

export async function downloadReportPdf(reportData) {
  const res = await fetch(`${API_BASE}/api/generate-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: reportData })
  });
  
  if (!res.ok) {
    const errorDetails = await res.json();
    throw new Error(errorDetails.detail || 'Failed to generate PDF document.');
  }
  
  return res.blob();
}

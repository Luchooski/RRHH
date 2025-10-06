type Range = { from?: string; to?: string };

const BASE = import.meta.env.VITE_API_URL || '';

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) {
    let msg = 'Request error';
    try { const j = await res.json(); msg = j?.error ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// Conversion
export async function getConversion(range: Range = {}) {
  const p = new URLSearchParams();
  if (range.from) p.set('from', range.from);
  if (range.to)   p.set('to', range.to);
  return http<{ sent: number; interview: number; hired: number; period: Range }>(`${BASE}/api/v1/reports/conversion?${p.toString()}`);
}

// Time to close
export async function getTimeToClose(range: Range = {}) {
  const p = new URLSearchParams();
  if (range.from) p.set('from', range.from);
  if (range.to)   p.set('to', range.to);
  return http<{ avgDays: number; count: number; period: Range }>(`${BASE}/api/v1/reports/ttc?${p.toString()}`);
}

// Export helpers
export function exportCSV(range: Range = {}) {
  const p = new URLSearchParams();
  if (range.from) p.set('from', range.from);
  if (range.to)   p.set('to', range.to);
  window.open(`${BASE}/api/v1/reports/export.csv?${p.toString()}`, '_blank');
}

export function exportPDF(range: Range = {}) {
  const p = new URLSearchParams();
  if (range.from) p.set('from', range.from);
  if (range.to)   p.set('to', range.to);
  window.open(`${BASE}/api/v1/reports/export.pdf?${p.toString()}`, '_blank');
}

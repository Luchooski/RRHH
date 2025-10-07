const BASE = import.meta.env.VITE_API_URL || '';

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type':'application/json' }, ...init });
  if (!res.ok) {
    let msg = 'Request error';
    try { const j = await res.json(); msg = (j as any)?.error ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export type ConversionReport = { sent: number; interview: number; hired: number };
export type TimeToCloseReport = { avgDays: number; series?: Array<{ week: string; avgDays: number }> };

export function getConversion(params?: { from?: string; to?: string }) {
  const qs = new URLSearchParams();
  if (params?.from) qs.set('from', params.from);
  if (params?.to)   qs.set('to', params.to);
  const url = `${BASE}/api/v1/reports/conversion${qs.toString() ? `?${qs}` : ''}`;
  return http<ConversionReport>(url);
}

export function getTimeToClose(params?: { from?: string; to?: string }) {
  const qs = new URLSearchParams();
  if (params?.from) qs.set('from', params.from);
  if (params?.to)   qs.set('to', params.to);
  const url = `${BASE}/api/v1/reports/time-to-close${qs.toString() ? `?${qs}` : ''}`;
  return http<TimeToCloseReport>(url);
}

/** URLs directas para exportar (descarga en nueva pestaña) */
export function exportUrls(params?: { from?: string; to?: string }) {
  const qs = new URLSearchParams();
  if (params?.from) qs.set('from', params.from);
  if (params?.to)   qs.set('to', params.to);
  const q = qs.toString() ? `?${qs}` : '';
  return {
    conversionCSV: `${BASE}/api/v1/reports/conversion.csv${q}`,
    conversionPDF: `${BASE}/api/v1/reports/conversion.pdf${q}`,
    ttcCSV:        `${BASE}/api/v1/reports/time-to-close.csv${q}`,
    ttcPDF:        `${BASE}/api/v1/reports/time-to-close.pdf${q}`,
  };
}

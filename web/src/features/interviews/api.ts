import type { InterviewDTO } from './calendar.schema';

const BASE = import.meta.env.VITE_API_URL || '';

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', headers: { 'Content-Type':'application/json' }, ...init });
  if (!res.ok) {
    let msg = 'Request error';
    try { const j = await res.json(); msg = j?.error ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function listInterviews(params: { from?: string; to?: string; candidateId?: string; vacancyId?: string; page?: number; limit?: number }): Promise<{ items: InterviewDTO[]; total: number; page: number; pageSize: number; }> {  const p = new URLSearchParams();
  if (params.from) p.set('from', params.from);
  if (params.to) p.set('to', params.to);
  if (params.candidateId) p.set('candidateId', params.candidateId);
  if (params.vacancyId) p.set('vacancyId', params.vacancyId);
  const limit = Math.min(params.limit ?? 200, 200); // el backend acepta como máximo 200
  p.set('limit', String(limit));
  if (params.page) p.set('page', String(params.page));
  return http(`${BASE}/api/v1/interviews?${p.toString()}`);
}

export async function createInterview(payload: { title: string; start: string; end: string; candidateId?: string; vacancyId?: string; location?: string; notes?: string; status?: InterviewDTO['status'] }): Promise<InterviewDTO> {
  return http(`${BASE}/api/v1/interviews`, { method:'POST', body: JSON.stringify(payload) });
}

export async function updateInterview(id: string, payload: Partial<Pick<InterviewDTO,'title'|'start'|'end'|'candidateId'|'vacancyId'|'location'|'notes'|'status'>>): Promise<InterviewDTO> {
  return http(`${BASE}/api/v1/interviews/${id}`, { method:'PATCH', body: JSON.stringify(payload) });
}

export async function deleteInterview(id: string): Promise<{ ok:true }> {
  return http(`${BASE}/api/v1/interviews/${id}`, { method:'DELETE' });
}
export async function getInterviews(): Promise<InterviewDTO[]> {
  const res = await listInterviews({});
   return Array.isArray((res as any)?.items) ? res.items : [];
 }
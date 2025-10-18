import type { CandidateInput, CandidateList, CandidateOut } from './schemas';

const BASE = import.meta.env.VITE_API_URL || '';

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type','application/json');

  const res = await fetch(url, { credentials: 'include', ...init, headers });
  if (!res.ok) {
    let msg = 'Request error';
    try { const j = await res.json(); msg = (j as any)?.error ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function listCandidates(params?: {
  q?: string; page?: number; limit?: number; seniority?: string;
  status?: string; role?: string; sort?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.seniority) qs.set('seniority', params.seniority);
  if (params?.status) qs.set('status', params.status);
  if (params?.role) qs.set('role', params.role);
  if (params?.sort) qs.set('sort', params.sort);
  return http<CandidateList>(`${BASE}/api/v1/candidates${qs.toString() ? `?${qs}` : ''}`);
}

export async function getCandidate(id: string) {
  return http<CandidateOut>(`${BASE}/api/v1/candidates/${id}`);
}

export async function createCandidate(data: CandidateInput) {
  return http<CandidateOut>(`${BASE}/api/v1/candidates`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCandidate(id: string, data: CandidateInput) {
  return http<CandidateOut>(`${BASE}/api/v1/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteCandidate(id: string) {
  return http<{ ok: true }>(`${BASE}/api/v1/candidates/${id}`, { method: 'DELETE' });
}

// Enviar candidato a vacante (crea Application)
export async function sendToVacancy(candidateId: string, vacancyId: string, status: 'sent'|'interview'|'feedback'|'offer'|'hired'|'rejected' = 'sent') {
  return http<{ ok: true }>(`${BASE}/api/v1/applications`, {
    method: 'POST',
    body: JSON.stringify({ candidateId, vacancyId, status }),
  });
}

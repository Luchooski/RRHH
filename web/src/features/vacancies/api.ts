import type { Paginated, VacancyDTO, VacancyListQuery, ApplicationDTO } from './vacancy.schema';

const BASE = import.meta.env.VITE_API_URL || '';

export type ChecklistItem = { id: string; label: string; done: boolean; updatedAt: string };
export type ChecklistList = { items: ChecklistItem[] };

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', headers: { 'Content-Type':'application/json' }, ...init });
  if (!res.ok) {
    let msg = 'Request error';
    try { const j = await res.json(); msg = j?.error ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/* Vacancies */
export async function listVacancies(qs: VacancyListQuery = {}): Promise<Paginated<VacancyDTO>> {
  const p = new URLSearchParams();
  if (qs.q) p.set('q', qs.q);
  if (qs.companyId) p.set('companyId', qs.companyId);
  if (qs.status) p.set('status', qs.status);
  p.set('page', String(qs.page ?? 1));
  p.set('limit', String(qs.limit ?? 20));
  return http(`${BASE}/api/v1/vacancies?${p.toString()}`);
}
export async function getVacancy(id: string): Promise<VacancyDTO> {
  return http(`${BASE}/api/v1/vacancies/${id}`);
}
export async function createVacancy(payload: Partial<VacancyDTO>): Promise<VacancyDTO> {
  return http(`${BASE}/api/v1/vacancies`, { method:'POST', body: JSON.stringify(payload) });
}
export async function updateVacancy(id: string, payload: Partial<VacancyDTO>): Promise<VacancyDTO> {
  return http(`${BASE}/api/v1/vacancies/${id}`, { method:'PATCH', body: JSON.stringify(payload) });
}
export async function deleteVacancy(id: string): Promise<{ ok:true }> {
  return http(`${BASE}/api/v1/vacancies/${id}`, { method:'DELETE' });
}

/* Applications (candidato ↔ vacante) */
export async function listApplications(vacancyId: string): Promise<ApplicationDTO[]> {
  return http(`${BASE}/api/v1/applications?vacancyId=${encodeURIComponent(vacancyId)}`);
}
export async function createApplication(payload: { candidateId: string; vacancyId: string; notes?: string|null }): Promise<ApplicationDTO> {
  return http(`${BASE}/api/v1/applications`, { method:'POST', body: JSON.stringify(payload) });
}
export async function updateApplication(id: string, payload: Partial<Pick<ApplicationDTO,'status'|'notes'>>): Promise<{ ok:true }> {
  return http(`${BASE}/api/v1/applications/${id}`, { method:'PATCH', body: JSON.stringify(payload) });
}
export async function deleteApplication(id: string): Promise<{ ok:true }> {
  return http(`${BASE}/api/v1/applications/${id}`, { method:'DELETE' });
}

/* Checklist por vacante */
export async function getChecklist(vacancyId: string): Promise<ChecklistList> {
  return http(`${BASE}/api/v1/vacancies/${vacancyId}/checklist`);
}

export async function addChecklistItem(vacancyId: string, label: string): Promise<ChecklistList> {
  return http(`${BASE}/api/v1/vacancies/${vacancyId}/checklist`, {
    method: 'POST',
    body: JSON.stringify({ label })
  });
}

export async function updateChecklistItem(vacancyId: string, itemId: string, patch: { label?: string; done?: boolean }): Promise<ChecklistList> {
  return http(`${BASE}/api/v1/vacancies/${vacancyId}/checklist/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}

export async function removeChecklistItem(vacancyId: string, itemId: string): Promise<ChecklistList> {
  return http(`${BASE}/api/v1/vacancies/${vacancyId}/checklist/${itemId}`, {
    method: 'DELETE'
  });
}
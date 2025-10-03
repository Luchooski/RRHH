import type { z } from 'zod';
import type { Candidate, CandidateCreateInput, CandidateUpdateInput } from './dto';
import {
  CandidateOutput,
  CandidateCreateSchema,
  CandidateUpdateSchema,
  CandidateQuerySchema,
} from './dto';
import { http } from '@/lib/http';

const base = `/api/v1/candidates`;

export type CandidateListOut = { items: Candidate[]; total: number };

export async function apiListCandidates(params: Partial<z.infer<typeof CandidateQuerySchema>> = {}) {
  const query = CandidateQuerySchema.parse({
    limit: params.limit ?? 20,
    skip: params.skip ?? 0,
    q: params.q,
    status: params.status,
    role: params.role,
    matchMin: params.matchMin,
    matchMax: params.matchMax,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    sortField: params.sortField,
    sortDir: params.sortDir,
  });

  const qs = new URLSearchParams();
  if (query.q) qs.set('q', query.q);
  if (query.status) qs.set('status', query.status);
  if (query.role) qs.set('role', query.role);
  if (typeof query.matchMin === 'number') qs.set('matchMin', String(query.matchMin));
  if (typeof query.matchMax === 'number') qs.set('matchMax', String(query.matchMax));
  if (query.createdFrom) qs.set('createdFrom', query.createdFrom);
  if (query.createdTo) qs.set('createdTo', query.createdTo);
  if (query.sortField) qs.set('sortField', query.sortField);
  if (query.sortDir) qs.set('sortDir', query.sortDir);
  qs.set('limit', String(query.limit));
  qs.set('skip', String(query.skip));

  // ⬇️ devuelve { items, total } directamente (sin .data)
  return http.get<CandidateListOut>(`${base}?${qs.toString()}`, { auth: true });
}

export async function apiCreateCandidate(input: CandidateCreateInput) {
  const safe = CandidateCreateSchema.parse(input);
  // ⬇️ devuelve Candidate directamente
  return http.post<Candidate>(base, safe, { auth: true });
}

export async function apiGetCandidate(id: string) {
  const data = await http.get<Candidate | null>(`${base}/${id}`, { auth: true });
  return data ? CandidateOutput.parse(data) : null;
}

export async function apiUpdateCandidate(id: string, input: CandidateUpdateInput) {
  const safe = CandidateUpdateSchema.parse(input); // ⬅️ usar Update schema, no Create
  const data = await http.patch<Candidate | null>(`${base}/${id}`, safe, { auth: true });
  return data ? CandidateOutput.parse(data) : null;
}

export async function apiDeleteCandidate(id: string) {
  return http.delete<{ success: boolean }>(`${base}/${id}`, { auth: true });
}


import type { Candidate, CandidateCreateInput, CandidateUpdateInput } from './dto';
import { CandidateOutput, CandidateCreateSchema, CandidateQuerySchema } from './dto';
import { http } from '../../lib/http';
import { z } from 'zod';

const base = `${import.meta.env.VITE_API_URL}/api/v1/candidates`;

export async function apiListCandidates(params: Partial<z.infer<typeof CandidateQuerySchema>> = {}) {
  const query = CandidateQuerySchema.parse({
    limit: params.limit ?? 20,
    skip: params.skip ?? 0,
    q: params.q,
    status: params.status,
  });
  const qs = new URLSearchParams();
  if (query.q) qs.set('q', query.q);
  if (query.status) qs.set('status', query.status);
  qs.set('limit', String(query.limit));
  qs.set('skip', String(query.skip));

  return http.get<Candidate[]>(`${base}?${qs.toString()}`, { auth: true })
}

export async function apiCreateCandidate(input: CandidateCreateInput) {
  const safe = CandidateCreateSchema.parse(input);
  return http.post<Candidate>(base, safe, { auth: true });
}

export async function apiGetCandidate(id: string) {
  const data = await http.get<Candidate | null>(`${base}/${id}`, { auth: true });
  return data ? CandidateOutput.parse(data) : null;
}

export async function apiUpdateCandidate(id: string, input: CandidateUpdateInput) {
  const safe = CandidateCreateSchema.parse(input);
  const data = await http.patch<Candidate | null>(`${base}/${id}`, safe, { auth: true });
  return data ? CandidateOutput.parse(data) : null;
}

export async function apiDeleteCandidate(id: string) {
  const out = await http.delete<{ success: boolean }>(`${base}/${id}`, { auth: true });
  return z.object({ success: z.boolean() }).parse(out).success;
}

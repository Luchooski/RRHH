import { http } from '@/lib/http';
import type {
  Candidate,
  CandidateCreateInput,
  CandidateUpdateInput,
  CandidateQuery,
  CandidateListOutput,
} from './dto';

function toQS(p?: Partial<CandidateQuery>) {
  if (!p) return '';
  const qs = new URLSearchParams();
  if (p.sortField) qs.set('sortField', p.sortField);
  if (p.sortDir)   qs.set('sortDir', p.sortDir);
  if (p.limit != null) qs.set('limit', String(p.limit));
  if (p.skip  != null) qs.set('skip',  String(p.skip));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function apiListCandidates(params?: Partial<CandidateQuery>) {
  return http.get<CandidateListOutput>(`/api/v1/candidates${toQS(params)}`, { auth: true });
}

export async function apiGetCandidate(id: string) {
  return http.get<Candidate>(`/api/v1/candidates/${encodeURIComponent(id)}`, { auth: true });
}

export async function apiCreateCandidate(input: CandidateCreateInput) {
  return http.post<Candidate>('/api/v1/candidates', input, { auth: true });
}

export async function apiUpdateCandidate(id: string, input: CandidateUpdateInput) {
  return http.patch<Candidate>(`/api/v1/candidates/${encodeURIComponent(id)}`, input, { auth: true });
}

export async function apiDeleteCandidate(id: string) {
  return http.delete<{ ok: boolean }>(`/api/v1/candidates/${encodeURIComponent(id)}`, { auth: true });
}

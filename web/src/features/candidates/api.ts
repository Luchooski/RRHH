import { api } from '../../lib/fetcher';
import { CandidatesSchema, CandidateSchema } from './schema';
import type { Candidate , CandidateInput } from './schema';

export async function getCandidates(): Promise<Candidate[]> {
  const data = await api<unknown>('/api/v1/candidates');
  return CandidatesSchema.parse(data);
}
export async function createCandidate(input: CandidateInput): Promise<Candidate> {
  const data = await api<unknown>('/api/v1/candidates', { method: 'POST', body: JSON.stringify(input) });
  return CandidateSchema.parse(data);
}
export async function updateCandidate(id: string, input: CandidateInput): Promise<Candidate | null> {
  const data = await api<unknown>(`/api/v1/candidates/${id}`, { method: 'PUT', body: JSON.stringify(input) });
  return data ? CandidateSchema.parse(data) : null;
}
export async function deleteCandidate(id: string): Promise<{ success: boolean }> {
  return api(`/api/v1/candidates/${id}`, { method: 'DELETE' });
}

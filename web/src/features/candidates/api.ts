// web/src/features/candidates/api.ts
import api from '../../lib/fetcher';
import type { Candidate, CandidateInput } from './schema';

const BASE = '/api/v1/candidates';

/**
 * GET /api/v1/candidates
 * Devuelve un array de Candidate
 */
export async function getCandidates(): Promise<Candidate[]> {
  return api.get<Candidate[]>(BASE);
}

/**
 * POST /api/v1/candidates
 * Crea un candidato (sin id/createdAt/updatedAt)
 */
export async function createCandidate(payload: CandidateInput): Promise<Candidate> {
  return api.post<Candidate>(BASE, payload);
}

/**
 * PATCH /api/v1/candidates/:id
 * Actualiza parcialmente un candidato
 */
export async function updateCandidate(
  id: string,
  patch: Partial<CandidateInput>
): Promise<Candidate> {
  return api.patch<Candidate>(`${BASE}/${id}`, patch);
}

/**
 * DELETE /api/v1/candidates/:id
 */
export async function deleteCandidate(id: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`${BASE}/${id}`);
}

export type { Candidate, CandidateInput };
export default { getCandidates, createCandidate, updateCandidate, deleteCandidate };

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CandidateOut, CandidateInput, CandidateList, CandidateList as CandidateListType } from './schemas';
import {
  listCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getCandidate,
} from './api';

// Clave estable para cachear por parámetros del listado
const key = (params?: Partial<{ q?: string; page?: number; limit?: number; seniority?: string }>) =>
  ['candidates', params ?? {}];

export function useListCandidates(params: Partial<{ q?: string; page?: number; limit?: number; seniority?: string }>) {
  return useQuery<CandidateOut[]>({
    queryKey: key(params),
    // devolvemos ARRAY (items) para que .length etc. funcionen directo
    queryFn: async () => {
      const out = await listCandidates(params);
      return out.items; // CandidateOut[]
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    // Si en algún lugar necesitás total/paginación, podés crear otro hook que devuelva el objeto completo
  });
}

// Variante que devuelve el objeto de lista completo (por si necesitás total/page/limit en un solo hook)
export function useListCandidatesWithMeta(params: Partial<{ q?: string; page?: number; limit?: number; seniority?: string }>) {
  return useQuery<CandidateList>({
    queryKey: ['candidates-meta', params ?? {}],
    queryFn: () => listCandidates(params),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useGetCandidate(id?: string) {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: () => (id ? getCandidate(id) : null),
    enabled: !!id,
  });
}

export function useCreateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CandidateInput) => createCandidate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      qc.invalidateQueries({ queryKey: ['candidates-meta'] });
    },
  });
}

export function useUpdateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CandidateInput }) => updateCandidate(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      qc.invalidateQueries({ queryKey: ['candidates-meta'] });
      qc.invalidateQueries({ queryKey: ['candidate'] });
    },
  });
}

export function useDeleteCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCandidate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      qc.invalidateQueries({ queryKey: ['candidates-meta'] });
    },
  });
}

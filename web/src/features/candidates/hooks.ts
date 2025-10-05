import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Candidate, CandidateCreateInput, CandidateUpdateInput, CandidateQuery } from './dto';
import {
  apiListCandidates,
  apiCreateCandidate,
  apiUpdateCandidate,
  apiDeleteCandidate,
  apiGetCandidate,
} from './api';

const key = (params?: Partial<CandidateQuery>) => ['candidates', params ?? {}];

export function useListCandidates(params: Partial<CandidateQuery>) {
  return useQuery<Candidate[]>({
    queryKey: key(params),
    // 👇 devolvemos ARRAY (items) para que .length exista sin errores
    queryFn: async () => {
      const out = await apiListCandidates(params);
      return out.items;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useGetCandidate(id?: string) {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: () => (id ? apiGetCandidate(id) : null),
    enabled: !!id,
  });
}

export function useCreateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CandidateCreateInput) => apiCreateCandidate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
}

export function useUpdateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CandidateUpdateInput }) =>
      apiUpdateCandidate(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      qc.invalidateQueries({ queryKey: ['candidate'] });
    },
  });
}

export function useDeleteCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteCandidate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
}

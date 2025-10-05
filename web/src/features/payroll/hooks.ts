import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiListPayrolls, apiApprovePayroll, apiDeletePayroll } from './api';
import type { PayrollListOut } from './dto';

export function usePayrolls(params: { period: string; status?: 'Borrador'|'Aprobado'; limit?: number; skip?: number }) {
  return useQuery<PayrollListOut>({
    queryKey: ['payrolls', params],
    queryFn: () => apiListPayrolls(params),
    staleTime: 60_000,
  });
}

export function useApprovePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiApprovePayroll(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] }),
  });
}

export function useDeletePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeletePayroll(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] }),
  });
}

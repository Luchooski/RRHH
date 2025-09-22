// web/src/features/payroll/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiHealth,
   listPayrolls,
    createPayroll,
     approvePayroll,
      deletePayroll,
      updatePayroll,
      bulkCreate,
  type PayrollInputDTO
} from './api';

export function useApiOnline() {
  return useQuery({ queryKey: ['api-health'], queryFn: apiHealth, staleTime: 60_000 });
}

export function usePayrolls(period?: string) {
  return useQuery({
    queryKey: ['payrolls', { period }],
    queryFn: () => listPayrolls({ period, limit: 50, skip: 0 }),
    enabled: !!period
  });
}

export function useCreatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PayrollInputDTO) => createPayroll(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] })
  });
}

export function useApprovePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approvePayroll(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] })
  });
}

export function useDeletePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePayroll(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] })
  });
}

export function useUpdatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<PayrollInputDTO> }) => updatePayroll(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] })
  });
}

export function useBulkCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkCreate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] })
  });
}
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Employee, EmployeeCreateInput } from './dto';
import { apiListEmployees, apiCreateEmployee, apiDeleteEmployee } from './api';

export function useEmployees(params?: { limit?: number; skip?: number }) {
  return useQuery({
    queryKey: ['employees', params ?? {}],
    queryFn: () => apiListEmployees(params),
    staleTime: 60_000,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeeCreateInput) => apiCreateEmployee(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteEmployee(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); },
  });
}

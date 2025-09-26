import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEmployee, fetchEmployees } from './api';

export function useEmployees() {
  return useQuery({ queryKey: ['employees'], queryFn: fetchEmployees });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] })
  });
}

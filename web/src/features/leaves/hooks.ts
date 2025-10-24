import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LeaveCreateInput, LeaveUpdateInput, LeaveApproveInput } from './dto';
import {
  apiListLeaves,
  apiGetLeave,
  apiCreateLeave,
  apiUpdateLeave,
  apiApproveLeave,
  apiCancelLeave,
  apiDeleteLeave,
  apiGetLeaveBalance,
} from './api';

export function useLeaves(params?: {
  employeeId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  limit?: number;
  skip?: number;
}) {
  return useQuery({
    queryKey: ['leaves', params ?? {}],
    queryFn: () => apiListLeaves(params),
    staleTime: 30_000,
  });
}

export function useLeave(id: string | undefined) {
  return useQuery({
    queryKey: ['leaves', id],
    queryFn: () => apiGetLeave(id!),
    enabled: !!id,
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveCreateInput) => apiCreateLeave(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
    },
  });
}

export function useUpdateLeave(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveUpdateInput) => apiUpdateLeave(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['leaves', id] });
    },
  });
}

export function useApproveLeave(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveApproveInput) => apiApproveLeave(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['leaves', id] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
    },
  });
}

export function useCancelLeave(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiCancelLeave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['leaves', id] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
    },
  });
}

export function useDeleteLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteLeave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

export function useLeaveBalance(employeeId: string | undefined, year?: number) {
  return useQuery({
    queryKey: ['leave-balance', employeeId, year],
    queryFn: () => apiGetLeaveBalance(employeeId!, year),
    enabled: !!employeeId,
    staleTime: 60_000,
  });
}

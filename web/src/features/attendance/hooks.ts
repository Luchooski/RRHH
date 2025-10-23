import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CheckInInput, CheckOutInput, BreakInput, MarkAbsenceInput, UpdateAttendanceInput } from './dto';
import {
  apiCheckIn,
  apiCheckOut,
  apiRegisterBreak,
  apiGetTodayAttendance,
  apiListAttendances,
  apiGetAttendanceSummary,
  apiMarkAbsence,
  apiUpdateAttendance,
  apiDeleteAttendance,
} from './api';

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckInInput) => apiCheckIn(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckOutInput) => apiCheckOut(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useRegisterBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BreakInput) => apiRegisterBreak(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useTodayAttendance() {
  return useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => apiGetTodayAttendance(),
    staleTime: 10_000,
    refetchInterval: 60_000, // Refresh every minute
  });
}

export function useAttendances(params?: {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}) {
  return useQuery({
    queryKey: ['attendance', 'list', params ?? {}],
    queryFn: () => apiListAttendances(params),
    staleTime: 30_000,
  });
}

export function useAttendanceSummary(params: {
  employeeId: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: ['attendance', 'summary', params],
    queryFn: () => apiGetAttendanceSummary(params),
    enabled: !!params.employeeId && !!params.startDate && !!params.endDate,
    staleTime: 60_000,
  });
}

export function useMarkAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MarkAbsenceInput) => apiMarkAbsence(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useUpdateAttendance(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAttendanceInput) => apiUpdateAttendance(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteAttendance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

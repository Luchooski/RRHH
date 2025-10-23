import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type {
  BenefitType,
  BenefitStatus,
  EmployeeBenefitStatus,
  CreateBenefitInput,
  UpdateBenefitInput,
  AssignBenefitInput,
} from './dto';

// Query keys
export const benefitsKeys = {
  all: ['benefits'] as const,
  lists: () => [...benefitsKeys.all, 'list'] as const,
  list: (filters?: { type?: BenefitType; status?: BenefitStatus }) =>
    [...benefitsKeys.lists(), filters] as const,
  detail: (id: string) => [...benefitsKeys.all, 'detail', id] as const,
  employeeBenefits: () => ['employee-benefits'] as const,
  employeeBenefitsList: (filters?: { employeeId?: string; status?: EmployeeBenefitStatus }) =>
    [...benefitsKeys.employeeBenefits(), 'list', filters] as const,
  costSummary: (filters?: { employeeId?: string; benefitType?: BenefitType }) =>
    [...benefitsKeys.employeeBenefits(), 'cost-summary', filters] as const,
};

// Benefit Catalog Hooks

export function useBenefits(filters?: { type?: BenefitType; status?: BenefitStatus }) {
  return useQuery({
    queryKey: benefitsKeys.list(filters),
    queryFn: () => api.apiListBenefits(filters),
    staleTime: 30_000,
  });
}

export function useBenefit(id: string) {
  return useQuery({
    queryKey: benefitsKeys.detail(id),
    queryFn: () => api.apiGetBenefit(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useCreateBenefit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBenefitInput) => api.apiCreateBenefit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitsKeys.lists() });
    },
  });
}

export function useUpdateBenefit(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBenefitInput) => api.apiUpdateBenefit(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: benefitsKeys.detail(id) });
    },
  });
}

export function useDeleteBenefit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.apiDeleteBenefit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitsKeys.lists() });
    },
  });
}

// Employee Benefit Assignment Hooks

export function useAssignBenefit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignBenefitInput) => api.apiAssignBenefit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitsKeys.employeeBenefits() });
    },
  });
}

export function useEmployeeBenefits(filters?: {
  employeeId?: string;
  status?: EmployeeBenefitStatus;
}) {
  return useQuery({
    queryKey: benefitsKeys.employeeBenefitsList(filters),
    queryFn: () => api.apiListEmployeeBenefits(filters),
    staleTime: 30_000,
  });
}

export function useApproveBenefit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      approved,
      rejectionReason,
    }: {
      id: string;
      approved: boolean;
      rejectionReason?: string;
    }) => api.apiApproveBenefit(id, approved, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitsKeys.employeeBenefits() });
    },
  });
}

export function useCancelBenefit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.apiCancelBenefit(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitsKeys.employeeBenefits() });
    },
  });
}

export function useBenefitsCostSummary(filters?: {
  employeeId?: string;
  benefitType?: BenefitType;
}) {
  return useQuery({
    queryKey: benefitsKeys.costSummary(filters),
    queryFn: () => api.apiGetBenefitsCostSummary(filters),
    staleTime: 60_000,
  });
}

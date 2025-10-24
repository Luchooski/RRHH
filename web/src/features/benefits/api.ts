import { http } from '@/lib/http';
import type {
  Benefit,
  EmployeeBenefit,
  BenefitsCostSummary,
  CreateBenefitInput,
  UpdateBenefitInput,
  AssignBenefitInput,
  BenefitType,
  BenefitStatus,
  EmployeeBenefitStatus,
} from './dto';

// Benefit Catalog APIs

export async function apiCreateBenefit(input: CreateBenefitInput) {
  return http.post<Benefit>('/api/v1/benefits', input, { auth: true });
}

export async function apiListBenefits(filters?: { type?: BenefitType; status?: BenefitStatus }) {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.status) params.append('status', filters.status);

  const query = params.toString();
  return http.get<Benefit[]>(`/api/v1/benefits${query ? `?${query}` : ''}`, { auth: true });
}

export async function apiGetBenefit(id: string) {
  return http.get<Benefit>(`/api/v1/benefits/${id}`, { auth: true });
}

export async function apiUpdateBenefit(id: string, input: UpdateBenefitInput) {
  return http.put<Benefit>(`/api/v1/benefits/${id}`, input, { auth: true });
}

export async function apiDeleteBenefit(id: string) {
  return http.delete<{ success: boolean }>(`/api/v1/benefits/${id}`, { auth: true });
}

// Employee Benefit Assignment APIs

export async function apiAssignBenefit(input: AssignBenefitInput) {
  return http.post<EmployeeBenefit>('/api/v1/employee-benefits', input, { auth: true });
}

export async function apiListEmployeeBenefits(filters?: {
  employeeId?: string;
  status?: EmployeeBenefitStatus;
}) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.status) params.append('status', filters.status);

  const query = params.toString();
  return http.get<EmployeeBenefit[]>(
    `/api/v1/employee-benefits${query ? `?${query}` : ''}`,
    { auth: true }
  );
}

export async function apiApproveBenefit(id: string, approved: boolean, rejectionReason?: string) {
  return http.post<EmployeeBenefit>(
    `/api/v1/employee-benefits/${id}/approve`,
    { approved, rejectionReason },
    { auth: true }
  );
}

export async function apiCancelBenefit(id: string, reason?: string) {
  return http.post<EmployeeBenefit>(
    `/api/v1/employee-benefits/${id}/cancel`,
    { reason },
    { auth: true }
  );
}

export async function apiGetBenefitsCostSummary(filters?: {
  employeeId?: string;
  benefitType?: BenefitType;
}) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.benefitType) params.append('benefitType', filters.benefitType);

  const query = params.toString();
  return http.get<BenefitsCostSummary>(
    `/api/v1/employee-benefits/cost-summary${query ? `?${query}` : ''}`,
    { auth: true }
  );
}

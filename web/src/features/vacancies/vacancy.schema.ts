import { z } from 'zod';

export const SeniorityEnum = z.enum(['jr','ssr','sr']);
export const EmploymentEnum = z.enum(['fulltime','parttime','contract']);
export const VacancyStatusEnum = z.enum(['open','paused','closed']);

export const AppStatusEnum = z.enum(['applied','interview','finalist','hired','rejected']);

export const VacancyCreateSchema = z.object({
  title: z.string().min(2, 'Mínimo 2 caracteres'),
  companyId: z.string().min(1, 'Requerido'),
  location: z.string().min(2, 'Mínimo 2 caracteres'),
  seniority: SeniorityEnum,
  employmentType: EmploymentEnum,
  status: VacancyStatusEnum.default('open'),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  description: z.string().max(4000).optional(),
});

export const VacancyUpdateSchema = VacancyCreateSchema.partial();

export type VacancyDTO = {
  id: string;
  title: string;
  companyId: string;
  companyName?: string;
  location: string;
  seniority: 'jr'|'ssr'|'sr';
  employmentType: 'fulltime'|'parttime'|'contract';
  status: 'open'|'paused'|'closed';
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationDTO = {
  id: string;
  candidateId: string;
  candidateName?: string;
  vacancyId: string;
  status: 'applied'|'interview'|'finalist'|'hired'|'rejected';
  notes?: string|null;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistItem = { label: string; done: boolean; updatedAt?: string };

export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number; };

export type VacancyListQuery = {
  q?: string;
  companyId?: string;
  status?: 'open'|'paused'|'closed';
  page?: number;
  limit?: number;
};

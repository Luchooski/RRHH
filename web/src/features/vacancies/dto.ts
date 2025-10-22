import { z } from 'zod';

export const VacancyCreateInput = z.object({
  title: z.string().min(2),
  companyId: z.string().min(1),
  location: z.string().min(2),
  seniority: z.enum(['jr','ssr','sr']).default('jr'),
  employmentType: z.enum(['fulltime','parttime','contract']).default('fulltime'),
  status: z.enum(['open','paused','closed']).default('open'),
  salaryMin: z.number().int().nonnegative().optional().nullable(),
  salaryMax: z.number().int().nonnegative().optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
});
// eslint-disable-next-line no-redeclare
export type VacancyCreateInput = z.infer<typeof VacancyCreateInput>;

export const Vacancy = VacancyCreateInput.extend({
  id: z.string(),
  companyName: z.string().optional(), // DTO enriquecido
  createdAt: z.string(),
  updatedAt: z.string(),
});
// eslint-disable-next-line no-redeclare
export type Vacancy = z.infer<typeof Vacancy>;

export const ApplicationCreateInput = z.object({
  candidateId: z.string().min(1),
  vacancyId: z.string().min(1),
  status: z.enum(['sent','interview','feedback','offer','hired','rejected']).default('sent'),
  notes: z.string().max(2000).optional().nullable(),
});
// eslint-disable-next-line no-redeclare
export type ApplicationCreateInput = z.infer<typeof ApplicationCreateInput>;

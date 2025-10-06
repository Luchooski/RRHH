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
export type VacancyCreateInput = z.infer<typeof VacancyCreateInput>;

export const VacancyDTO = VacancyCreateInput.extend({
  id: z.string(),
  companyName: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type VacancyDTO = z.infer<typeof VacancyDTO>;

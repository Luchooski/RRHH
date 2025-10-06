import { z } from 'zod';
import { paginatedOf } from '../_shared/dto.js';

export const InterviewStatusEnum = z.enum(['Programada','Completada','Cancelada','Pendiente']);

export const InterviewCreateInput = z.object({
  title: z.string().min(2),
  start: z.string().refine((s)=>!Number.isNaN(Date.parse(s)), 'start inválido'),
  end: z.string().refine((s)=>!Number.isNaN(Date.parse(s)), 'end inválido'),
  candidateId: z.string().optional(),
  vacancyId: z.string().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: InterviewStatusEnum.default('Programada'),
});

export const InterviewUpdateInput = InterviewCreateInput.partial();

export const InterviewQuery = z.object({
  from: z.string().optional(), // ISO
  to: z.string().optional(),   // ISO
  candidateId: z.string().optional(),
  vacancyId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(200),
});

export const InterviewOutput = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  candidateId: z.string().optional(),
  vacancyId: z.string().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: InterviewStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const InterviewListOutput = paginatedOf(InterviewOutput);

export type TInterviewCreateInput = z.infer<typeof InterviewCreateInput>;
export type TInterviewUpdateInput = z.infer<typeof InterviewUpdateInput>;

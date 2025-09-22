import { z } from 'zod';

export const InterviewStatus = z.enum(['Programada','Completada','Cancelada','Pendiente']);

export const Interview = z.object({
  id: z.string(),
  name: z.string(),
  datetime: z.string(), // ISO
  status: InterviewStatus,
  notes: z.array(z.string()).optional(),
  updatedAt: z.string().optional(),
});

export const InterviewInput = z.object({
  name: z.string().min(1),
  datetime: z.string(), // ISO
  status: InterviewStatus.default('Programada'),
});

export type IStatus = z.infer<typeof InterviewStatus>;
export type InterviewT = z.infer<typeof Interview>;
export type InterviewInputT = z.infer<typeof InterviewInput>;

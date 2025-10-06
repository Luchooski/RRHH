import { z } from 'zod';

export const InterviewStatusEnum = z.enum(['Programada','Completada','Cancelada','Pendiente']);

export const InterviewCreateSchema = z.object({
  title: z.string().min(2,'Mínimo 2'),
  date: z.string(),          // YYYY-MM-DD
  startTime: z.string(),     // HH:mm
  durationMin: z.number().int().positive().default(60),
  candidateId: z.string().optional(),
  vacancyId: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  status: InterviewStatusEnum.default('Programada'),
});

export const InterviewUpdateSchema = InterviewCreateSchema.partial();

export type InterviewDTO = {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  candidateId?: string;
  vacancyId?: string;
  location?: string | null;
  notes?: string | null;
  status: 'Programada'|'Completada'|'Cancelada'|'Pendiente';
  createdAt: string;
  updatedAt: string;
};

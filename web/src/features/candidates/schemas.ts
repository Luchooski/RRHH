import { z } from 'zod';

export const statuses = ['applied','screening','interview','offer','hired','rejected'] as const;
export type Status = typeof statuses[number];

export const CandidateFormSchema = z.object({
  fullName: z.string().min(2, 'Nombre muy corto'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(6).optional().or(z.literal('')).transform(v => v || undefined),
  skills: z.string().optional(), // coma-separadas
  status: z.enum(statuses).default('applied'),
  notes: z.string().max(2000).optional().or(z.literal('')).transform(v => v || undefined),
});
export type CandidateFormValues = z.infer<typeof CandidateFormSchema>;

export type Candidate = {
  id: string; fullName: string; email: string; phone: string | null;
  skills: string[]; status: Status; source: 'cv'|'form'|'import'|'manual';
  createdAt: string; updatedAt: string;
};

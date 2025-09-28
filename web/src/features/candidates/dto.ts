import { z } from 'zod';

export const CandidateOutput = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  match: z.number().int(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Candidate = z.infer<typeof CandidateOutput>;

export const CandidateListOutput = z.array(CandidateOutput);

export const CandidateCreateSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto'),
  email: z.string().email('Email inválido'),
  role: z.string().min(2, 'Rol muy corto'),
  match: z.number().int().min(0).max(100).optional(),
  status: z.string().optional(),
});
export type CandidateCreateInput = z.infer<typeof CandidateCreateSchema>;

export const CandidateUpdateSchema = CandidateCreateSchema.partial();
export type CandidateUpdateInput = z.infer<typeof CandidateUpdateSchema>;

export const CandidateQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  skip: z.number().int().min(0).default(0),
});
export type CandidateQuery = z.infer<typeof CandidateQuerySchema>;

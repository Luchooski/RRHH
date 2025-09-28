import { z } from 'zod';

export const CandidateInputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(2),
  match: z.number().int().min(0).max(100).optional(),
  status: z.string().default('Activo').optional()
});

export const CandidateIdSchema = z.object({ id: z.string().length(24) });

export const CandidateOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  match: z.number().int(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CandidatesListSchema = z.array(CandidateOutputSchema);
export type CandidateInput = z.infer<typeof CandidateInputSchema>;

export const CandidateUpdateSchema = CandidateInputSchema.partial();
export type CandidateUpdate = z.infer<typeof CandidateUpdateSchema>;

export const CandidateQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
  q: z.string().trim().optional(),
  status: z.string().trim().optional()
});
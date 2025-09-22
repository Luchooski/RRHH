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

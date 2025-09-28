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

export const CandidateUpdateSchema = CandidateInputSchema.partial();

/** Búsqueda avanzada + paginación + orden */
export const CandidateQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.string().trim().optional(),
  role: z.string().trim().optional(),
  matchMin: z.coerce.number().int().min(0).max(100).optional(),
  matchMax: z.coerce.number().int().min(0).max(100).optional(),
  createdFrom: z.coerce.date().optional(),   // ISO string o YYYY-MM-DD
  createdTo: z.coerce.date().optional(),
  sortField: z.enum(['createdAt','match','name','role','status']).default('createdAt'),
  sortDir: z.enum(['asc','desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});

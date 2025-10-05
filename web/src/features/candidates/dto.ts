import { z } from 'zod';

export const CandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  match: z.number(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Candidate = z.infer<typeof CandidateSchema>;

/**
 * INPUT de creación (¡sin id ni timestamps!)
 * Evitamos pick/omit/Mask para no arrastrar props indebidas.
 */
export const CandidateCreateInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  match: z.number().min(0).max(100).default(0),
  status: z.string().default('Nuevo'),
});
export type CandidateCreateInput = z.infer<typeof CandidateCreateInputSchema>;

/** INPUT de actualización parcial */
export const CandidateUpdateInputSchema = CandidateCreateInputSchema.partial();
export type CandidateUpdateInput = z.infer<typeof CandidateUpdateInputSchema>;

/** Query opcional (paginado/orden) */
export const CandidateQuerySchema = z.object({
  sortField: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  skip: z.number().int().min(0).optional(),
});
export type CandidateQuery = z.infer<typeof CandidateQuerySchema>;

/** Salida del listado */
export const CandidateListOutputSchema = z.object({
  items: z.array(CandidateSchema),
  total: z.number().int().min(0),
});
export type CandidateListOutput = z.infer<typeof CandidateListOutputSchema>;

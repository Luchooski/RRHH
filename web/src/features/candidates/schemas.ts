import { z } from 'zod';

export const LinkSchema = z.object({
  label: z.string().optional(),
  url: z.string().url('URL inválida'),
});

export const CandidateInputSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  location: z.string().optional(),
  seniority: z.enum(['jr', 'ssr', 'sr']).optional(),
  skills: z.array(z.string()).default([]),
  salaryExpectation: z.coerce.number().int().positive().optional(),
  resumeUrl: z.string().url('URL inválida').optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  links: z.array(LinkSchema).default([]),
});

export type CandidateInput = z.infer<typeof CandidateInputSchema>;

export const CandidateOutSchema = CandidateInputSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CandidateOut = z.infer<typeof CandidateOutSchema>;

export const CandidateListSchema = z.object({
  items: z.array(CandidateOutSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type CandidateList = z.infer<typeof CandidateListSchema>;

import { z } from 'zod';

export const Status = z.enum(['applied','screening','interview','offer','hired','rejected']);
export const Source = z.enum(['cv','form','import','manual']);

export const CandidateCreateInput = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6).optional().nullable(),
  skills: z.array(z.string().min(1)).default([]),
  status: Status.default('applied'),
  source: Source.default('manual'),
  notes: z.string().max(2000).optional().nullable(),
});

export const CandidateUpdateInput = CandidateCreateInput.partial();

export const CandidateOutput = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  skills: z.array(z.string()),
  status: Status,
  source: Source,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CandidateQuery = z.object({
  q: z.string().optional(),
  skills: z.string().optional(),   // "react,node"
  status: z.string().optional(),   // "applied,interview"
  sort: z.string().optional().default('-createdAt'), // "-createdAt" | "fullName" ...
  limit: z.coerce.number().min(1).max(100).default(20),
  skip: z.coerce.number().min(0).default(0),
});
export type CandidateCreateInput = z.infer<typeof CandidateCreateInput>;
export type CandidateUpdateInput = z.infer<typeof CandidateUpdateInput>;
export type CandidateOutput = z.infer<typeof CandidateOutput>;
export type CandidateQuery = z.infer<typeof CandidateQuery>;

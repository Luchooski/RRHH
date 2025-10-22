import { z } from 'zod';

export const Seniority = z.enum(['jr','ssr','sr']);
export const Stage = z.enum(['Activo','En proceso','Entrevista','Oferta','Contratado','Rechazado']);

export const CandidateCreateInput = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  seniority: Seniority.optional(),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  salary: z.number().int().positive().optional(),
  notes: z.string().max(4000).optional(),
  tags: z.array(z.string()).default([]),
  links: z.array(z.object({ label: z.string().optional(), url: z.string().url() })).default([]),
  status: Stage.optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  source: z.enum(['cv','form','import','manual']).default('manual')
});
export const CandidateUpdateInput = CandidateCreateInput.partial();

export const CandidateQuery = z.object({
  q: z.string().optional(),
  skills: z.string().optional(),
  languages: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  seniority: Seniority.optional(),
  status: Stage.optional(),
  minSalary: z.coerce.number().optional(),
  maxSalary: z.coerce.number().optional(),
  archived: z.coerce.boolean().optional(),
  sort: z.string().optional().default('-createdAt'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const CandidateOut = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  seniority: Seniority.optional(),
  skills: z.array(z.string()),
  languages: z.array(z.string()).optional(),
  salary: z.number().optional(),
  avatarUrl: z.string().url().optional(),
  resume: z.object({
    filename: z.string(),
    mimetype: z.string(),
    size: z.number(),
    url: z.string()
  }).partial().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()),
  links: z.array(z.object({ label: z.string().optional(), url: z.string() })),
  status: Stage,
  pipelineHistory: z.array(z.object({ stage: Stage, at: z.string(), by: z.string().optional(), note: z.string().optional() })),
  comments: z.array(z.object({ by: z.string().optional(), text: z.string(), at: z.string() })),
  reminders: z.array(z.object({ at: z.string(), note: z.string(), done: z.boolean() })),
  customFields: z.record(z.string(), z.unknown()).optional(),
  archivedAt: z.string().nullable(),
  source: z.enum(['cv','form','import','manual']).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// eslint-disable-next-line no-redeclare
export type CandidateCreateInput = z.infer<typeof CandidateCreateInput>;
// eslint-disable-next-line no-redeclare
export type CandidateUpdateInput = z.infer<typeof CandidateUpdateInput>;
// eslint-disable-next-line no-redeclare
export type CandidateQuery = z.infer<typeof CandidateQuery>;
// eslint-disable-next-line no-redeclare
export type CandidateOut = z.infer<typeof CandidateOut>;

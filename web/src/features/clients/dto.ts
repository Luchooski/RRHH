import { z } from 'zod';

export const ClientCreateInput = z.object({
  name: z.string().min(2),
  industry: z.string().min(2),
  size: z.enum(['small','medium','large']).default('small'),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(6).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
export type ClientCreateInput = z.infer<typeof ClientCreateInput>;

export const Client = ClientCreateInput.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Client = z.infer<typeof Client>;

export const ClientQuery = z.object({
  q: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  skip: z.number().int().min(0).default(0),
  sortField: z.enum(['name','createdAt']).default('createdAt'),
  sortDir: z.enum(['asc','desc']).default('desc'),
});
export type ClientQuery = z.infer<typeof ClientQuery>;

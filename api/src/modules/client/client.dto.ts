import { z } from 'zod';
import { paginatedOf } from '../_shared/dto.js';

export const ClientSizeEnum = z.enum(['small', 'medium', 'large']);

export const ClientCreateInput = z.object({
  name: z.string().min(2),
  industry: z.string().min(2),
  size: ClientSizeEnum,
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(7).max(20).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const ClientUpdateInput = ClientCreateInput.partial();

export const ClientOutput = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string().optional(),
  size: ClientSizeEnum,
  contactName: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ClientListQuery = z.object({
  q: z.string().trim().optional(),
  size: ClientSizeEnum.optional(),
  industry: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ClientListOutput = paginatedOf(ClientOutput);

export type TClientCreateInput = z.infer<typeof ClientCreateInput>;
export type TClientUpdateInput = z.infer<typeof ClientUpdateInput>;
export type TClientOutput = z.infer<typeof ClientOutput>;
export type TClientListQuery = z.infer<typeof ClientListQuery>;

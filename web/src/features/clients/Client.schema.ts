import { z } from 'zod';

export const ClientSizeEnum = z.enum(['small', 'medium', 'large']);

export const ClientCreateSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  industry: z.string().min(2, 'Mínimo 2 caracteres'),
  size: ClientSizeEnum,
  contactName: z.string().min(2, 'Mínimo 2 caracteres'),
  contactEmail: z.string().email('Email inválido'),
  contactPhone: z.string().min(7, 'Muy corto').max(20, 'Muy largo').nullable().optional(),
  notes: z.string().max(2000, 'Máximo 2000').nullable().optional(),
});

export const ClientUpdateSchema = ClientCreateSchema.partial();

export type ClientCreateValues = z.infer<typeof ClientCreateSchema>;
export type ClientUpdateValues = z.infer<typeof ClientUpdateSchema>;

export type ClientDTO = {
  id: string;
  name: string;
  industry?: string;
  size: 'small' | 'medium' | 'large';
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientListQuery = {
  q?: string;
  size?: 'small' | 'medium' | 'large';
  industry?: string;
  page?: number;
  limit?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

import { z } from 'zod';

export const ErrorDTO = z.object({
  error: z.string(),
});

export const OkDTO = z.object({
  ok: z.literal(true),
});

/** Helper para respuestas paginadas con tipado fuerte */
export const paginatedOf = <T extends z.ZodTypeAny>(Schema: T) =>
  z.object({
    items: z.array(Schema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });

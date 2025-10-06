import { z } from 'zod';

export const RangeQuery = z.object({
  from: z.string().datetime().optional(), // ISO
  to: z.string().datetime().optional(),   // ISO
});

export const ConversionOut = z.object({
  sent: z.number().int().nonnegative(),
  interview: z.number().int().nonnegative(),
  hired: z.number().int().nonnegative(),
  period: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export const TtcOut = z.object({
  avgDays: z.number(),
  count: z.number().int().nonnegative(),
  period: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export type TRangeQuery = z.infer<typeof RangeQuery>;

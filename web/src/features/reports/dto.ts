import { z } from 'zod';
export const Conversion = z.object({ sent: z.number(), interview: z.number(), hired: z.number() });
export type Conversion = z.infer<typeof Conversion>;
export const TimeToClose = z.object({ avgDays: z.number() });
export type TimeToClose = z.infer<typeof TimeToClose>;

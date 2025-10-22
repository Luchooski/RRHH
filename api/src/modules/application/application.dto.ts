import { z } from 'zod';

export const ApplicationCreateInput = z.object({
  candidateId: z.string().min(1),
  vacancyId: z.string().min(1),
  status: z.enum(['sent','interview','feedback','offer','hired','rejected']).default('sent'),
  notes: z.string().max(2000).optional().nullable(),
});
// eslint-disable-next-line no-redeclare
export type ApplicationCreateInput = z.infer<typeof ApplicationCreateInput>;

export const ApplicationDTO = ApplicationCreateInput.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
// eslint-disable-next-line no-redeclare
export type ApplicationDTO = z.infer<typeof ApplicationDTO>;

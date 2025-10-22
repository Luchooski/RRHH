import { z } from 'zod';

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
// eslint-disable-next-line no-redeclare
export type LoginInput = z.infer<typeof LoginInput>;

export const LoginOutput = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.string(),
  }),
});
// eslint-disable-next-line no-redeclare
export type LoginOutput = z.infer<typeof LoginOutput>;

// 👇 NUEVO
export const MeOutput = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.string(),
});
// eslint-disable-next-line no-redeclare
export type MeOutput = z.infer<typeof MeOutput>;

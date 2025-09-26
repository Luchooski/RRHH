import { z } from 'zod';

export const EmployeeInputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(2),
  phone: z.string().trim().optional(),
  baseSalary: z.number().nonnegative().default(0),
  monthlyHours: z.number().int().positive().default(160)
});

export const EmployeeIdSchema = z.object({ id: z.string().length(24) });

export const EmployeeOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  phone: z.string().optional(),
  baseSalary: z.number(),
  monthlyHours: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const EmployeesListSchema = z.array(EmployeeOutputSchema);

export type EmployeeInput = z.infer<typeof EmployeeInputSchema>;

import { z } from 'zod';
export const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.string(),
  email: z.string().email(),
  phone: z.string(),
  monthlyHours: z.number().int()
});
export const EmployeesSchema = z.array(EmployeeSchema);
export type Employee = z.infer<typeof EmployeeSchema>;

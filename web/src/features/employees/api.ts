import { z } from 'zod';
import { http } from '../../lib/http';

export const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  baseSalary: z.number().nonnegative(),
  monthlyHours: z.number().int().positive()
});
export const EmployeesSchema = z.array(EmployeeSchema);
export type Employee = z.infer<typeof EmployeeSchema>;

export async function fetchEmployees(): Promise<Employee[]> {
  const data = await http.get<unknown>('/api/v1/employees', { auth: true });
  return EmployeesSchema.parse(data);
}

export async function createEmployee(payload: Omit<Employee, 'id'>) {
  const data = await http.post<unknown>('/api/v1/employees', payload, { auth: true });
  return EmployeeSchema.parse(data);
}

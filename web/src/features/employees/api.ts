
import { EmployeesSchema, type Employee } from './schema';
export async function fetchEmployees(): Promise<Employee[]> {
  const data = await getJSON<unknown>('/mock/employees.json');
  return EmployeesSchema.parse(data);
}

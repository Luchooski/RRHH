import { Employee } from './employee.model.js';
import { EmployeeInput } from './employee.dto.js';

export async function listEmployees(limit = 50, skip = 0) {
  const docs = await Employee.find().limit(limit).skip(skip).lean();
  return docs.map(d => ({
    id: String(d._id),
    name: d.name,
    email: d.email,
    role: d.role,
    phone: d.phone,
    baseSalary: d.baseSalary,
    monthlyHours: d.monthlyHours,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString()
  }));
}

export async function createEmployee(input: EmployeeInput) {
  const doc = await Employee.create(input);
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    phone: doc.phone,
    baseSalary: doc.baseSalary,
    monthlyHours: doc.monthlyHours,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

import { EmployeeModel, type EmployeeDoc } from './employee.model.js';

function mapDoc(d: EmployeeDoc) {
  return {
    id: String(d._id),
    name: d.name,
    email: d.email,
    role: d.role,
    phone: d.phone ?? undefined,
    baseSalary: d.baseSalary,
    monthlyHours: d.monthlyHours,
    createdAt: d.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: d.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export async function listEmployees() {
  const docs = await EmployeeModel.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => mapDoc(d as any));
}

export async function getEmployeeById(id: string) {
  const d = await EmployeeModel.findById(id).lean();
  return d ? mapDoc(d as any) : null;
}

export async function createEmployee(input: {
  name: string; email: string; role: string; phone?: string; baseSalary: number; monthlyHours: number;
}) {
  const created = await EmployeeModel.create(input);
  return mapDoc(created.toObject() as any);
}

export async function updateEmployee(id: string, input: Partial<{
  name: string; email: string; role: string; phone?: string; baseSalary: number; monthlyHours: number;
}>) {
  const updated = await EmployeeModel.findByIdAndUpdate(id, input, { new: true }).lean();
  return updated ? mapDoc(updated as any) : null;
}

export async function removeEmployee(id: string) {
  await EmployeeModel.findByIdAndDelete(id);
  return { ok: true };
}

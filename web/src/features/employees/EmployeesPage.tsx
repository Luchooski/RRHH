import { useEmployees, useCreateEmployee } from './hooks';
import { useState } from 'react';

export default function EmployeesPage() {
  const { data, isLoading, isError, error } = useEmployees();
  const { mutateAsync, isPending } = useCreateEmployee();

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    baseSalary: 0,
    monthlyHours: 160
  });

  if (isLoading) return <div className="section">Cargando empleados…</div>;
  if (isError) return <div className="section text-red-600">Error: {(error as Error).message}</div>;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({
      name: form.name,
      email: form.email,
      role: form.role,
      phone: form.phone || undefined,
      baseSalary: Number(form.baseSalary),
      monthlyHours: Number(form.monthlyHours)
    });
    setForm({ name: '', email: '', role: '', phone: '', baseSalary: 0, monthlyHours: 160 });
  }

  return (
    <div className="section space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Empleados</h1>

      <form onSubmit={onSubmit} className="card p-4 grid gap-3 sm:grid-cols-2">
        <input className="input" placeholder="Nombre" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required aria-label="Nombre" />
        <input className="input" placeholder="Email" type="email" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required aria-label="Email" />
        <input className="input" placeholder="Rol" value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required aria-label="Rol" />
        <input className="input" placeholder="Teléfono" value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} aria-label="Teléfono" />
        <input className="input" placeholder="Salario base" type="number" min={0} value={form.baseSalary}
          onChange={e => setForm(f => ({ ...f, baseSalary: Number(e.target.value) }))} aria-label="Salario base" />
        <input className="input" placeholder="Horas mensuales" type="number" min={1} value={form.monthlyHours}
          onChange={e => setForm(f => ({ ...f, monthlyHours: Number(e.target.value) }))} aria-label="Horas mensuales" />
        <button className="btn touch-target sm:col-span-2" disabled={isPending} aria-label="Crear empleado">
          {isPending ? 'Creando…' : 'Crear empleado'}
        </button>
      </form>

      <section className="card p-4">
        <h2 className="text-lg font-semibold mb-3">Listado</h2>
        <ul className="divide-y">
          {(data ?? []).map(emp => (
            <li key={emp.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="font-medium">{emp.name} <span className="text-[--color-muted]">({emp.role})</span></div>
                <div className="text-sm text-[--color-muted]">{emp.email} · {emp.phone || '—'}</div>
              </div>
              <div className="text-sm">Salario: ${emp.baseSalary.toLocaleString()} · {emp.monthlyHours} hs/mes</div>
            </li>
          ))}
          {(!data || data.length === 0) && <li className="py-3 text-[--color-muted]">Sin empleados</li>}
        </ul>
      </section>
    </div>
  );
}

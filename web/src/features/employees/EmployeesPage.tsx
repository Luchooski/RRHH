import { useEmployees, useCreateEmployee } from './hooks';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';

const EmployeeCreateSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().optional(),
  baseSalary: z.number().int('Debe ser entero').nonnegative('Debe ser ≥ 0'),
  monthlyHours: z.number().int('Debe ser entero').positive('Debe ser > 0'),
});
type EmployeeCreate = z.infer<typeof EmployeeCreateSchema>;

export default function EmployeesPage() {
  const { data, isLoading, isError, error, refetch } = useEmployees();
  const { mutateAsync, isPending } = useCreateEmployee();

  // búsqueda local (front-only)
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((e) =>
      [e.name, e.email, e.role, e.phone ?? '', String(e.baseSalary), String(e.monthlyHours)]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [data, query]);

  // form
  const { handleSubmit, register, reset, formState } = useForm<EmployeeCreate>({
    resolver: zodResolver(EmployeeCreateSchema),
    defaultValues: {
      name: '',
      email: '',
      role: '',
      phone: '',
      baseSalary: 0,
      monthlyHours: 160,
    },
    mode: 'onTouched',
  });

  async function onSubmit(values: EmployeeCreate) {
    await mutateAsync(values);
    (window as any).toast?.('Empleado creado');
    reset();
  }

  return (
    <div className="section space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Empleados</h1>

      {/* Alta */}
      <Card>
        <CardHeader>
          <CardTitle>Nuevo empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2" noValidate>
            <label className="block">
              <span className="block text-sm mb-1">Nombre</span>
              <Input placeholder="Ej: Ana Pérez" {...register('name')} full aria-invalid={!!formState.errors.name} />
              {formState.errors.name && (
                <span className="text-xs text-red-600">{formState.errors.name.message}</span>
              )}
            </label>
            <label className="block">
              <span className="block text-sm mb-1">Email</span>
              <Input type="email" placeholder="ana@empresa.com" {...register('email')} full aria-invalid={!!formState.errors.email} />
              {formState.errors.email && (
                <span className="text-xs text-red-600">{formState.errors.email.message}</span>
              )}
            </label>
            <label className="block">
              <span className="block text-sm mb-1">Rol</span>
              <Input placeholder="Ej: Recruiter" {...register('role')} full aria-invalid={!!formState.errors.role} />
              {formState.errors.role && (
                <span className="text-xs text-red-600">{formState.errors.role.message}</span>
              )}
            </label>
            <label className="block">
              <span className="block text-sm mb-1">Teléfono</span>
              <Input placeholder="+54 9 ..." {...register('phone')} full />
            </label>
            <label className="block">
              <span className="block text-sm mb-1">Salario base</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                {...register('baseSalary', { valueAsNumber: true })}
                full
                aria-invalid={!!formState.errors.baseSalary}
              />              {formState.errors.baseSalary && (
                <span className="text-xs text-red-600">{formState.errors.baseSalary.message}</span>
              )}
            </label>
            <label className="block">
              <span className="block text-sm mb-1">Horas mensuales</span>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                {...register('monthlyHours', { valueAsNumber: true })}
                full
                aria-invalid={!!formState.errors.monthlyHours}
              />              {formState.errors.monthlyHours && (
                <span className="text-xs text-red-600">{formState.errors.monthlyHours.message}</span>
              )}
            </label>

            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button type="button" onClick={() => reset()}>
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nombre, rol, email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="ghost" onClick={() => { setQuery(''); refetch(); }}>
              Limpiar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="p-4"><Spinner /></div>
          )}

          {isError && (
            <div role="alert" className="card p-4 border border-red-200">
              <p className="text-sm text-red-700">No se pudo cargar: {(error as any)?.message ?? 'Error'}</p>
              <div className="mt-2">
                <Button onClick={() => refetch()}>Reintentar</Button>
              </div>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {(!filtered || filtered.length === 0) ? (
                <div className="card p-8 text-center text-[--color-muted]">Sin resultados</div>
              ) : (
                <div className="overflow-auto max-h-[420px] border border-[--color-border] rounded-xl">
                  <Table className="[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:bg-[--color-surface]">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Salario</th>
                        <th>Horas/mes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((emp) => (
                        <tr key={emp.id} className="border-t border-[--color-border]/70">
                          <td className="font-medium">{emp.name}</td>
                          <td>{emp.role}</td>
                          <td className="text-[--color-muted]">{emp.email}</td>
                          <td className="text-[--color-muted]">{emp.phone || '—'}</td>
                          <td>${emp.baseSalary.toLocaleString()}</td>
                          <td>{emp.monthlyHours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

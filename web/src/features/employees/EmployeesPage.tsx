import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toolbar } from '@/components/ui/Toolbar';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SimpleTable, TR, TD } from '@/components/ui/Table';
import { useCreateEmployee, useDeleteEmployee, useEmployees } from './hooks';
import type { EmployeeCreateInput } from './dto';
import { KpiCard } from '@/components/ui/KpiCard';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Users, Clock, Banknote, UserPlus } from 'lucide-react';

function pesos(n: number) {
  if (!Number.isFinite(n)) return '$ 0';
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}
function fmtDate(s: string) {
  const d = new Date(s); if (Number.isNaN(+d)) return '—';
  return d.toLocaleDateString('es-AR');
}

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [limit, setLimit] = useState(20);
  const [skip, setSkip] = useState(0);

  const { data, isFetching } = useEmployees({ limit, skip });
  const create = useCreateEmployee();
  const del = useDeleteEmployee();

  const items = data?.items ?? [];

  const total = items.length;
  const avgHours = total ? Math.round(items.reduce((a,b)=>a+(b.monthlyHours??0),0)/total) : 0;
  const avgBase = total ? Math.round(items.reduce((a,b)=>a+(b.baseSalary??0),0)/total) : 0;

  const kpis = useMemo(() => {
    const total = items.length;
    const avgSalary = total ? Math.round(items.reduce((a, b) => a + (b.baseSalary || 0), 0) / total) : 0;
    const avgHours = total ? Math.round(items.reduce((a, b) => a + (b.monthlyHours || 0), 0) / total) : 0;
    const last = items[0]?.updatedAt ?? new Date().toISOString();
    return { total, avgSalary, avgHours, last };
  }, [items]);

  const [form, setForm] = useState<EmployeeCreateInput>({
    name: '', email: '', role: '', baseSalary: 0, monthlyHours: 160, phone: '',
  });

  const onCreate = async () => {
    if (!form.name || !form.email || !form.role) return;
    await create.mutateAsync({
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role.trim(),
      baseSalary: Number(form.baseSalary) || 0,
      monthlyHours: Number(form.monthlyHours) || 0,
      phone: form.phone?.trim() || undefined,
    });
    setForm((f) => ({ ...f, name: '', email: '', role: '', baseSalary: 0, monthlyHours: 160, phone: '' }));
  };

  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar empleado?')) return;
    await del.mutateAsync(id);
  };

  const next = () => setSkip((s) => s + limit);
  const prev = () => setSkip((s) => Math.max(0, s - limit));

  return (
    <div className="container space-y-4" role="main" aria-label="Sección Empleados">
      <Toolbar
        title="Empleados"
        right={
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/empleados/nuevo')} variant="primary" className="min-w-[140px]">
              <UserPlus size={18} />
              Nuevo empleado
            </Button>
            <Button onClick={() => window.location.reload()} className="min-w-[96px]">
              {isFetching ? 'Actualizando…' : 'Refrescar'}
            </Button>
          </div>
        }
      />

      {/* KPI Header */}
      <Card className="p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-fuchsia-600 px-5 py-4 text-white">
          <h3 className="text-xl font-semibold">Altas, consultas y mantenimiento</h3>
          <p className="opacity-90 text-sm">Resumen</p>
        </div>
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-4">
            <div className="text-xs text-[--color-muted]">Total</div>
            <div className="mt-1 text-2xl font-bold">{kpis.total}</div>
          </div>
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-4">
            <div className="text-xs text-[--color-muted]">Sueldo base prom.</div>
            <div className="mt-1 text-2xl font-bold">{pesos(kpis.avgSalary)}</div>
          </div>
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-4">
            <div className="text-xs text-[--color-muted]">Horas mensuales prom.</div>
            <div className="mt-1 text-2xl font-bold">{kpis.avgHours}</div>
          </div>
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-4">
            <div className="text-xs text-[--color-muted]">Actualizado</div>
            <div className="mt-1 text-2xl font-bold">{fmtDate(kpis.last)}</div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
          </CardHeader>
          <CardBody>
            <SimpleTable head={['Nombre','Email','Rol','Sueldo base','Horas/mes','Creado','']}>
              {items.map((e) => (
                <TR key={e.id}>
                  <TD className="font-semibold">{e.name}</TD>
                  <TD className="text-[--color-muted]">{e.email}</TD>
                  <TD>{e.role}</TD>
                  <TD>{pesos(e.baseSalary)}</TD>
                  <TD>{e.monthlyHours}</TD>
                  <TD className="text-[--color-muted]">{fmtDate(e.createdAt)}</TD>
                  <TD className="text-right">
                    <Button variant="danger" onClick={() => onDelete(e.id)}>Eliminar</Button>
                  </TD>
                </TR>
              ))}
            </SimpleTable>

            <div className="mt-3 flex items-center justify-end gap-2">
              <Button variant="ghost" disabled={skip === 0} onClick={prev}>← Anterior</Button>
              <Button variant="ghost" onClick={next}>Siguiente →</Button>
              <Select
                value={String(limit)}
                onChange={(e) => { setLimit(Number(e.target.value)); setSkip(0); }}
                className="w-[120px]"
                aria-label="Resultados por página"
              >
                <option value="10">10/pág</option>
                <option value="20">20/pág</option>
                <option value="50">50/pág</option>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Alta rápida */}
        <Card>
          <CardHeader>
            <CardTitle>Alta rápida</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <label className="block text-xs text-[--color-muted] mb-1">Nombre</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-[--color-muted] mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-[--color-muted] mb-1">Rol</label>
              <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[--color-muted] mb-1">Sueldo base</label>
                <Input
                  type="number"
                  value={form.baseSalary}
                  onChange={(e) => setForm((f) => ({ ...f, baseSalary: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-xs text-[--color-muted] mb-1">Horas/mes</label>
                <Input
                  type="number"
                  value={form.monthlyHours}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyHours: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[--color-muted] mb-1">Teléfono (opcional)</label>
              <Input value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </CardBody>
          <CardFooter className="flex justify-end">
            <Button variant="primary" onClick={onCreate} disabled={create.isPending}>
              {create.isPending ? 'Creando…' : 'Crear empleado'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

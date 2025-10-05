import { useMemo, useState } from 'react';
import { Toolbar } from '@/components/ui/Toolbar';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SimpleTable, TR, TD } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { PeriodPicker } from './PeriodPicker';
import { currentPeriod, downloadCsv } from './api';
import { useApprovePayroll, useDeletePayroll, usePayrolls } from './hooks';
import type { Payroll } from './dto';

function pesos(n: number) {
  if (!Number.isFinite(n)) return '$ 0';
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}
function fmtDate(s: string) {
  const d = new Date(s); if (Number.isNaN(+d)) return '—';
  return d.toLocaleDateString('es-AR');
}

export default function PayrollPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [status, setStatus] = useState<'Borrador'|'Aprobado'|undefined>(undefined);
  const [limit, setLimit] = useState(20);
  const [skip, setSkip] = useState(0);

  const { data, isFetching, isLoading, error } =
    usePayrolls({ period, status, limit, skip });

  const approve = useApprovePayroll();
  const del = useDeletePayroll();

  const items = data?.items ?? [];

  const kpis = useMemo(() => {
    const total = data?.total ?? 0;
    const aprobados = items.filter(i => i.status === 'Aprobado').length;
    const borradores = items.filter(i => i.status === 'Borrador').length;
    const avgBase = items.length
      ? Math.round(items.reduce((a, b) => a + (b.baseSalary || 0), 0) / items.length)
      : 0;
    return { total, aprobados, borradores, avgBase };
  }, [items, data?.total]);

  const onApprove = async (id: string) => {
    await approve.mutateAsync(id);
  };
  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar liquidación?')) return;
    await del.mutateAsync(id);
  };

  const next = () => setSkip(s => s + limit);
  const prev = () => setSkip(s => Math.max(0, s - limit));

  return (
    <div className="container space-y-4" role="main" aria-label="Sección Liquidaciones">
      <Toolbar
        title="Liquidaciones"
        right={
          <div className="flex items-center gap-2">
            <Button onClick={() => downloadCsv({ period, status })}>
              Exportar CSV
            </Button>
            <span className="text-sm text-[--color-muted]">
              {isFetching ? 'Actualizando…' : null}
            </span>
          </div>
        }
      />

      {/* Filtros / KPIs */}
      <Card>
        <CardBody className="grid gap-3 md:grid-cols-4">
          <PeriodPicker value={period} onChange={(e) => { setPeriod((e.target as HTMLInputElement).value); setSkip(0); }} />
          <div>
            <label className="block text-xs text-[--color-muted] mb-1">Estado</label>
            <Select
              value={status ?? ''}
              onChange={(e) => { const v = e.target.value as 'Borrador'|'Aprobado'|''; setStatus(v || undefined); setSkip(0); }}
            >
              <option value="">Todos</option>
              <option value="Borrador">Borrador</option>
              <option value="Aprobado">Aprobado</option>
            </Select>
          </div>
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-4">
            <div className="text-xs text-[--color-muted]">Total</div>
            <div className="mt-1 text-2xl font-bold">{kpis.total}</div>
          </div>
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-4">
            <div className="text-xs text-[--color-muted]">Sueldo base prom.</div>
            <div className="mt-1 text-2xl font-bold">{pesos(kpis.avgBase)}</div>
          </div>
        </CardBody>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardBody>
          {error ? (
            <div className="p-4 text-sm text-red-600 dark:text-red-400">
              {(error as any)?.message ?? 'Error al cargar liquidaciones.'}
            </div>
          ) : isLoading ? (
            <div className="p-6 text-center text-sm text-[--color-muted]">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-sm text-[--color-muted]">
              No hay liquidaciones para el período seleccionado.
            </div>
          ) : (
            <>
              <SimpleTable head={['Empleado','Período','Sueldo base','Bono','Horas ext.','Estado','Creado','Acciones']}>
                {items.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-semibold">{p.employeeName}</TD>
                    <TD>{p.period}</TD>
                    <TD>{pesos(p.baseSalary)}</TD>
                    <TD>{pesos(p.bonuses ?? 0)}</TD>
                    <TD>{p.overtimeHours ?? 0}</TD>
                    <TD>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold
                        ${p.status === 'Aprobado'
                          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50'
                          : 'bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50'}`}>
                        {p.status}
                      </span>
                    </TD>
                    <TD className="text-[--color-muted]">{fmtDate(p.createdAt)}</TD>
                    <TD className="space-x-2">
                      {p.status === 'Borrador' && (
                        <Button variant="primary" onClick={() => onApprove(p.id)}>
                          Aprobar
                        </Button>
                      )}
                      <Button variant="danger" onClick={() => onDelete(p.id)}>
                        Eliminar
                      </Button>
                    </TD>
                  </TR>
                ))}
              </SimpleTable>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button variant="ghost" disabled={skip === 0} onClick={prev}>← Anterior</Button>
                <Button variant="ghost" onClick={next}>Siguiente →</Button>
                <Select
                  value={String(limit)}
                  onChange={(e) => { const v = Number(e.target.value); setLimit(v); setSkip(0); }}
                  className="w-[120px]"
                  aria-label="Resultados por página"
                >
                  <option value="10">10/pág</option>
                  <option value="20">20/pág</option>
                  <option value="50">50/pág</option>
                </Select>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

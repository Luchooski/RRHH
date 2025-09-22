// web/src/features/payroll/PayrollPage.tsx
import { useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

import { employees } from '../../mock/employees';
import Toast from '../../components/Toast';
import { pushHistory } from '../history/HistoryDrawer';
import ConceptEditor from './ConceptEditor';
import PayrollTemplate from './PayrollTemplate';
import * as store from './storage';
import { computePayroll, formatMoney } from './utils';
import { download, toCSVRecords } from './csv';
import { exportTemplatePdf, withVisibleForCapture  } from './pdf';


import {
  useApiOnline,
  useCreatePayroll,
  useApprovePayroll,
  useDeletePayroll,
  useUpdatePayroll,
  useBulkCreate,
} from './hooks';
import {
  listPayrolls,
  exportCsvUrl,
  type PayrollInputDTO as ApiInput,
} from './api';
import type { Concept } from './schema';

/* ===== Form schema (front) ===== */
export const PayrollInputSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  baseSalary: z.number().min(0),
  bonuses: z.number().min(0).default(0),
  overtimeHours: z.number().min(0).default(0),
  overtimeRate: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  contributionsRate: z.number().min(0).max(100).default(0),
});
export type PayrollInput = z.infer<typeof PayrollInputSchema>;

/* ===== Toast helper ===== */
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  return {
    msg,
    setToast: (m: string) => {
      setMsg(m);
      setTimeout(() => setMsg(null), 2500);
    },
  };
}

export default function PayrollPage() {
  const { msg, setToast } = useToast();
  const templateRef = useRef<HTMLDivElement | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  // Conceptos desde la primera plantilla guardada (si existe)
  const [concepts, setConcepts] = useState<Concept[]>(
    () => store.listTemplates()[0]?.concepts ?? []
  );

  // Form inicial
  const [form, setForm] = useState<PayrollInput>({
    employeeId: employees[0]?.id ?? 'e1',
    employeeName: employees[0]?.name ?? 'Empleado',
    period: new Date().toISOString().slice(0, 7),
    baseSalary: employees[0]?.baseSalary ?? 0,
    bonuses: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    deductions: 0,
    taxRate: 0,
    contributionsRate: 0,
  });

  // API online?
  const api = useApiOnline();
  const useApi = api.data === true;

  // Paginación (servidor)
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Query servidor (historial) con limit/skip reales
  const qApi = useQuery({
    queryKey: ['payrolls', { period: form.period, page, pageSize }],
    queryFn: () =>
      listPayrolls({
        period: form.period,
        limit: pageSize,
        skip: page * pageSize,
      }),
    enabled: useApi && !!form.period,
  });

  // Mutations (servidor)
  const mCreateApi = useCreatePayroll();
  const mApproveApi = useApprovePayroll();
  const mDeleteApi = useDeletePayroll();
  const mUpdateApi = useUpdatePayroll();
  const mBulkApi = useBulkCreate();

  // Historial local (fallback)
  const [q, setQ] = useState('');
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  const [localRows, setLocalRows] = useState(() => store.list({ q, order }));
  const reloadLocal = () => setLocalRows(store.list({ q, order }));

  const calc = useMemo(() => computePayroll(form, concepts), [form, concepts]);

  const set = <K extends keyof PayrollInput>(k: K, v: PayrollInput[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Flag para distinguir crear vs editar (simple)
  const editIdRef = useRef<string | undefined>(undefined);

  // Helpers de estado/confirm
  const isApproved = (status?: string) => status === 'Aprobado';
  const canMutate = (status?: string) => !isApproved(status);
  const confirmApprove = () =>
    window.confirm('¿Aprobar esta liquidación? Esta acción no se puede deshacer.');
  const confirmDelete = () =>
    window.confirm('¿Eliminar definitivamente?');

  const onSave = async () => {
    const ok = PayrollInputSchema.safeParse(form);
    if (!ok.success) {
      setToast('Revisá los campos del formulario');
      return;
    }
    const dto: ApiInput = { ...ok.data, concepts };
    const editId = editIdRef.current;

    if (useApi) {
      try {
        if (editId) {
          await mUpdateApi.mutateAsync({ id: editId, patch: dto });
          editIdRef.current = undefined;
          setToast('Actualizada en servidor');
        } else {
          await mCreateApi.mutateAsync(dto);
          setToast('Guardada en servidor');
        }
        pushHistory('Liquidación (API)', `${dto.employeeName} ${dto.period}`);
        setPage(0);
      } catch {
        setToast('API: error al guardar');
      }
    } else {
      if (editId) {
        setToast('Edición local no implementada (usá servidor o borra y crea)');
      } else {
        try {
          const rec = store.create(ok.data, concepts, 'Borrador');
          pushHistory('Generó liquidación (local)', `${rec.employeeName} ${rec.period}`);
          setToast('Guardada localmente');
          reloadLocal();
        } catch {
          setToast('Local: error al guardar');
        }
      }
    }
  };

  const onApprove = async (id: string) => {
    if (useApi) {
      try {
        await mApproveApi.mutateAsync(id);
        setToast('Aprobada (API)');
      } catch {
        setToast('API: error al aprobar');
      }
    } else {
      try {
        store.approve(id);
        setToast('Aprobada (local)');
        reloadLocal();
      } catch {
        setToast('Local: error al aprobar');
      }
    }
  };

  const onDelete = async (id: string) => {
    if (!confirmDelete()) return;
    if (useApi) {
      try {
        await mDeleteApi.mutateAsync(id);
        setToast('Eliminada (API)');
        const total = qApi.data?.total ?? 0;
        const after = total - 1;
        const lastPage = Math.max(0, Math.ceil(after / pageSize) - 1);
        if (page > lastPage) setPage(lastPage);
      } catch {
        setToast('API: error al eliminar');
      }
    } else {
      try {
        store.remove(id);
        setToast('Eliminada (local)');
        reloadLocal();
      } catch {
        setToast('Local: error al eliminar');
      }
    }
  };

  // Exportar CSV (local)
  const csvRef = useRef<HTMLAnchorElement | null>(null);
  const exportCSVLocal = () => {
    const rows = localRows;
    const data = rows.map((r) => ({
      id: (r as any).id ?? (r as any)._id ?? '',
      empleado: r.employeeName,
      periodo: r.period,
      base: r.baseSalary,
      neto: computePayroll(r as any, (r as any).concepts ?? []).net,
      estado: r.status,
      creado: new Date(r.createdAt).toLocaleString(),
    })) as Array<Record<string, string | number>>;

    const csv = toCSVRecords(data);
    download(`liquidaciones_${form.period}.csv`, csv, 'text/csv');
  };

  return (
    <div className="space-y-6">
      {msg && <Toast message={msg} />}

      {/* Formulario */}
      <section className="card p-4 sm:p-6 space-y-3">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Nueva liquidación</h3>
          <span className="text-xs text-zinc-500">
            {useApi ? 'Modo servidor' : 'Modo local (API offline)'}
          </span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-xs">Empleado</label>
            <select
              className="input"
              value={form.employeeId}
              onChange={(e) => {
                const emp = employees.find((x) => x.id === e.target.value);
                set('employeeId', e.target.value);
                set('employeeName', emp?.name ?? '');
                if (emp?.baseSalary != null) set('baseSalary', emp.baseSalary);
              }}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs">Período (YYYY-MM)</label>
            <input
              className="input"
              type="month"
              value={form.period}
              onChange={(e) => {
                set('period', e.target.value);
                setPage(0);
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs">Sueldo base</label>
            <input
              className="input"
              inputMode="decimal"
              value={String(form.baseSalary)}
              onChange={(e) =>
                set('baseSalary', Number(e.target.value.replace(',', '.')) || 0)
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs">Bonos</label>
            <input
              className="input"
              inputMode="decimal"
              value={String(form.bonuses)}
              onChange={(e) =>
                set('bonuses', Number(e.target.value.replace(',', '.')) || 0)
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs">Horas extra</label>
            <input
              className="input"
              inputMode="numeric"
              value={String(form.overtimeHours)}
              onChange={(e) => set('overtimeHours', Number(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs">Valor hora extra</label>
            <input
              className="input"
              inputMode="decimal"
              value={String(form.overtimeRate)}
              onChange={(e) =>
                set('overtimeRate', Number(e.target.value.replace(',', '.')) || 0)
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs">Deducciones manuales</label>
            <input
              className="input"
              inputMode="decimal"
              value={String(form.deductions)}
              onChange={(e) =>
                set('deductions', Number(e.target.value.replace(',', '.')) || 0)
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs">Impuestos (%)</label>
            <input
              className="input"
              inputMode="decimal"
              value={String(form.taxRate)}
              onChange={(e) =>
                set('taxRate', Number(e.target.value.replace(',', '.')) || 0)
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs">Aportes (%)</label>
            <input
              className="input"
              inputMode="decimal"
              value={String(form.contributionsRate)}
              onChange={(e) =>
                set(
                  'contributionsRate',
                  Number(e.target.value.replace(',', '.')) || 0
                )
              }
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Imponible" value={formatMoney(calc.taxableBase)} />
          <KPI label="No rem." value={formatMoney(calc.nonRemuneratives)} />
          <KPI label="Bruto" value={formatMoney(calc.gross)} />
          <KPI label="Neto" value={formatMoney(calc.net)} />
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            className="btn"
            disabled={pdfBusy || !templateRef.current}
            onClick={async () => {
              if (!templateRef.current) return;
              try {
                setPdfBusy(true);
        // DEBUG: log de visibilidad/tamaño/estilos
        const el = templateRef.current;
        const rect = el.getBoundingClientRect();
       const cs = getComputedStyle(el);
        console.log('[PDF DEBUG] rect:', rect);
       console.log('[PDF DEBUG] styles:', {
          display: cs.display,
          visibility: cs.visibility,
          opacity: cs.opacity,
          backgroundColor: cs.backgroundColor,
          color: cs.color,
          transform: cs.transform,
        });

 await withVisibleForCapture(el, () =>
   exportTemplatePdf(el, {
     filename: `Recibo_${form.employeeName}_${form.period}.pdf`,
   }),
   { lightBg: '#ffffff', textColor: '#000' }
 );
                setToast('PDF generado');
              } catch (err: any) {
                const msg = err?.message ?? String(err);
                // Log completo a consola con contexto
                console.error('PDF error:', err);
                // Mensaje visible al usuario
                setToast(`Error generando PDF: ${msg}`);
                // Como refuerzo, alert opcional en DEV
                if (import.meta.env.DEV) {
                  alert(`Error generando PDF:\n${msg}`);
                }
              } finally {
                setPdfBusy(false);
              }
            }}
          >
            {pdfBusy ? 'Generando PDF…' : 'Descargar recibo (PDF)'}
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            {editIdRef.current ? 'Guardar cambios' : 'Guardar'}
          </button>

          {useApi ? (
            <button
              className="btn"
              onClick={() => {
                const url = exportCsvUrl({ period: form.period });
                window.open(url, '_blank');
              }}
            >
              Exportar CSV (servidor)
            </button>
          ) : (
            <>
              <a ref={csvRef as any} className="hidden" />
              <button className="btn" onClick={exportCSVLocal}>
                Exportar CSV (local)
              </button>
            </>
          )}

          {/* Demo: bulk create en server para 5 empleados */}
          <button
            className="btn"
            onClick={async () => {
              if (!useApi) return setToast('Bulk solo en modo servidor');
              try {
                await mBulkApi.mutateAsync({
                  period: form.period,
                  defaults: {
                    bonuses: 0,
                    overtimeHours: 0,
                    overtimeRate: 0,
                    deductions: 0,
                    taxRate: form.taxRate,
                    contributionsRate: form.contributionsRate,
                  },
                  concepts,
                  employees: employees.slice(0, 5).map((e) => ({
                    employeeId: e.id,
                    employeeName: e.name,
                    baseSalary: e.baseSalary,
                  })),
                });
                setToast('Bulk creado');
                setPage(0);
              } catch {
                setToast('API: error en bulk');
              }
            }}
          >
            Crear 5 liquidaciones (bulk)
          </button>
        </div>
      </section>

      {/* Conceptos */}
      <ConceptEditor
        concepts={concepts}
        onChange={setConcepts}
        onSaveTemplate={() => setToast('Plantilla guardada')}
      />

      {/* Vista previa de recibo */}
      <PayrollTemplate
        ref={templateRef}
        /* 👇 agrega este id fijo para el CSS de impresión */
        employeeName={form.employeeName}
        period={form.period}
        baseSalary={form.baseSalary}
        bonuses={form.bonuses}
        overtimeAmount={calc.overtimeAmount}
        deductions={form.deductions + calc.conceptsDeductions}
        taxes={calc.taxes}
        contributions={calc.contributions}
        gross={calc.gross}
        net={calc.net}
        applied={calc.applied}
      />


      {/* Historial */}
      <section className="card p-4 sm:p-6 space-y-3">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-sm font-semibold">
            Historial ({useApi ? 'servidor' : 'local'}){' '}
            {useApi === false && (
              <span className="text-amber-600">— API offline</span>
            )}
          </h3>

          {!useApi && (
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Buscar..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  reloadLocal();
                }}
              />
              <select
                className="input"
                value={order}
                onChange={(e) => {
                  setOrder(e.target.value as any);
                  reloadLocal();
                }}
              >
                <option value="desc">Más recientes</option>
                <option value="asc">Más antiguas</option>
              </select>
            </div>
          )}
        </header>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Empleado</th>
                <th className="p-2">Período</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Base</th>
                <th className="p-2">Neto</th>
                <th className="p-2">Creado</th>
                <th className="p-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {useApi
                ? (qApi.data?.items ?? []).map((r: any) => {
                    const { net } = computePayroll(
                      r as any,
                      (r as any).concepts ?? []
                    );
                    const isDraft = r.status === 'Borrador';
                    return (
                      <tr
                        key={r.id}
                        className="border-t border-[--color-border] hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <td className="p-2">{r.employeeName}</td>
                        <td className="p-2">{r.period}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              isDraft
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                                : 'bg-green-500/15 text-green-600 dark:text-green-400'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-2">{formatMoney(r.baseSalary)}</td>
                        <td className="p-2">{formatMoney(net)}</td>
                        <td className="p-2">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2 justify-end">
                            {/* Recibo PDF (permitido siempre) */}
                            <button
                              className="btn"
                              disabled={pdfBusy}
                              onClick={async () => {
                                try {
                                  setPdfBusy(true);
                                  // 1) cargar datos en el formulario para renderizar el template
                                  setForm({
                                    employeeId: r.employeeId,
                                    employeeName: r.employeeName,
                                    period: r.period,
                                    baseSalary: r.baseSalary,
                                    bonuses: r.bonuses,
                                    overtimeHours: r.overtimeHours,
                                    overtimeRate: r.overtimeRate,
                                    deductions: r.deductions,
                                    taxRate: r.taxRate,
                                    contributionsRate: r.contributionsRate,
                                  });
                                  setConcepts((r as any).concepts ?? []);
                                  // 2) esperar a que React pinte el template
                                  await new Promise((res) => setTimeout(res, 120));
                                  // 3) exportar
                                  if (templateRef.current) {
                                    await exportTemplatePdf(templateRef.current, {
                                      filename: `Recibo_${r.employeeName}_${r.period}.pdf`,
                                    });
                                    setToast('PDF generado');
                                  } else {
                                    setToast('No se encontró el template para exportar');
                                  }
                                } catch {
                                  setToast('Error generando PDF');
                                } finally {
                                  setPdfBusy(false);
                                }
                              }}
                            >
                              Recibo (PDF)
                            </button>

                            {/* Aprobar solo si está en borrador */}
                            {isDraft && (
                              <button
                                className="btn"
                                onClick={() => {
                                  const id = r.id as string | undefined;
                                  const valid = !!id && /^[0-9a-fA-F]{24}$/.test(id);
                                  if (!valid) {
                                    console.error('ID inválido para aprobar:', id, r);
                                    setToast('No se pudo aprobar: ID inválido');
                                    return;
                                  }
                                  if (confirmApprove()) onApprove(id);
                                }}
                              >
                                Aprobar
                              </button>
                            )}

                            {/* Editar: deshabilitado si aprobada */}
                            <button
                              className="btn"
                              disabled={!canMutate(r.status)}
                              onClick={() => {
                                // cargar para edición
                                setForm({
                                  employeeId: r.employeeId,
                                  employeeName: r.employeeName,
                                  period: r.period,
                                  baseSalary: r.baseSalary,
                                  bonuses: r.bonuses,
                                  overtimeHours: r.overtimeHours,
                                  overtimeRate: r.overtimeRate,
                                  deductions: r.deductions,
                                  taxRate: r.taxRate,
                                  contributionsRate: r.contributionsRate,
                                });
                                setConcepts((r as any).concepts ?? []);
                                editIdRef.current = r.id;
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setToast('Cargada en formulario para editar');
                              }}
                            >
                              Editar
                            </button>

                            {/* Borrar: deshabilitado si aprobada, con confirm */}
                            <button
                              className="btn"
                              disabled={!canMutate(r.status)}
                              onClick={() => {
                                onDelete(r.id);
                              }}
                            >
                              Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : localRows.map((r: any) => {
                    const { net } = computePayroll(
                      r as any,
                      (r as any).concepts ?? []
                    );
                    const isDraft = r.status === 'Borrador';
                    return (
                      <tr
                        key={r.id}
                        className="border-t border-[--color-border] hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <td className="p-2">{r.employeeName}</td>
                        <td className="p-2">{r.period}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              isDraft
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                                : 'bg-green-500/15 text-green-600 dark:text-green-400'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-2">{formatMoney(r.baseSalary)}</td>
                        <td className="p-2">{formatMoney(net)}</td>
                        <td className="p-2">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2 justify-end">
                            {isDraft && (
                              <button
                                className="btn"
                                onClick={() => {
                                  if (confirmApprove()) onApprove(r.id);
                                }}
                              >
                                Aprobar
                              </button>
                            )}
                            <button
                              className="btn"
                              onClick={() => {
                                // Para local, duplicamos (edición local no implementada)
                                setForm({
                                  employeeId: r.employeeId,
                                  employeeName: r.employeeName,
                                  period: r.period,
                                  baseSalary: r.baseSalary,
                                  bonuses: r.bonuses,
                                  overtimeHours: r.overtimeHours,
                                  overtimeRate: r.overtimeRate,
                                  deductions: r.deductions,
                                  taxRate: r.taxRate,
                                  contributionsRate: r.contributionsRate,
                                });
                                setConcepts(r.concepts ?? []);
                                editIdRef.current = undefined;
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setToast('Cargada en formulario para duplicar');
                              }}
                            >
                              Duplicar
                            </button>
                            <button
                              className="btn"
                              disabled={!canMutate(r.status)}
                              onClick={() => {
                                onDelete(r.id);
                              }}
                            >
                              Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

              {/* Empty state */}
              {(useApi ? (qApi.data?.items?.length ?? 0) : localRows.length) === 0 && (
                <tr>
                  <td className="p-6 text-center text-zinc-500" colSpan={7}>
                    No hay registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación (solo servidor) */}
        {useApi && (
          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              className="btn"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </button>
            <span className="text-xs text-zinc-500">
              Página {page + 1} · Total {qApi.data?.total ?? 0}
            </span>
            <button
              className="btn"
              disabled={(page + 1) * pageSize >= (qApi.data?.total ?? 0)}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/* ===== UI helpers ===== */
function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
      <div className="text-[11px] text-[--color-muted]">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

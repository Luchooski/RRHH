import { useMemo, useState } from 'react';
import { useListPayrolls, useGetPayroll, useCreatePayroll, useUpdatePayroll, useUpdateStatus } from './hooks';
import type { Payroll, ListOut } from './dto';
import PayrollDetailDrawer from './PayrollDetailDrawer';
import PayrollFormModal from './PayrollFormModal';
import { StatusBadge } from './StatusBadge';
import { toCsv, downloadCsv } from './csv';

type Tab = 'Todos'|'pendiente'|'aprobada'|'pagada'|'anulada';

export default function PayrollPage() {
  const [query, setQuery] = useState<{ q?:string; period?:string; status?:Tab; limit:number; skip:number }>({ limit:20, skip:0 });
  const [active, setActive] = useState<Tab>('Todos');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Payroll | undefined>();

  const { data, isLoading } = useListPayrolls({ ...query, status: active==='Todos'? undefined : active });
  const detail = useGetPayroll(selectedId);
  const createMut = useCreatePayroll();
  const updateMut = useUpdatePayroll();
  const statusMut = useUpdateStatus();

  const kpis = useMemo(() => {
    const items: Payroll[] = data?.items ?? [];
    return {
      count: items.length,
      gross: items.reduce((a,b)=>a + b.grossTotal, 0),
      net: items.reduce((a,b)=>a + b.netTotal, 0),
    };
  }, [data]);

  const exportar = () => {
    const csv = toCsv((data as ListOut|undefined)?.items ?? []);
    downloadCsv(`liquidaciones_${new Date().toISOString().slice(0,10)}.csv`, csv);
  };

  const onCreate = (payload: any) => {
    createMut.mutate(payload, { onSuccess: () => setFormOpen(false) });
  };
  const onEdit = (payload: any) => {
    if (!editRow) return;
    updateMut.mutate({ id: editRow.id, payload }, { onSuccess: () => { setFormOpen(false); setEditRow(undefined); } });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Liquidaciones</h1>
        <button className="ml-auto border rounded-lg px-3 py-2" onClick={()=>{ setEditRow(undefined); setFormOpen(true); }}>Nueva</button>
        <button className="border rounded-lg px-3 py-2" onClick={exportar}>Exportar CSV</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Kpi title="Cantidad" value={String(kpis.count)} />
        <Kpi title="Bruto total" value={kpis.gross.toLocaleString()} />
        <Kpi title="Neto total" value={kpis.net.toLocaleString()} />
      </div>

      <div className="flex items-center gap-2">
        <input className="border rounded-lg px-3 py-2" placeholder="Buscar texto"
          onChange={(e)=>setQuery(q=>({ ...q, q:e.target.value, skip:0 }))} />
        <input className="border rounded-lg px-3 py-2" placeholder="Período YYYY-MM"
          onChange={(e)=>setQuery(q=>({ ...q, period:e.target.value, skip:0 }))} />
      </div>

      <div className="flex gap-2">
        {(['Todos','pendiente','aprobada','pagada','anulada'] as Tab[]).map(s => (
          <button key={s}
            className={`px-3 py-2 rounded-full border ${active===s? 'bg-gray-900 text-white':'bg-white'}`}
            onClick={() => setActive(s)}>{s}</button>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Empleado</Th><Th>Período</Th><Th>Estado</Th>
              <Th className="text-right">Bruto</Th><Th className="text-right">Deducciones</Th><Th className="text-right">Neto</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-6 text-center">Cargando…</td></tr>}
            {!isLoading && (data?.items ?? []).map(row => (
              <tr key={row.id} className="border-t hover:bg-gray-50">
                <Td>{row.employeeName}</Td>
                <Td>{row.period}</Td>
                <Td><StatusBadge status={row.status} /></Td>
                <Td className="text-right">{row.grossTotal.toLocaleString()}</Td>
                <Td className="text-right">{row.deductionsTotal.toLocaleString()}</Td>
                <Td className="text-right font-medium">{row.netTotal.toLocaleString()}</Td>
                <Td className="space-x-2">
                  <button className="underline" onClick={()=>setSelectedId(row.id)}>Ver</button>
                  <button className="underline" onClick={()=>{ setEditRow(row); setFormOpen(true); }}>Editar</button>
                  {row.status !== 'aprobada' && <button className="underline" onClick={()=>statusMut.mutate({ id: row.id, status: 'aprobada' })}>Aprobar</button>}
                  {row.status !== 'pagada' && <button className="underline" onClick={()=>statusMut.mutate({ id: row.id, status: 'pagada' })}>Marcar pagada</button>}
                </Td>
              </tr>
            ))}
            {!isLoading && !(data?.items ?? []).length && (
              <tr><td colSpan={7} className="p-6 text-center">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <PayrollDetailDrawer open={!!selectedId} onClose={()=>setSelectedId(undefined)} data={detail.data} />
      <PayrollFormModal
        open={formOpen}
        onClose={()=>{ setFormOpen(false); setEditRow(undefined); }}
        initial={editRow}
        onSubmit={editRow ? onEdit : onCreate}
      />
    </div>
  );
}

function Th({ children, className = '' }: any) { return <th className={`text-left p-3 ${className}`}>{children}</th>; }
function Td({ children, className = '' }: any) { return <td className={`p-3 ${className}`}>{children}</td>; }
function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl p-4 shadow-sm border">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { Payroll } from './dto';

type ConceptRow = { code: string; label: string; type: 'remunerativo'|'no_remunerativo'|'indemnizacion'; amount: number; taxable: boolean };
type DeductionRow = { code: string; label: string; amount: number };

type Props = {
  open: boolean; onClose: () => void;
  initial?: Partial<Payroll>;
  onSubmit: (payload: any) => void;
};

export default function PayrollFormModal({ open, onClose, initial, onSubmit }: Props) {
  const [employeeId, setEmployeeId] = useState(initial?.employeeId ?? '');
  const [employeeName, setEmployeeName] = useState(initial?.employeeName ?? '');
  const [period, setPeriod] = useState(initial?.period ?? '');
  const [baseSalary, setBaseSalary] = useState(initial?.baseSalary ?? 0);
  const [currency, setCurrency] = useState(initial?.currency ?? 'ARS');
  const [concepts, setConcepts] = useState<ConceptRow[]>(initial?.concepts as any ?? []);
  const [deductions, setDeductions] = useState<DeductionRow[]>(initial?.deductions as any ?? []);
  const [type, setType] = useState<Payroll['type']>(initial?.type ?? 'mensual');

  useEffect(() => {
    if (!open) return;
    setEmployeeId(initial?.employeeId ?? ''); setEmployeeName(initial?.employeeName ?? '');
    setPeriod(initial?.period ?? ''); setBaseSalary(initial?.baseSalary ?? 0);
    setCurrency(initial?.currency ?? 'ARS'); setConcepts((initial?.concepts as any) ?? []);
    setDeductions((initial?.deductions as any) ?? []); setType(initial?.type ?? 'mensual');
  }, [open]);

  if (!open) return null;

  const addConcept = () => setConcepts(s => [...s, { code:'', label:'', type:'remunerativo', amount:0, taxable:true }]);
  const rmConcept = (i:number) => setConcepts(s => s.filter((_,idx)=>idx!==i));
  const addDed = () => setDeductions(s => [...s, { code:'', label:'', amount:0 }]);
  const rmDed = (i:number) => setDeductions(s => s.filter((_,idx)=>idx!==i));

  const submit = () => {
    onSubmit({
      employeeId, employeeName, period, baseSalary, currency, type,
      concepts, deductions,
    });
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30 z-50">
      <div className="absolute inset-x-0 top-10 mx-auto w-full max-w-3xl bg-white rounded-2xl p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{initial?.id ? 'Editar liquidación' : 'Nueva liquidación'}</h2>
          <button onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded p-2" placeholder="ID empleado" value={employeeId} onChange={e=>setEmployeeId(e.target.value)} />
          <input className="border rounded p-2" placeholder="Nombre empleado" value={employeeName} onChange={e=>setEmployeeName(e.target.value)} />
          <input className="border rounded p-2" placeholder="Periodo YYYY-MM" value={period} onChange={e=>setPeriod(e.target.value)} />
          <select className="border rounded p-2" value={type} onChange={e=>setType(e.target.value as any)}>
            <option value="mensual">Mensual</option><option value="final">Final</option>
            <option value="extraordinaria">Extraordinaria</option><option value="vacaciones">Vacaciones</option>
          </select>
          <input className="border rounded p-2" type="number" placeholder="Sueldo básico" value={baseSalary} onChange={e=>setBaseSalary(Number(e.target.value))} />
          <input className="border rounded p-2" placeholder="Moneda" value={currency} onChange={e=>setCurrency(e.target.value)} />
        </div>

        <h3 className="mt-4 font-semibold">Conceptos</h3>
        <table className="w-full text-sm"><thead><tr>
          <th className="text-left">Código</th><th className="text-left">Descripción</th><th>Tipo</th><th>Monto</th><th>Imponible</th><th></th>
        </tr></thead><tbody>
          {concepts.map((c,i)=>(
            <tr key={i} className="border-t">
              <td><input className="w-full p-1" value={c.code} onChange={e=>setConcepts(s=>s.map((x,idx)=>idx===i?{...x,code:e.target.value}:x))} /></td>
              <td><input className="w-full p-1" value={c.label} onChange={e=>setConcepts(s=>s.map((x,idx)=>idx===i?{...x,label:e.target.value}:x))} /></td>
              <td>
                <select className="p-1" value={c.type} onChange={e=>setConcepts(s=>s.map((x,idx)=>idx===i?{...x,type:e.target.value as any}:x))}>
                  <option value="remunerativo">Remunerativo</option>
                  <option value="no_remunerativo">No remunerativo</option>
                  <option value="indemnizacion">Indemnización</option>
                </select>
              </td>
              <td><input className="w-full p-1" type="number" value={c.amount} onChange={e=>setConcepts(s=>s.map((x,idx)=>idx===i?{...x,amount:Number(e.target.value)}:x))} /></td>
              <td className="text-center"><input type="checkbox" checked={c.taxable} onChange={e=>setConcepts(s=>s.map((x,idx)=>idx===i?{...x,taxable:e.target.checked}:x))} /></td>
              <td><button className="underline" onClick={()=>rmConcept(i)}>Quitar</button></td>
            </tr>
          ))}
        </tbody></table>
        <button className="mt-2 text-sm underline" onClick={addConcept}>+ Agregar concepto</button>

        <h3 className="mt-4 font-semibold">Deducciones</h3>
        <table className="w-full text-sm"><thead><tr>
          <th className="text-left">Código</th><th className="text-left">Descripción</th><th>Monto</th><th></th>
        </tr></thead><tbody>
          {deductions.map((d,i)=>(
            <tr key={i} className="border-t">
              <td><input className="w-full p-1" value={d.code} onChange={e=>setDeductions(s=>s.map((x,idx)=>idx===i?{...x,code:e.target.value}:x))} /></td>
              <td><input className="w-full p-1" value={d.label} onChange={e=>setDeductions(s=>s.map((x,idx)=>idx===i?{...x,label:e.target.value}:x))} /></td>
              <td><input className="w-full p-1" type="number" value={d.amount} onChange={e=>setDeductions(s=>s.map((x,idx)=>idx===i?{...x,amount:Number(e.target.value)}:x))} /></td>
              <td><button className="underline" onClick={()=>rmDed(i)}>Quitar</button></td>
            </tr>
          ))}
        </tbody></table>
        <button className="mt-2 text-sm underline" onClick={addDed}>+ Agregar deducción</button>

        <div className="mt-6 flex justify-end gap-2">
          <button className="border rounded px-3 py-2" onClick={onClose}>Cancelar</button>
          <button className="border rounded px-3 py-2 bg-black text-white" onClick={submit}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

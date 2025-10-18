import { downloadReceiptPdf } from './hooks';
import type { Payroll } from './dto';

export default function PayrollDetailDrawer({ open, onClose, data }: { open:boolean; onClose:()=>void; data?: Payroll }) {
  if (!open || !data) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30">
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white p-6 overflow-y-auto">
        <button className="float-right" onClick={onClose} aria-label="Cerrar">✕</button>
        <h2 className="text-xl font-semibold mb-2">Liquidación de {data.employeeName}</h2>
        <p className="text-sm text-gray-600">Periodo: {data.period} — Estado: {data.status}</p>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <Kpi title="Bruto" value={`${data.currency} ${data.grossTotal.toLocaleString()}`} />
          <Kpi title="Deducciones" value={`${data.currency} ${data.deductionsTotal.toLocaleString()}`} />
          <Kpi title="Neto" value={`${data.currency} ${data.netTotal.toLocaleString()}`} />
        </div>

        <section className="mt-6">
          <h3 className="font-semibold">Conceptos</h3>
          <table className="w-full text-sm mt-2">
            <thead><tr><th className="text-left">Código</th><th className="text-left">Descripción</th><th>Tipo</th><th className="text-right">Monto</th></tr></thead>
            <tbody>
              {data.concepts.map((c, i) => (
                <tr key={i} className="border-t">
                  <td>{c.code}</td><td>{c.label}</td><td className="text-center">{c.type}</td>
                  <td className="text-right">{c.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6">
          <h3 className="font-semibold">Deducciones</h3>
          <table className="w-full text-sm mt-2">
            <thead><tr><th className="text-left">Código</th><th className="text-left">Descripción</th><th className="text-right">Monto</th></tr></thead>
            <tbody>
              {data.deductions.map((d, i) => (
                <tr key={i} className="border-t">
                  <td>{d.code}</td><td>{d.label}</td>
                  <td className="text-right">{d.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 text-sm text-gray-700">
          <p><strong>Método de pago:</strong> {data.paymentMethod ?? '—'}</p>
          <p><strong>Fecha de pago:</strong> {data.paymentDate ?? '—'}</p>
          {data.notes && <p className="mt-2"><strong>Notas:</strong> {data.notes}</p>}
        </section>

        <div className="mt-6 flex gap-2">
          <a className="border rounded px-3 py-2" onClick={()=>downloadReceiptPdf(data.id)} role="button">Descargar PDF</a>
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl p-4 shadow-sm border">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

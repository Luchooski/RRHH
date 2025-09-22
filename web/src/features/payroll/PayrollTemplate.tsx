import { forwardRef } from 'react';
import { formatMoney } from './utils';
import type { AppliedConcept } from './types';
// import type { Concept } from './schema'; // <- Descomentar si agregás el prop opcional `template`

type Props = {
  employeeName: string;
  period: string;
  baseSalary: number;
  bonuses: number;
  overtimeAmount: number;
  deductions: number;     // manuales + conceptos deducciones
  taxes: number;
  contributions: number;
  gross: number;
  net: number;
  applied: AppliedConcept[]; // ✅ resultado aplicado (id, name, type, amount, details?)
  // template?: Concept[];   // ← opcional: definición/config original si querés mostrarla aparte
};

// Permitimos que el padre tome ref del contenedor para exportar a PDF
const PayrollTemplate = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const {
    employeeName,
    period,
    baseSalary,
    bonuses,
    overtimeAmount,
    deductions,
    taxes,
    contributions,
    gross,
    net,
    applied,
    // template
  } = props;

  return (
    <section ref={ref} className="card p-4 sm:p-6 space-y-4">
      <header className="text-center space-y-1">
        <h3 className="text-base font-semibold">Recibo de haberes</h3>
        <p className="text-xs text-[--color-muted]">
          {employeeName} — Período {period}
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Item label="Sueldo base" value={formatMoney(baseSalary)} />
        <Item label="Bonos" value={formatMoney(bonuses)} />
        <Item label="Horas extra" value={formatMoney(overtimeAmount)} />
        <Item label="Deducciones" value={formatMoney(deductions)} />
        <Item label="Impuestos" value={formatMoney(taxes)} />
        <Item label="Aportes" value={formatMoney(contributions)} />
        <div className="md:col-span-3 p-3 rounded-xl bg-black/5 dark:bg-white/5">
          <div className="text-[11px] text-[--color-muted]">Bruto</div>
          <div className="text-base font-semibold">{formatMoney(gross)}</div>
        </div>
        <div className="md:col-span-3 p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10">
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300">Neto</div>
          <div className="text-base font-semibold">{formatMoney(net)}</div>
        </div>
      </div>

      {applied.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium">Conceptos aplicados</div>
          <ul className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
            {applied.map((c) => {
              const isDeduction = c.type === 'deduccion';
              const sign = isDeduction ? '-' : '+';
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between border rounded-lg p-2 border-[--color-border]"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="font-mono">
                    {sign}{formatMoney(Math.abs(c.amount))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
});
PayrollTemplate.displayName = 'PayrollTemplate';

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
      <div className="text-[11px] text-[--color-muted]">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

export default PayrollTemplate;

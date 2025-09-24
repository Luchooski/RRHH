// api/src/modules/payroll/payroll.calc.ts
export type ConceptInput = {
  id: string;
  name: string;
  type: 'remunerativo' | 'no_remunerativo' | 'deduccion';
  mode: 'monto' | 'porcentaje';
  value: number;
};

export type PayrollBase = {
  baseSalary: number;
  bonuses?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  deductions?: number;
  taxRate?: number;           // %
  contributionsRate?: number; // %
  concepts?: ConceptInput[];
};

export type Derived = {
  overtimeAmount: number;
  gross: number;
  nonRemuneratives: number;
  taxes: number;
  contributions: number;
  conceptsDeductions: number;
  net: number;
};

export function computeDerived(p: PayrollBase): Derived {
  const bonuses = p.bonuses ?? 0;
  const overtimeHours = p.overtimeHours ?? 0;
  const overtimeRate = p.overtimeRate ?? 0;
  const deductions = p.deductions ?? 0;
  const taxRate = p.taxRate ?? 0;
  const contributionsRate = p.contributionsRate ?? 0;
  const concepts = p.concepts ?? [];

  const overtimeAmount = overtimeHours * overtimeRate;

  // Partimos de lo básico
  let gross = p.baseSalary + bonuses + overtimeAmount;
  let nonRemuneratives = 0;
  let conceptsDeductions = 0;

  // Aplicamos conceptos simples (MVP)
  for (const c of concepts) {
    const amt =
      c.mode === 'monto'
        ? c.value
        : (gross * c.value) / 100; // porcentaje sobre bruto actual (MVP)
    if (c.type === 'remunerativo') gross += amt;
    else if (c.type === 'no_remunerativo') nonRemuneratives += amt;
    else if (c.type === 'deduccion') conceptsDeductions += amt;
  }

  const taxes = (gross * taxRate) / 100;
  const contributions = (gross * contributionsRate) / 100;

  const net = gross + nonRemuneratives - deductions - conceptsDeductions - taxes - contributions;

  return { overtimeAmount, gross, nonRemuneratives, taxes, contributions, conceptsDeductions, net };
}

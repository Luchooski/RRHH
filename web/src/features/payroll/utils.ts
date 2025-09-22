import type { PayrollInput, Concept } from './schema';

export type AppliedConcept = {
  id: string;
  name: string;
  type: Concept['type'];
  phase?: Concept['phase'];
  amount: number;
};

export type PayrollCalc = {
  taxableBase: number;
  nonRemuneratives: number;
  conceptsDeductions: number;
  gross: number;
  taxes: number;
  contributions: number;
  net: number;
  overtimeAmount: number;
  applied: AppliedConcept[]; // NUEVO: desglose
};

export function computePayroll(input: PayrollInput, concepts: Concept[] = []): PayrollCalc {
  const applied: AppliedConcept[] = [];
  const overtimeAmount = input.overtimeHours * input.overtimeRate;

  let taxableBase = input.baseSalary + input.bonuses + overtimeAmount;
  let nonRem = 0;

  // remunerativos / no remunerativos
  for (const c of concepts.filter(c => c.enabled !== false)) {
    if (c.type === 'remunerativo') {
      const add = amountFrom(c, taxableBase);
      taxableBase += add;
      applied.push({ id: c.id, name: c.name, type: c.type, amount: round2(add) });
    } else if (c.type === 'no_remunerativo') {
      const add = amountFrom(c, taxableBase);
      nonRem += add;
      applied.push({ id: c.id, name: c.name, type: c.type, amount: round2(add) });
    }
  }

  // pre-tax deductions
  let preDed = 0;
  const preList = concepts
    .filter(c => c.enabled !== false && c.type === 'deduccion' && (c.phase ?? 'pre_tax') === 'pre_tax')
    .sort((a,b) => (a.priority ?? 100) - (b.priority ?? 100));
  for (const d of preList) {
    const base = baseFor(d, {
      taxableBase, nonRem, input, overtimeAmount,
      grossBefore: taxableBase + nonRem - input.deductions - preDed
    });
    let amt = amountFrom(d, base);
    amt = clampAndRound(amt, d);
    preDed += amt;
    applied.push({ id: d.id, name: d.name, type: d.type, phase: 'pre_tax', amount: round2(-amt) });
  }

  const grossBefore = taxableBase + nonRem - input.deductions - preDed;

  const taxes = round2((taxableBase * input.taxRate) / 100);
  const contributions = round2((taxableBase * input.contributionsRate) / 100);

  // post-tax deductions
  let postDed = 0;
  const postList = concepts
    .filter(c => c.enabled !== false && c.type === 'deduccion' && (c.phase ?? 'pre_tax') === 'post_tax')
    .sort((a,b) => (a.priority ?? 100) - (b.priority ?? 100));
  for (const d of postList) {
    const netPrev = grossBefore - taxes - contributions - postDed;
    const base = baseFor(d, { taxableBase, nonRem, input, overtimeAmount, grossBefore, netPrev });
    let amt = amountFrom(d, base);
    amt = clampAndRound(amt, d);
    postDed += amt;
    applied.push({ id: d.id, name: d.name, type: d.type, phase: 'post_tax', amount: round2(-amt) });
  }

  const gross = round2(grossBefore);
  const net = round2(grossBefore - taxes - contributions - postDed);

  return {
    taxableBase: round2(taxableBase),
    nonRemuneratives: round2(nonRem),
    conceptsDeductions: round2(preDed + postDed),
    gross,
    taxes,
    contributions,
    net,
    overtimeAmount: round2(overtimeAmount),
    applied
  };
}

/* helpers */
function amountFrom(c: Concept, base: number): number {
  return c.mode === 'monto' ? c.value : (base * c.value) / 100;
}
function baseFor(
  c: Concept,
  ctx: { taxableBase: number; nonRem: number; input: PayrollInput; overtimeAmount: number; grossBefore: number; netPrev?: number; }
): number {
  const b = c.base ?? 'imponible';
  if (b === 'imponible') return ctx.taxableBase;
  if (b === 'bruto') return ctx.grossBefore;
  if (b === 'neto_previo') {
    const taxes = (ctx.taxableBase * ctx.input.taxRate) / 100;
    const contrib = (ctx.taxableBase * ctx.input.contributionsRate) / 100;
    return ctx.netPrev ?? (ctx.grossBefore - taxes - contrib);
  }
  return c.customBase ?? 0;
}
function clampAndRound(n: number, c: Concept): number {
  let x = n;
  if (typeof c.minAmount === 'number') x = Math.max(x, c.minAmount);
  if (typeof c.maxAmount === 'number') x = Math.min(x, c.maxAmount);
  const d = c.roundDecimals ?? 2;
  switch (c.roundMode ?? 'nearest') {
    case 'none': return x;
    case 'down': return roundDown(x, d);
    case 'up': return roundUp(x, d);
    default: return roundN(x, d);
  }
}
export function round2(n: number): number { return roundN(n, 2); }
function roundN(n: number, d: number) { const f = 10 ** d; return Math.round(n * f) / f; }
function roundDown(n: number, d: number) { const f = 10 ** d; return Math.floor(n * f) / f; }
function roundUp(n: number, d: number) { const f = 10 ** d; return Math.ceil(n * f) / f; }

export function formatMoney(n: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(n);
}

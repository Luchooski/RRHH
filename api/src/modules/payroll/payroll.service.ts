import { FilterQuery } from 'mongoose';
import { PayrollModel, PayrollDoc, PayrollStatus } from './payroll.model.js';
import PDFDocument from 'pdfkit';
import type { FastifyReply } from 'fastify';

const mapStatusIn = (s?: PayrollStatus): PayrollStatus | undefined => {
  if (!s) return undefined;
  if (s === 'Borrador') return 'pendiente';
  if (s === 'Aprobado') return 'aprobada';
  return s;
};

const computeTotals = (input: any) => {
  const base = Number(input.baseSalary ?? 0);
  const concepts = Array.isArray(input.concepts) ? input.concepts : [];
  const deductions = Array.isArray(input.deductions) ? input.deductions : [];

  const grossFromConcepts = concepts.reduce((a: number, c: any) => a + Number(c.amount || 0), 0);
  const gross = base + grossFromConcepts;
  const ded = deductions.reduce((a: number, d: any) => a + Number(d.amount || 0), 0);
  const net = gross - ded;

  return { grossTotal: gross, deductionsTotal: ded, netTotal: net };
};

export async function listPayrolls(params: {
  tenantId: string; period?: string; employee?: string; status?: PayrollStatus; limit?: number; skip?: number;
}) {
  const { tenantId, period, employee, status } = params;
  const limit = Math.min(params.limit ?? 20, 100);
  const skip = params.skip ?? 0;

  const filter: FilterQuery<PayrollDoc> = { tenantId };
  if (period) filter.period = period;
  if (employee) filter.employeeId = employee;
  if (status) filter.status = mapStatusIn(status);

  const [items, total] = await Promise.all([
    PayrollModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PayrollModel.countDocuments(filter),
  ]);

  return { items, total, limit, skip };
}

export async function getById(id: string, tenantId: string) {
  return PayrollModel.findOne({ _id: id, tenantId }).lean();
}

export async function createPayroll(payload: any, tenantId: string) {
  const totals = computeTotals(payload);
  const doc = await PayrollModel.create({
    ...payload,
    tenantId,
    status: mapStatusIn(payload.status) ?? 'pendiente',
    currency: payload.currency ?? 'ARS',
    ...totals,
  });
  return doc.toObject();
}

export async function updateById(id: string, payload: any, tenantId: string) {
  const prev = await PayrollModel.findOne({ _id: id, tenantId });
  if (!prev) return null;
  const next = { ...prev.toObject(), ...payload };
  const totals = computeTotals(next);
  Object.assign(prev, payload, { status: mapStatusIn(payload.status) ?? prev.status, ...totals });
  await prev.save();
  return prev.toObject();
}

export async function removePayroll(id: string, tenantId: string) {
  await PayrollModel.findOneAndDelete({ _id: id, tenantId });
}

export async function approvePayroll(id: string, tenantId: string) {
  return updateStatus(id, 'aprobada', tenantId);
}

export async function updateStatus(id: string, status: PayrollStatus, tenantId: string) {
  const doc = await PayrollModel.findOne({ _id: id, tenantId });
  if (!doc) return null;
  doc.status = mapStatusIn(status) ?? doc.status;
  await doc.save();
  return doc.toObject();
}

// -------- PDF --------
export async function streamReceiptPdf(id: string, tenantId: string, reply: FastifyReply) {
  const doc = await PayrollModel.findOne({ _id: id, tenantId }).lean();
  if (!doc) return false;

  reply.header('Content-Type', 'application/pdf');
  reply.header('Content-Disposition', `inline; filename="recibo_${doc.employeeName}_${doc.period}.pdf"`);

  const pdf = new PDFDocument({ size: 'A4', margin: 50 });
  pdf.pipe(reply.raw);

  pdf.fontSize(16).text('Recibo de Liquidación', { align: 'center' }).moveDown();
  pdf.fontSize(12).text(`Empleado: ${doc.employeeName}`);
  pdf.text(`Periodo: ${doc.period}`);
  pdf.text(`Estado: ${doc.status}`);
  pdf.moveDown();

  pdf.text(`Sueldo básico: ${doc.currency} ${Number(doc.baseSalary).toLocaleString()}`);
  pdf.moveDown();

  pdf.text('Conceptos:');
  doc.concepts.forEach(c => {
    pdf.text(` - ${c.label} (${c.type}): ${doc.currency} ${Number(c.amount).toLocaleString()}`);
  });
  pdf.moveDown();

  pdf.text('Deducciones:');
  doc.deductions.forEach(d => {
    pdf.text(` - ${d.label}: ${doc.currency} ${Number(d.amount).toLocaleString()}`);
  });
  pdf.moveDown();

  pdf.text(`Bruto: ${doc.currency} ${Number(doc.grossTotal).toLocaleString()}`);
  pdf.text(`Deducciones: ${doc.currency} ${Number(doc.deductionsTotal).toLocaleString()}`);
  pdf.text(`Neto: ${doc.currency} ${Number(doc.netTotal).toLocaleString()}`);

  pdf.end();
  return true;
}

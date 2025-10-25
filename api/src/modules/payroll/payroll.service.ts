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

// -------- NEW: Auto-calculate & Batch Processing --------
import { Employee } from '../employee/employee.model.js';
import { calculatePayrollConcepts, calculateEmployerContributions } from './payroll-auto-calc.service.js';

/**
 * Crea una liquidación con cálculo automático de conceptos
 */
export async function createPayrollWithAutoCalc(params: {
  tenantId: string;
  employeeId: string;
  period: string;
  includeAutoCalc?: boolean;
  options?: any;
}) {
  const { tenantId, employeeId, period, includeAutoCalc = true, options = {} } = params;

  // Obtener datos del empleado
  const employee = await Employee.findOne({ _id: employeeId, tenantId }).lean();
  if (!employee) throw new Error('Employee not found');

  const baseSalary = employee.baseSalary || 0;
  const employeeName = employee.name;

  let concepts: any[] = [];
  let deductions: any[] = [];

  if (includeAutoCalc) {
    const autoCalc = await calculatePayrollConcepts(tenantId, employeeId, period, baseSalary, options);
    concepts = autoCalc.concepts;
    deductions = autoCalc.deductions;
  }

  const totals = computeTotals({ baseSalary, concepts, deductions });

  const doc = await PayrollModel.create({
    tenantId,
    employeeId,
    employeeName,
    period,
    type: 'mensual',
    status: 'pendiente',
    baseSalary,
    concepts,
    deductions,
    currency: 'ARS',
    ...totals,
  });

  return doc.toObject();
}

/**
 * Liquidación masiva: genera liquidaciones para múltiples empleados
 */
export async function batchCreatePayrolls(params: {
  tenantId: string;
  period: string;
  employeeIds?: string[]; // Si no se especifica, se procesan todos
  includeAutoCalc?: boolean;
  options?: any;
}) {
  const { tenantId, period, employeeIds, includeAutoCalc = true, options = {} } = params;

  // Obtener empleados
  const filter: any = { tenantId, status: 'active' };
  if (employeeIds && employeeIds.length > 0) {
    filter._id = { $in: employeeIds };
  }

  const employees = await Employee.find(filter).lean();

  const results = {
    total: employees.length,
    created: 0,
    errors: [] as Array<{ employeeId: string; employeeName: string; error: string }>,
    payrolls: [] as any[],
  };

  for (const employee of employees) {
    try {
      // Verificar si ya existe una liquidación para este empleado y período
      const existing = await PayrollModel.findOne({
        tenantId,
        employeeId: String(employee._id),
        period,
      });

      if (existing) {
        results.errors.push({
          employeeId: String(employee._id),
          employeeName: employee.name,
          error: 'Payroll already exists for this period',
        });
        continue;
      }

      const payroll = await createPayrollWithAutoCalc({
        tenantId,
        employeeId: String(employee._id),
        period,
        includeAutoCalc,
        options,
      });

      results.created++;
      results.payrolls.push(payroll);
    } catch (error: any) {
      results.errors.push({
        employeeId: String(employee._id),
        employeeName: employee.name,
        error: error.message || 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Reporte consolidado de nómina por período
 */
export async function getPayrollSummaryReport(params: {
  tenantId: string;
  period: string;
  groupBy?: 'department' | 'type' | 'none';
}) {
  const { tenantId, period, groupBy = 'none' } = params;

  const payrolls = await PayrollModel.find({ tenantId, period }).lean();

  if (groupBy === 'none') {
    const summary = {
      period,
      totalEmployees: payrolls.length,
      totalBaseSalary: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      byStatus: {} as any,
    };

    payrolls.forEach((p: any) => {
      summary.totalBaseSalary += p.baseSalary || 0;
      summary.totalGross += p.grossTotal || 0;
      summary.totalDeductions += p.deductionsTotal || 0;
      summary.totalNet += p.netTotal || 0;

      const status = p.status || 'pendiente';
      if (!summary.byStatus[status]) {
        summary.byStatus[status] = { count: 0, totalNet: 0 };
      }
      summary.byStatus[status].count++;
      summary.byStatus[status].totalNet += p.netTotal || 0;
    });

    return summary;
  }

  if (groupBy === 'department') {
    // Necesitamos joinear con Employee para obtener department
    const employeeIds = payrolls.map((p: any) => p.employeeId);
    const employees = await Employee.find({ _id: { $in: employeeIds }, tenantId }).lean();
    const empMap = new Map(employees.map((e: any) => [String(e._id), e]));

    const byDepartment: any = {};

    payrolls.forEach((p: any) => {
      const emp = empMap.get(p.employeeId);
      const dept = emp?.department || 'Sin departamento';

      if (!byDepartment[dept]) {
        byDepartment[dept] = {
          department: dept,
          totalEmployees: 0,
          totalBaseSalary: 0,
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
        };
      }

      byDepartment[dept].totalEmployees++;
      byDepartment[dept].totalBaseSalary += p.baseSalary || 0;
      byDepartment[dept].totalGross += p.grossTotal || 0;
      byDepartment[dept].totalDeductions += p.deductionsTotal || 0;
      byDepartment[dept].totalNet += p.netTotal || 0;
    });

    return {
      period,
      groupBy: 'department',
      groups: Object.values(byDepartment),
    };
  }

  if (groupBy === 'type') {
    const byType: any = {};

    payrolls.forEach((p: any) => {
      const type = p.type || 'mensual';

      if (!byType[type]) {
        byType[type] = {
          type,
          totalEmployees: 0,
          totalBaseSalary: 0,
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
        };
      }

      byType[type].totalEmployees++;
      byType[type].totalBaseSalary += p.baseSalary || 0;
      byType[type].totalGross += p.grossTotal || 0;
      byType[type].totalDeductions += p.deductionsTotal || 0;
      byType[type].totalNet += p.netTotal || 0;
    });

    return {
      period,
      groupBy: 'type',
      groups: Object.values(byType),
    };
  }
}

/**
 * Reporte de impuestos y contribuciones
 */
export async function getTaxesReport(params: {
  tenantId: string;
  period: string;
}) {
  const { tenantId, period } = params;

  const payrolls = await PayrollModel.find({ tenantId, period }).lean();

  const report = {
    period,
    totalEmployees: payrolls.length,
    employeeDeductions: {
      jubilacion: 0,
      ley19032: 0,
      obraSocial: 0,
      total: 0,
    },
    employerContributions: {
      jubilacion: 0,
      obraSocial: 0,
      pami: 0,
      art: 0,
      asignaciones: 0,
      benefits: 0,
      total: 0,
    },
    details: [] as any[],
  };

  for (const payroll of payrolls) {
    // Extraer deducciones del empleado
    const deductions = payroll.deductions || [];
    deductions.forEach((d: any) => {
      if (d.code === 'JUB') report.employeeDeductions.jubilacion += d.amount;
      if (d.code === 'LEY19032') report.employeeDeductions.ley19032 += d.amount;
      if (d.code === 'OS') report.employeeDeductions.obraSocial += d.amount;
    });

    // Calcular aportes patronales
    const employer = await calculateEmployerContributions(
      tenantId,
      payroll.employeeId,
      period,
      payroll.baseSalary
    );

    employer.contributions.forEach((c: any) => {
      if (c.code === 'CONT_JUB') report.employerContributions.jubilacion += c.amount;
      if (c.code === 'CONT_OS') report.employerContributions.obraSocial += c.amount;
      if (c.code === 'CONT_PAMI') report.employerContributions.pami += c.amount;
      if (c.code === 'CONT_ART') report.employerContributions.art += c.amount;
      if (c.code === 'CONT_ASIG') report.employerContributions.asignaciones += c.amount;
      if (c.code.startsWith('BCOST_')) report.employerContributions.benefits += c.amount;
    });

    report.details.push({
      employeeId: payroll.employeeId,
      employeeName: payroll.employeeName,
      baseSalary: payroll.baseSalary,
      employeeDeductions: deductions.filter((d: any) =>
        ['JUB', 'LEY19032', 'OS'].includes(d.code)
      ),
      employerContributions: employer.contributions,
    });
  }

  report.employeeDeductions.total =
    report.employeeDeductions.jubilacion +
    report.employeeDeductions.ley19032 +
    report.employeeDeductions.obraSocial;

  report.employerContributions.total =
    report.employerContributions.jubilacion +
    report.employerContributions.obraSocial +
    report.employerContributions.pami +
    report.employerContributions.art +
    report.employerContributions.asignaciones +
    report.employerContributions.benefits;

  return report;
}

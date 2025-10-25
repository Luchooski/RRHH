import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Employee } from '../employee/employee.model.js';
import { PayrollModel } from '../payroll/payroll.model.js';
import { streamReceiptPdf } from '../payroll/payroll.service.js';
import { listAttachments, getAttachmentFile } from '../attachment/attachment.service.js';

const ErrorDTO = z.object({ error: z.string() });

// Schema for employee profile
const EmployeeProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  baseSalary: z.number(),
  monthlyHours: z.number(),
  phone: z.string().optional(),
});

// Schema for payroll summary (list view)
const PayrollSummarySchema = z.object({
  id: z.string(),
  period: z.string(),
  type: z.enum(['mensual', 'final', 'extraordinaria', 'vacaciones']),
  status: z.string(),
  netTotal: z.number(),
  currency: z.string(),
  paymentDate: z.string().optional(),
  createdAt: z.string(),
});

const PayrollListSchema = z.object({
  items: z.array(PayrollSummarySchema),
  total: z.number(),
});

// Schema for payroll detail
const ConceptSchema = z.object({
  code: z.string(),
  label: z.string(),
  type: z.enum(['remunerativo', 'no_remunerativo', 'indemnizacion']),
  amount: z.number(),
  taxable: z.boolean(),
});

const DeductionSchema = z.object({
  code: z.string(),
  label: z.string(),
  amount: z.number(),
});

const PayrollDetailSchema = z.object({
  id: z.string(),
  employeeName: z.string(),
  period: z.string(),
  type: z.enum(['mensual', 'final', 'extraordinaria', 'vacaciones']),
  status: z.string(),
  baseSalary: z.number(),
  concepts: z.array(ConceptSchema),
  deductions: z.array(DeductionSchema),
  grossTotal: z.number(),
  deductionsTotal: z.number(),
  netTotal: z.number(),
  currency: z.string(),
  paymentMethod: z.enum(['transferencia', 'efectivo', 'cheque', 'otro']).optional(),
  bankAccount: z.string().optional(),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Schema for attachments
const FileTypeEnum = z.enum(['dni', 'cv', 'contract', 'certificate', 'photo', 'other']);

const AttachmentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  fileType: FileTypeEnum,
  mimeType: z.string(),
  size: z.number(),
  description: z.string().optional(),
  createdAt: z.string(),
});

const AttachmentListSchema = z.object({
  items: z.array(AttachmentSchema),
  total: z.number(),
});

// Middleware to verify employee role
function requireEmployeeRole(req: any, reply: any, done: any) {
  const user = (req as any).user;
  if (!user || user.role !== 'employee') {
    return reply.code(403).send({ error: 'Access denied. Employee role required.' });
  }
  done();
}

export const employeePortalRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // GET /employee-portal/profile - View personal profile
  r.route({
    method: 'GET',
    url: '/employee-portal/profile',
    onRequest: [app.authGuard, requireEmployeeRole],
    schema: {
      response: {
        200: EmployeeProfileSchema,
        404: ErrorDTO,
      },
    },
    handler: async (req, reply) => {
      const userEmail = (req as any).user.email;
      const tenantId = (req as any).user.tenantId;

      // Find employee by email and tenantId
      const employee = await Employee.findOne({ email: userEmail, tenantId }).lean();

      if (!employee) {
        return reply.code(404).send({ error: 'Employee profile not found' });
      }

      return {
        id: String(employee._id),
        name: employee.name,
        email: employee.email,
        role: employee.role,
        baseSalary: employee.baseSalary,
        monthlyHours: employee.monthlyHours,
        phone: employee.phone ?? undefined,
      };
    },
  });

  // GET /employee-portal/payrolls - List all payrolls for the employee
  r.route({
    method: 'GET',
    url: '/employee-portal/payrolls',
    onRequest: [app.authGuard, requireEmployeeRole],
    schema: {
      querystring: z.object({
        year: z.coerce.number().int().optional(),
        limit: z.coerce.number().int().positive().max(100).default(50),
        skip: z.coerce.number().int().min(0).default(0),
      }),
      response: {
        200: PayrollListSchema,
        404: ErrorDTO,
      },
    },
    handler: async (req, reply) => {
      const userEmail = (req as any).user.email;
      const tenantId = (req as any).user.tenantId;
      const { year, limit, skip } = req.query;

      // Find employee by email
      const employee = await Employee.findOne({ email: userEmail, tenantId }).lean();

      if (!employee) {
        return reply.code(404).send({ error: 'Employee not found' });
      }

      const employeeId = String(employee._id);

      // Build filter
      const filter: any = { tenantId, employeeId };
      if (year) {
        // Filter by year (period starts with YYYY)
        filter.period = new RegExp(`^${year}-`);
      }

      // Find payrolls
      const [items, total] = await Promise.all([
        PayrollModel.find(filter)
          .sort({ period: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PayrollModel.countDocuments(filter),
      ]);

      return {
        items: items.map(p => ({
          id: String(p._id),
          period: p.period,
          type: p.type,
          status: p.status,
          netTotal: p.netTotal,
          currency: p.currency,
          paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString() : undefined,
          createdAt: new Date(p.createdAt).toISOString(),
        })),
        total,
      };
    },
  });

  // GET /employee-portal/payrolls/:id - View payroll detail
  r.route({
    method: 'GET',
    url: '/employee-portal/payrolls/:id',
    onRequest: [app.authGuard, requireEmployeeRole],
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: PayrollDetailSchema,
        403: ErrorDTO,
        404: ErrorDTO,
      },
    },
    handler: async (req, reply) => {
      const userEmail = (req as any).user.email;
      const tenantId = (req as any).user.tenantId;
      const { id } = req.params;

      // Find employee
      const employee = await Employee.findOne({ email: userEmail, tenantId }).lean();

      if (!employee) {
        return reply.code(404).send({ error: 'Employee not found' });
      }

      const employeeId = String(employee._id);

      // Find payroll - ensure it belongs to this employee
      const payroll = await PayrollModel.findOne({
        _id: id,
        tenantId,
        employeeId
      }).lean();

      if (!payroll) {
        return reply.code(404).send({ error: 'Payroll not found or access denied' });
      }

      return {
        id: String(payroll._id),
        employeeName: payroll.employeeName,
        period: payroll.period,
        type: payroll.type,
        status: payroll.status,
        baseSalary: payroll.baseSalary,
        concepts: payroll.concepts,
        deductions: payroll.deductions,
        grossTotal: payroll.grossTotal,
        deductionsTotal: payroll.deductionsTotal,
        netTotal: payroll.netTotal,
        currency: payroll.currency,
        paymentMethod: payroll.paymentMethod,
        bankAccount: payroll.bankAccount,
        paymentDate: payroll.paymentDate ? new Date(payroll.paymentDate).toISOString() : undefined,
        notes: payroll.notes,
        createdAt: new Date(payroll.createdAt).toISOString(),
        updatedAt: new Date(payroll.updatedAt).toISOString(),
      };
    },
  });

  // GET /employee-portal/payrolls/:id/receipt.pdf - Download payroll PDF
  r.route({
    method: 'GET',
    url: '/employee-portal/payrolls/:id/receipt.pdf',
    onRequest: [app.authGuard, requireEmployeeRole],
    handler: async (req, reply) => {
      const userEmail = (req as any).user.email;
      const tenantId = (req as any).user.tenantId;
      const { id } = req.params as { id: string };

      // Find employee
      const employee = await Employee.findOne({ email: userEmail, tenantId }).lean();

      if (!employee) {
        return reply.code(404).send({ error: 'Employee not found' });
      }

      const employeeId = String(employee._id);

      // Verify that the payroll belongs to this employee
      const payroll = await PayrollModel.findOne({
        _id: id,
        tenantId,
        employeeId
      }).lean();

      if (!payroll) {
        return reply.code(404).send({ error: 'Payroll not found or access denied' });
      }

      // Stream the PDF
      const ok = await streamReceiptPdf(id, tenantId, reply);
      if (!ok) {
        return reply.code(404).send({ error: 'Could not generate PDF' });
      }

      return reply;
    },
  });

  // GET /employee-portal/attachments - List employee's own attachments
  r.route({
    method: 'GET',
    url: '/employee-portal/attachments',
    onRequest: [app.authGuard, requireEmployeeRole],
    schema: {
      querystring: z.object({
        fileType: FileTypeEnum.optional(),
      }),
      response: {
        200: AttachmentListSchema,
        404: ErrorDTO,
      },
    },
    handler: async (req, reply) => {
      const userEmail = (req as any).user.email;
      const tenantId = (req as any).user.tenantId;
      const { fileType } = req.query;

      // Find employee
      const employee = await Employee.findOne({ email: userEmail, tenantId }).lean();

      if (!employee) {
        return reply.code(404).send({ error: 'Employee not found' });
      }

      const employeeId = String(employee._id);

      // List attachments
      const attachments = await listAttachments(tenantId, employeeId, fileType);

      return {
        items: attachments.map(a => ({
          id: String(a._id),
          filename: a.filename,
          fileType: a.fileType as any,
          mimeType: a.mimeType,
          size: a.size,
          description: a.description ?? undefined,
          createdAt: new Date(a.createdAt).toISOString(),
        })),
        total: attachments.length,
      };
    },
  });

  // GET /employee-portal/attachments/:id/download - Download attachment
  r.route({
    method: 'GET',
    url: '/employee-portal/attachments/:id/download',
    onRequest: [app.authGuard, requireEmployeeRole],
    schema: {
      params: z.object({ id: z.string() }),
    },
    handler: async (req, reply) => {
      const userEmail = (req as any).user.email;
      const tenantId = (req as any).user.tenantId;
      const { id } = req.params;

      // Find employee
      const employee = await Employee.findOne({ email: userEmail, tenantId }).lean();

      if (!employee) {
        return reply.code(404).send({ error: 'Employee not found' });
      }

      const employeeId = String(employee._id);

      // Verify attachment belongs to this employee
      const { Attachment } = await import('../attachment/attachment.model.js');
      const attachment = await Attachment.findOne({
        _id: id,
        tenantId,
        employeeId
      }).lean();

      if (!attachment) {
        return reply.code(404).send({ error: 'Attachment not found or access denied' });
      }

      // Download file
      const file = await getAttachmentFile(id, tenantId);

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      reply.header('Content-Type', file.mimeType);
      reply.header('Content-Disposition', `attachment; filename="${file.filename}"`);
      return reply.send(file.buffer);
    },
  });
};

export default employeePortalRoutes;

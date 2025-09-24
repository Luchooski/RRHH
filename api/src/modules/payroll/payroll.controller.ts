import { FastifyReply, FastifyRequest } from 'fastify';
import {
  PayrollInputDTO,
  PayrollDTO,
  ListQueryDTO,
  IdParamDTO,
  PayrollUpdateDTO,
  BulkCreateDTO,
  ExportQueryDTO
} from './payroll.dto.js';
import {
  createPayroll,
  listPayrolls,
  approvePayroll,
  removePayroll,
  getById,
  updateById,
  bulkCreate,
  exportCSV
} from './payroll.service.js';
import { ok } from '../../utils/http.js';
import { Payroll } from './payroll.model.js';
import { isValidObjectId } from 'mongoose';

import { format } from '@fast-csv/format';
import { computeDerived } from './payroll.calc.js';

/** Crear */
export async function postCreate(req: FastifyRequest, reply: FastifyReply) {
  const parsed = PayrollInputDTO.safeParse(req.body);
  if (!parsed.success) {
    return reply
      .status(400)
      .send({ error: { code: 'ValidationError', message: 'Invalid body', details: parsed.error.issues } });
  }
  const created = await createPayroll({ ...parsed.data, status: 'Borrador' } as any);
  const out = PayrollDTO.parse({
    ...created.toObject(),
    id: String(created._id),
    createdAt: created.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: created.updatedAt?.toISOString?.() ?? new Date().toISOString()
  });
  return reply.status(201).send(ok(out));
}

/** Listar */
export async function getList(req: FastifyRequest, reply: FastifyReply) {
  const parsed = ListQueryDTO.safeParse(req.query);
  if (!parsed.success) {
    return reply.status(400).send({
      error: { code: 'BAD_REQUEST', message: 'Invalid query', details: parsed.error.flatten() },
    });
  }
  const { period, employee, status, limit = 20, skip = 0 } = parsed.data;

  const filter: Record<string, any> = {};
  if (period) filter.period = period;
  if (employee) filter.employeeId = employee;
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Payroll.find(filter)
      .sort({ period: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Payroll.countDocuments(filter),
  ]);

  return reply.send({ items, total });
}

/** Aprobar */
export async function patchApprove(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = req.params;

  // 1) Validación fuerte del id
  if (!isValidObjectId(id)) {
    return reply.status(400).send({
      error: { code: 'ValidationError', message: 'Invalid ObjectId' }
    });
  }

  try {
    // 2) Update a prueba de CastError
    const res = await Payroll.updateOne(
      { _id: id },
      { $set: { status: 'Aprobado', updatedAt: new Date() } }
    );

    // 3) No encontrado
    if (!res.matchedCount) {
      return reply.status(404).send({
        error: { code: 'NotFound', message: 'Liquidación no encontrada' }
      });
    }

    // 4) OK
    return reply.send({ data: { id, status: 'Aprobado' } });
  } catch (e: any) {
    // Log útil para depurar si algo raro pasa
    req.log.error({ err: e }, 'approve error');
    return reply.status(500).send({
      error: { code: 'InternalError', message: 'Unexpected error approving payroll' }
    });
  }
}


/** Eliminar */
export async function delRemove(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  await removePayroll(id);
  return reply.status(204).send();
}

/** Obtener por ID */
export async function getByIdCtrl(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const p = IdParamDTO.safeParse(req.params);
  if (!p.success) {
    return reply.status(400).send({ error: { code: 'ValidationError', message: 'Invalid id', details: p.error.issues } });
  }
  const doc = await getById(p.data.id);
  if (!doc) {
    return reply.status(404).send({ error: { code: 'NotFound', message: 'Liquidación no encontrada' } });
  }
  return reply.send(
    ok(
      PayrollDTO.parse({
        ...doc,
        id: String(doc._id),
        createdAt: doc.createdAt?.toISOString?.() ?? '',
        updatedAt: doc.updatedAt?.toISOString?.() ?? ''
      })
    )
  );
}

/** Actualizar por ID (PUT) */
export async function putUpdateCtrl(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const p = IdParamDTO.safeParse(req.params);
  if (!p.success) {
    return reply.status(400).send({ error: { code: 'ValidationError', message: 'Invalid id', details: p.error.issues } });
  }
  const body = PayrollUpdateDTO.safeParse(req.body);
  if (!body.success) {
    return reply.status(400).send({ error: { code: 'ValidationError', message: 'Invalid body', details: body.error.issues } });
  }
  const updated = await updateById(p.data.id, body.data as any);
  if (!updated) {
    return reply.status(404).send({ error: { code: 'NotFound', message: 'Liquidación no encontrada' } });
  }
  return reply.send(
    ok(
      PayrollDTO.parse({
        ...updated,
        id: String(updated._id),
        createdAt: updated.createdAt?.toISOString?.() ?? '',
        updatedAt: updated.updatedAt?.toISOString?.() ?? ''
      })
    )
  );
}

/** Bulk create */
export async function postBulkCreateCtrl(req: FastifyRequest, reply: FastifyReply) {
  const body = BulkCreateDTO.safeParse(req.body);
  if (!body.success) {
    return reply.status(400).send({ error: { code: 'ValidationError', message: 'Invalid body', details: body.error.issues } });
  }
  const count = await bulkCreate(body.data);
  return reply.status(201).send(ok({ created: count }));
}

/** Export CSV */
export async function getExportCsvCtrl(req: FastifyRequest, reply: FastifyReply) {
  const parsed = ExportQueryDTO.safeParse(req.query);
  if (!parsed.success) {
    return reply.status(400).send({
      error: { code: 'BAD_REQUEST', message: 'Invalid query', details: parsed.error.flatten() },
    });
  }
  const { period, employee, status, limit, skip } = parsed.data;

  // Filtros (mismos que listado; exporta todo si no pasan limit/skip)
  const filter: Record<string, any> = {};
  if (period) filter.period = period;
  if (employee) filter.employeeId = employee;
  if (status) filter.status = status;

  reply.header('Content-Type', 'text/csv; charset=utf-8');
  reply.header('Content-Disposition', `attachment; filename="payrolls${period ? '_' + period : ''}.csv"`);

  const stream = format({ headers: true });
  stream.pipe(reply.raw);

  // Si nos pasan limit/skip, respetar; si no, stream de todo el filtro
  const q = Payroll.find(filter).sort({ period: -1, createdAt: -1 }).lean({ virtuals: true });
  if (typeof skip === 'number') q.skip(skip);
  if (typeof limit === 'number') q.limit(limit);

  const cursor = q.cursor();
  for await (const doc of cursor) {
    const d = computeDerived({
      baseSalary: doc.baseSalary,
      bonuses: doc.bonuses,
      overtimeHours: doc.overtimeHours,
      overtimeRate: doc.overtimeRate,
      deductions: doc.deductions,
      taxRate: doc.taxRate,
      contributionsRate: doc.contributionsRate,
      concepts: (doc.concepts ?? []).map((c: any) => ({
        id: c.id, name: c.name, type: c.type, mode: c.mode, value: c.value,
      })),
    });

    stream.write({
      id: doc._id,
      employeeId: doc.employeeId,
      employeeName: doc.employeeName,
      period: doc.period,
      baseSalary: doc.baseSalary,
      bonuses: doc.bonuses ?? 0,
      overtimeHours: doc.overtimeHours ?? 0,
      overtimeRate: doc.overtimeRate ?? 0,
      overtimeAmount: d.overtimeAmount,
      deductions: doc.deductions ?? 0,
      taxRate: doc.taxRate ?? 0,
      contributionsRate: doc.contributionsRate ?? 0,
      gross: d.gross,
      nonRemuneratives: d.nonRemuneratives,
      taxes: d.taxes,
      contributions: d.contributions,
      conceptsDeductions: d.conceptsDeductions,
      net: d.net,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
  stream.end();
}

/** ====== OPCIONAL: endpoints por employeeId + period ====== */

export async function getByEmployeeCtrl(
  req: FastifyRequest<{ Params: { employeeId: string }; Querystring: { period?: string } }>,
  reply: FastifyReply
) {
  const { employeeId } = req.params;
  const { period } = req.query;
  if (!period) {
    return reply.status(400).send({ error: { code: 'ValidationError', message: 'Falta period (YYYY-MM)' } });
  }
  const doc = await Payroll.findOne({ employeeId, period }).lean();
  if (!doc) {
    return reply.status(404).send({ error: { code: 'NotFound', message: 'No encontrado' } });
  }
  return reply.send(
    ok(
      PayrollDTO.parse({
        ...doc,
        id: String(doc._id),
        createdAt: doc.createdAt?.toISOString?.() ?? '',
        updatedAt: doc.updatedAt?.toISOString?.() ?? ''
      })
    )
  );
}

export async function putUpdateByEmployeeCtrl(
  req: FastifyRequest<{
    Params: { employeeId: string };
    Querystring: { period?: string };
  }>,
  reply: FastifyReply
) {
  const { employeeId } = req.params;
  const { period } = req.query;
  if (!period) {
    return reply.status(400).send({ error: { code: 'ValidationError', message: 'Falta period (YYYY-MM)' } });
  }
  const body = PayrollUpdateDTO.safeParse(req.body);
  if (!body.success) {
    return reply.status(400).send({ error: { code: 'ValidationError', message: 'Invalid body', details: body.error.issues } });
  }
  const updated = await Payroll.findOneAndUpdate(
    { employeeId, period },
    { $set: body.data },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) {
    return reply.status(404).send({ error: { code: 'NotFound', message: 'No encontrado' } });
  }
  return reply.send(
    ok(
      PayrollDTO.parse({
        ...updated,
        id: String(updated._id),
        createdAt: updated.createdAt?.toISOString?.() ?? '',
        updatedAt: updated.updatedAt?.toISOString?.() ?? ''
      })
    )
  );
}

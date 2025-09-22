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
    return reply
      .status(400)
      .send({ error: { code: 'ValidationError', message: 'Invalid query', details: parsed.error.issues } });
  }
  const { items, total } = await listPayrolls(parsed.data);
  const mapped = items.map((i) =>
    PayrollDTO.parse({
      ...i,
      id: String(i._id),
      createdAt: i.createdAt?.toISOString?.() ?? '',
      updatedAt: i.updatedAt?.toISOString?.() ?? ''
    })
  );
  return reply.send(ok({ items: mapped, total }));
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
  const q = ExportQueryDTO.safeParse(req.query);
  if (!q.success) {
    return reply
      .status(400)
      .send({ error: { code: 'ValidationError', message: 'Invalid query', details: q.error.issues } });
  }
  const csv = await exportCSV(q.data);
  reply.header('Content-Type', 'text/csv; charset=utf-8');
  reply.header('Content-Disposition', 'attachment; filename="payrolls.csv"');
  return reply.send(csv);
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

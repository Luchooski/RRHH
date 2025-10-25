import { Request, Response, NextFunction } from 'express';
import { PayrollCreateSchema, PayrollOutputSchema, PayrollQuerySchema, PayrollStatusSchema } from './payroll.dto.js';
import * as Service from './payroll.service.js';

const mapId = (d: any) => ({ ...d, id: d._id?.toString?.() ?? d.id });

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = PayrollQuerySchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId;
    const data = await Service.listPayrolls({ ...q, tenantId });
    const items = data.items.map(mapId).map(i => PayrollOutputSchema.parse({
      ...i, id: i._id?.toString?.() ?? i.id
    }));
    res.json({ items, total: data.total, limit: q.limit, skip: q.skip });
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).user?.tenantId;
    const doc = await Service.getById(req.params.id, tenantId);
    if (!doc) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Liquidación no encontrada' } });
    res.json(PayrollOutputSchema.parse(mapId(doc)));
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = PayrollCreateSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId;
    const created = await Service.createPayroll({ ...input, tenantId });
    res.status(201).json(PayrollOutputSchema.parse(mapId(created)));
  } catch (err) { next(err); }
}

export async function patchStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = PayrollStatusSchema.parse(req.body);
    const updated = await Service.updateStatus(req.params.id, status as any, (req as any).user?.email ?? 'api');
    if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Liquidación no encontrada' } });
    res.json(PayrollOutputSchema.parse(mapId(updated)));
  } catch (err) { next(err); }
}

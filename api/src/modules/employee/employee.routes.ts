// api/src/modules/employee/employee.routes.ts
import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Employee } from './employee.model.js'; // ajusta path

const EmployeeDTO = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  baseSalary: z.number(),
  monthlyHours: z.number(),
  phone: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ListOut = z.object({
  items: z.array(EmployeeDTO),
  total: z.number().int().nonnegative(),
});

function mapOut(doc: any) {
  return {
    id: String(doc.id ?? doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    baseSalary: doc.baseSalary,
    monthlyHours: doc.monthlyHours,
    phone: doc.phone,
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date(doc.createdAt).toISOString(),
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date(doc.updatedAt).toISOString(),
  };
}

const employeeRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.route({
    method: 'GET',
    url: '/employees',
    schema: { response: { 200: ListOut } },
    handler: async () => {
      const items = await Employee.find().sort({ createdAt: -1 }).lean({ virtuals: true });
      const total = await Employee.countDocuments({});
      return { items: items.map(mapOut), total };
    },
  });

  r.route({
    method: 'GET',
    url: '/employees/:id',
    schema: { response: { 200: EmployeeDTO, 404: z.object({ error: z.string() }) } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      if (!Types.ObjectId.isValid(id)) return reply.code(404).send({ error: 'Not found' });
      const found = await Employee.findById(id).lean({ virtuals: true });
      if (!found) return reply.code(404).send({ error: 'Not found' });
      return mapOut(found);
    },
  });

  r.route({
    method: 'POST',
    url: '/employees',
    schema: {
      body: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.string(),
        baseSalary: z.number().min(0),
        monthlyHours: z.number().min(0),
        phone: z.string().optional(),
      }),
      response: { 200: EmployeeDTO },
    },
    handler: async (req) => {
      const doc = await Employee.create(req.body);
      return mapOut(doc.toObject({ virtuals: true }));
    },
  });

  r.route({
    method: 'PATCH',
    url: '/employees/:id',
    schema: {
      body: EmployeeDTO.partial().omit({ id: true, createdAt: true, updatedAt: true }),
      response: { 200: EmployeeDTO, 404: z.object({ error: z.string() }) },
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      if (!Types.ObjectId.isValid(id)) return reply.code(404).send({ error: 'Not found' });
      const updated = await Employee.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true })
        .lean({ virtuals: true });
      if (!updated) return reply.code(404).send({ error: 'Not found' });
      return mapOut(updated);
    },
  });

  r.route({
    method: 'DELETE',
    url: '/employees/:id',
    schema: { response: { 200: z.object({ ok: z.boolean() }), 404: z.object({ error: z.string() }) } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      if (!Types.ObjectId.isValid(id)) return reply.code(404).send({ error: 'Not found' });
      const res = await Employee.findByIdAndDelete(id);
      if (!res) return reply.code(404).send({ error: 'Not found' });
      return { ok: true };
    },
  });
};

export { employeeRoutes };
export default employeeRoutes;

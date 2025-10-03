import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  listEmployees, getEmployeeById, createEmployee, updateEmployee, removeEmployee
} from './employee.service.js';

const Employee = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  phone: z.string().optional(),
  baseSalary: z.number().int().nonnegative(),
  monthlyHours: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CreateBody = Employee.omit({ id: true, createdAt: true, updatedAt: true });
const UpdateBody = CreateBody.partial();

const employeeRoutes: FastifyPluginAsync = async (app) => {
  // ⚠️ Tu frontend de Empleados espera un ARRAY (no paginado)
  app.get('/employees', {
    schema: { response: { 200: z.array(Employee) } },
    handler: async () => listEmployees(),
  });

  app.get('/employees/:id', {
    schema: { response: { 200: Employee } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const found = await getEmployeeById(id);
      if (!found) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Employee not found' } });
      return found;
    },
  });

  app.post('/employees', {
    schema: { body: CreateBody, response: { 201: Employee } },
    handler: async (req, reply) => {
      const created = await createEmployee(req.body as any);
      reply.code(201);
      return created;
    },
  });

  app.patch('/employees/:id', {
    schema: { body: UpdateBody, response: { 200: Employee } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const updated = await updateEmployee(id, req.body as any);
      if (!updated) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Employee not found' } });
      return updated;
    },
  });

  app.delete('/employees/:id', {
    schema: { response: { 200: z.object({ ok: z.boolean() }) } },
    handler: async (req) => {
      const { id } = req.params as { id: string };
      return removeEmployee(id);
    },
  });
};

export { employeeRoutes };
export default employeeRoutes;

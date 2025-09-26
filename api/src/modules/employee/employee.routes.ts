import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  EmployeeInputSchema,
  EmployeeOutputSchema,
  EmployeesListSchema
} from './employee.dto.js';
import { createEmployee, listEmployees } from './employee.service.js';
import { authGuard } from '../../middlewares/auth.js';

export async function employeeRoutes(app: FastifyInstance) {
  // Listado (requiere estar logueado)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v1/employees',
    schema: {
      querystring: z.object({
        limit: z.coerce.number().int().min(1).max(100).default(50),
        skip: z.coerce.number().int().min(0).default(0)
      }),
      response: { 200: EmployeesListSchema }
    },
    preHandler: authGuard(), // igual que otras áreas privadas
    handler: async (req) => {
      const { limit, skip } = req.query as { limit: number; skip: number };
      return listEmployees(limit, skip);
    }
  });

  // Alta (protegido)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/employees',
    schema: { body: EmployeeInputSchema, response: { 201: EmployeeOutputSchema } },
    preHandler: authGuard(),
    handler: async (req, reply) => {
      const body = req.body as z.infer<typeof EmployeeInputSchema>;
      const out = await createEmployee(body);
      reply.code(201);
      return out;
    }
  });
}

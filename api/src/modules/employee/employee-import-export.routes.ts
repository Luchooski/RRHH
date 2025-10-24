import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as svc from './employee-import-export.service.js';
import { requirePermission } from '../permissions/permissions.middleware.js';
import { MultipartFile } from '@fastify/multipart';

// Schemas
const ExportQuerySchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  fields: z.string().optional(), // Comma-separated fields
  includeAll: z.string().optional(), // 'true' or 'false'
});

const ImportBodySchema = z.object({
  data: z.array(z.any()).min(1, 'Debe haber al menos un registro'),
  updateExisting: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});

function getReqUser(req: any) {
  if (!req.user) throw new Error('Unauthorized');
  return req.user as { id: string; email: string; role: string; tenantId: string };
}

export default async function employeeImportExportRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /employees/export
   * Exportar empleados a CSV o JSON
   */
  r.get('/employees/export', {
    preHandler: [app.authGuard, requirePermission('employees.export')],
    schema: {
      querystring: ExportQuerySchema,
      response: {
        200: z.any(), // CSV string or JSON array
        400: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const { format, fields, includeAll } = req.query;

        const options = {
          format,
          fields: fields ? fields.split(',').map((f) => f.trim()) : undefined,
          includeAll: includeAll === 'true',
        };

        const result = await svc.exportEmployees(user.tenantId, options);

        if (format === 'csv') {
          return reply
            .code(200)
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename="employees_${new Date().toISOString().split('T')[0]}.csv"`)
            .send(result);
        } else {
          return reply
            .code(200)
            .header('Content-Type', 'application/json')
            .header('Content-Disposition', `attachment; filename="employees_${new Date().toISOString().split('T')[0]}.json"`)
            .send(result);
        }
      } catch (error: any) {
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * POST /employees/import
   * Importar empleados desde JSON
   */
  r.post('/employees/import', {
    preHandler: [app.authGuard, requirePermission('employees.import')],
    schema: {
      body: ImportBodySchema,
      response: {
        200: z.object({
          success: z.number(),
          failed: z.number(),
          errors: z.array(z.any()),
          created: z.array(z.string()),
        }),
        400: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const { data, updateExisting, dryRun } = req.body;

        // Validar datos
        const validation = svc.validateImportData(data);
        if (!validation.valid) {
          return reply.code(400).send({
            error: 'Validation Error',
            message: `Errores de validación: ${validation.errors.join(', ')}`,
          });
        }

        // Importar
        const result = await svc.importEmployees(user.tenantId, data, {
          updateExisting,
          dryRun,
        });

        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * POST /employees/import/csv
   * Importar empleados desde archivo CSV
   */
  r.post('/employees/import/csv', {
    preHandler: [app.authGuard, requirePermission('employees.import')],
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);

        // Procesar archivo multipart
        const data = await req.file();

        if (!data) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'No se envió ningún archivo',
          });
        }

        // Leer el contenido del archivo
        const buffer = await data.toBuffer();
        const csvString = buffer.toString('utf-8');

        // Parsear CSV
        const parsedData = svc.parseCSV(csvString);

        // Validar
        const validation = svc.validateImportData(parsedData);
        if (!validation.valid) {
          return reply.code(400).send({
            error: 'Validation Error',
            message: `Errores de validación: ${validation.errors.join(', ')}`,
          });
        }

        // Importar
        const result = await svc.importEmployees(user.tenantId, parsedData, {
          updateExisting: false,
          dryRun: false,
        });

        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * POST /employees/import/validate
   * Validar datos de importación sin importar (dry run)
   */
  r.post('/employees/import/validate', {
    preHandler: [app.authGuard, requirePermission('employees.import')],
    schema: {
      body: z.object({
        data: z.array(z.any()).min(1),
      }),
      response: {
        200: z.object({
          valid: z.boolean(),
          errors: z.array(z.string()),
          preview: z.object({
            success: z.number(),
            failed: z.number(),
            errors: z.array(z.any()),
          }),
        }),
        400: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const { data } = req.body;

        // Validar formato
        const validation = svc.validateImportData(data);

        // Ejecutar dry run
        const preview = await svc.importEmployees(user.tenantId, data, {
          dryRun: true,
          updateExisting: false,
        });

        return reply.code(200).send({
          valid: validation.valid,
          errors: validation.errors,
          preview: {
            success: preview.success,
            failed: preview.failed,
            errors: preview.errors,
          },
        });
      } catch (error: any) {
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });
}

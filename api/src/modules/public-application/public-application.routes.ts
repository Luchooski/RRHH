import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Tenant } from '../tenant/tenant.model.js';
import { CandidateModel } from '../candidate/candidate.model.js';
import { VacancyModel } from '../vacancy/vacancy.model.js';
import path from 'path';
import fs from 'fs/promises';
import { randomBytes } from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'cvs');

// Asegurar que el directorio de uploads existe
async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

export default async function publicApplicationRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // GET /api/v1/public/careers/:slug - Obtener información pública de la empresa
  r.get('/careers/:slug', {
    schema: {
      params: z.object({
        slug: z.string().min(3).max(50)
      }),
      response: {
        200: z.object({
          company: z.object({
            name: z.string(),
            slug: z.string()
          }),
          vacancies: z.array(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string().optional(),
            location: z.string().optional(),
            employmentType: z.string().optional(),
            status: z.string()
          }))
        }),
        404: z.any()
      }
    },
    handler: async (req, reply) => {
      try {
        const { slug } = req.params as { slug: string };

        const tenant = await Tenant.findOne({ slug, status: 'active' }).lean();
        if (!tenant) {
          return reply.status(404).send({ error: 'Company not found or inactive' });
        }

        // Obtener vacantes activas del tenant
        const vacancies = await VacancyModel.find({
          tenantId: String(tenant._id),
          status: 'open'
        })
          .select('title description location employmentType status')
          .lean();

        return reply.status(200).send({
          company: {
            name: tenant.name,
            slug: tenant.slug
          },
          vacancies: vacancies.map(v => ({
            id: String(v._id),
            title: v.title,
            description: (v as any).description,
            location: (v as any).location,
            employmentType: (v as any).employmentType,
            status: v.status
          }))
        });
      } catch (err: any) {
        req.log.error({ err, route: 'public/careers/:slug' }, 'Failed to get company info');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });

  // POST /api/v1/public/careers/:slug/apply - Enviar aplicación (CV + datos)
  r.post('/careers/:slug/apply', {
    schema: {
      params: z.object({
        slug: z.string().min(3).max(50)
      }),
      response: {
        201: z.object({
          success: z.boolean(),
          candidateId: z.string(),
          message: z.string()
        }),
        400: z.any(),
        404: z.any()
      }
    },
    handler: async (req, reply) => {
      try {
        const { slug } = req.params as { slug: string };

        // Validar que el tenant existe y está activo
        const tenant = await Tenant.findOne({ slug, status: 'active' }).lean();
        if (!tenant) {
          return reply.status(404).send({ error: 'Company not found or inactive' });
        }

        const tenantId = String(tenant._id);

        // Procesar multipart/form-data
        const data = await req.file();
        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Validar que el archivo es un CV
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedMimeTypes.includes(data.mimetype)) {
          return reply.status(400).send({
            error: 'Invalid file type. Only PDF and DOC/DOCX are allowed'
          });
        }

        // Extraer campos del formulario
        const fields = data.fields as any;
        const firstName = fields.firstName?.value || '';
        const lastName = fields.lastName?.value || '';
        const email = fields.email?.value || '';
        const phone = fields.phone?.value || '';
        const vacancyId = fields.vacancyId?.value || null;

        // Validar campos requeridos
        if (!firstName || !lastName || !email) {
          return reply.status(400).send({
            error: 'Missing required fields: firstName, lastName, email'
          });
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return reply.status(400).send({ error: 'Invalid email format' });
        }

        // Si se especificó vacancyId, validar que existe
        if (vacancyId) {
          const vacancy = await VacancyModel.findOne({
            _id: vacancyId,
            tenantId,
            status: 'open'
          }).lean();

          if (!vacancy) {
            return reply.status(400).send({ error: 'Vacancy not found or not open' });
          }
        }

        // Guardar archivo CV
        await ensureUploadsDir();
        const ext = path.extname(data.filename);
        const uniqueName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
        const filePath = path.join(UPLOADS_DIR, uniqueName);

        const fileBuffer = await data.toBuffer();
        await fs.writeFile(filePath, fileBuffer);

        // Crear candidato
        const candidate = await CandidateModel.create({
          tenantId,
          firstName,
          lastName,
          email,
          phone,
          cvUrl: `/uploads/cvs/${uniqueName}`,
          source: 'careers_page',
          status: 'new',
          tags: vacancyId ? [`vacancy:${vacancyId}`] : [],
          notes: vacancyId ? `Applied via careers page for vacancy ${vacancyId}` : 'Applied via careers page'
        });

        req.log.info(
          { candidateId: String(candidate._id), tenantId, email },
          'Public application submitted'
        );

        return reply.status(201).send({
          success: true,
          candidateId: String(candidate._id),
          message: 'Application submitted successfully'
        });
      } catch (err: any) {
        req.log.error({ err, route: 'public/careers/:slug/apply' }, 'Failed to submit application');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });
}

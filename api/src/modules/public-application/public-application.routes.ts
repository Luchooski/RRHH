import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Tenant } from '../tenant/tenant.model.js';
import { CandidateModel } from '../candidates/candidate.model.js';
import { VacancyModel, type VacancyDoc } from '../vacancy/vacancy.model.js';
import path from 'path';
import fs from 'fs/promises';
import { randomBytes } from 'crypto';
import { sendApplicationConfirmation, sendNewApplicationNotification } from '../../services/email.service.js';
import { UserModel } from '../user/user.model.js';

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
            slug: z.string(),
            description: z.string().optional(),
            logo: z.string().optional(),
            primaryColor: z.string().optional()
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
        404: z.any(),
        500: z.any()
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
            slug: tenant.slug,
            description: (tenant as any).branding?.description,
            logo: (tenant as any).branding?.logo,
            primaryColor: (tenant as any).branding?.primaryColor
          },
          vacancies: vacancies.map((v: any) => ({
            id: String(v._id),
            title: v.title,
            description: v.description,
            location: v.location,
            employmentType: v.employmentType,
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
        404: z.any(),
        500: z.any()
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

        // Si se especificó vacancyId, validar que existe y obtener título
        let vacancyTitle: string | undefined;
        if (vacancyId) {
          const vacancy = await VacancyModel.findOne({
            _id: vacancyId,
            tenantId,
            status: 'open'
          }).lean();

          if (!vacancy) {
            return reply.status(400).send({ error: 'Vacancy not found or not open' });
          }

          vacancyTitle = vacancy.title;
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

        // Actualizar analytics del tenant con reset mensual automático
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        // Verificar si cambió el mes para resetear el contador mensual
        const tenantForAnalytics = await Tenant.findById(tenantId).select('analytics').lean();
        const shouldResetMonth =
          !tenantForAnalytics?.analytics?.currentMonth ||
          !tenantForAnalytics?.analytics?.currentYear ||
          tenantForAnalytics.analytics.currentMonth !== currentMonth ||
          tenantForAnalytics.analytics.currentYear !== currentYear;

        if (shouldResetMonth) {
          // Nuevo mes: resetear contador mensual a 1
          await Tenant.findByIdAndUpdate(tenantId, {
            $inc: {
              'analytics.totalApplications': 1,
              'analytics.applicationsByCareersPage': 1,
            },
            $set: {
              'analytics.applicationsThisMonth': 1,
              'analytics.lastApplicationDate': now,
              'analytics.currentMonth': currentMonth,
              'analytics.currentYear': currentYear
            }
          }).catch((error) => {
            req.log.error({ error }, 'Failed to update analytics');
          });
        } else {
          // Mismo mes: incrementar normalmente
          await Tenant.findByIdAndUpdate(tenantId, {
            $inc: {
              'analytics.totalApplications': 1,
              'analytics.applicationsByCareersPage': 1,
              'analytics.applicationsThisMonth': 1
            },
            $set: {
              'analytics.lastApplicationDate': now,
              'analytics.currentMonth': currentMonth,
              'analytics.currentYear': currentYear
            }
          }).catch((error) => {
            req.log.error({ error }, 'Failed to update analytics');
          });
        }

        // Enviar email de confirmación al candidato (no bloquear la respuesta)
        sendApplicationConfirmation({
          to: email,
          candidateName: `${firstName} ${lastName}`,
          companyName: tenant.name,
          vacancyTitle,
        }).catch((error) => {
          req.log.error({ error }, 'Failed to send confirmation email');
        });

        // Notificar a usuarios admin/hr del tenant (no bloquear la respuesta)
        UserModel.find({ tenantId, role: { $in: ['admin', 'hr'] }, isActive: true })
          .select('email')
          .limit(10)
          .lean()
          .then((hrUsers) => {
            if (hrUsers.length > 0) {
              // Enviar a todos los admin/hr (máximo 10)
              hrUsers.forEach((hrUser) => {
                sendNewApplicationNotification({
                  to: hrUser.email,
                  candidateName: `${firstName} ${lastName}`,
                  candidateEmail: email,
                  companyName: tenant.name,
                  vacancyTitle,
                  careersUrl: `${req.protocol}://${req.hostname}/candidatos/${candidate._id}`
                }).catch((error) => {
                  req.log.error({ error, hrEmail: hrUser.email }, 'Failed to send HR notification');
                });
              });
            }
          })
          .catch((error) => {
            req.log.error({ error }, 'Failed to fetch HR users for notification');
          });

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

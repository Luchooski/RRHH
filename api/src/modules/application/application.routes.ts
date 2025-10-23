import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Application } from './application.model.js';
import { Candidate } from '../candidates/candidate.model.js';
import { Vacancy } from '../vacancy/vacancy.model.js';
import { Tenant } from '../tenant/tenant.model.js';
import { sendPipelineStageChangeEmail } from '../email/email.service.js';

const ErrorDTO = z.object({ error: z.string() });
const OkDTO = z.object({ ok: z.literal(true) });
const AppStatus = z.enum(['sent','interview','feedback','offer','hired','rejected']);

const ReorderIn = z.object({
  vacancyId: z.string(),
  changes: z.array(z.object({
    id: z.string(),
    status: AppStatus,
    order: z.number().int().min(0),
  })).max(500),
});

export const applicationRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // LIST por vacante (ajusta tu ruta existente para ordenar por order)
  r.route({
    method: 'GET',
    url: '/applications',
    onRequest: [app.authGuard],
    schema: {
      querystring: z.object({
        vacancyId: z.string(),
      }),
      response: {
        200: z.object({ items: z.array(z.any()) }), // usa tu DTO real aquí
      }
    },
    handler: async (req) => {
      const tenantId = (req as any).user.tenantId;
      const items = await Application
        .find({ vacancyId: req.query.vacancyId, tenantId })
        .sort({ status: 1, order: 1, createdAt: 1 })
        .lean();
      return { items };
    }
  });

  // PATCH de una aplicación (agregá esta lógica a tu handler existente)
  r.route({
    method: 'PATCH',
    url: '/applications/:id',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({
        status: AppStatus.optional(),
        notes: z.string().optional(),
        // otros campos que ya manejes...
      }),
      response: { 200: OkDTO, 404: ErrorDTO }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const current = await Application.findOne({ _id: req.params.id, tenantId }).lean();
      if (!current) return reply.code(404).send({ error: 'Application not found' });

      const patch: any = { ...req.body };

      // Si cambia el status → asignar order = max+1 en la columna destino
      const statusChanged = req.body.status && req.body.status !== current.status;

      if (statusChanged) {
        const max = await Application
          .find({ vacancyId: current.vacancyId, status: req.body.status, tenantId })
          .sort({ order: -1 })
          .limit(1)
          .lean();
        patch.order = ((max?.[0]?.order ?? -1) + 1);

        // Enviar email automático cuando cambie la etapa
        try {
          // Obtener información del candidato, vacante y tenant
          const [candidate, vacancy, tenant] = await Promise.all([
            Candidate.findOne({ _id: current.candidateId, tenantId }).lean(),
            Vacancy.findOne({ _id: current.vacancyId, tenantId }).lean(),
            Tenant.findById(tenantId).lean(),
          ]);

          if (candidate?.email && vacancy?.title && tenant?.name) {
            // Mapear status a nombre legible
            const statusLabels: Record<string, string> = {
              sent: 'Postulación Recibida',
              interview: 'Entrevista',
              feedback: 'En Evaluación',
              offer: 'Oferta Enviada',
              hired: 'Contratado/a',
              rejected: 'No Seleccionado/a',
            };

            const newStageName = statusLabels[req.body.status] || req.body.status;

            // Enviar email (sin bloquear la respuesta)
            sendPipelineStageChangeEmail(
              candidate.email,
              `${candidate.firstName} ${candidate.lastName}`,
              vacancy.title,
              newStageName,
              tenant.name
            ).catch((err) => {
              console.error('[EMAIL] Error sending pipeline stage change email:', err);
            });
          }
        } catch (emailError) {
          // No fallar la actualización si el email falla
          console.error('[EMAIL] Error in email sending logic:', emailError);
        }
      }

      await Application.findOneAndUpdate({ _id: req.params.id, tenantId }, { $set: patch }, { new: true }).lean();
      return { ok: true as const };
    }
  });

  // NUEVO: Reorder masivo (drag & drop)
  r.route({
    method: 'POST',
    url: '/applications/reorder',
    onRequest: [app.authGuard],
    schema: {
      body: ReorderIn,
      response: { 200: OkDTO, 404: ErrorDTO }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      // Verificar que existe la vacante a través de alguna app (check liviano)
      const found = await Application.exists({ vacancyId: req.body.vacancyId, tenantId });
      if (!found) return reply.code(404).send({ error: 'Vacancy not found' });

      const ops = req.body.changes.map(ch => ({
        updateOne: {
          filter: { _id: ch.id, vacancyId: req.body.vacancyId, tenantId },
          update: { $set: { status: ch.status, order: ch.order } }
        }
      }));

      if (ops.length) {
        await Application.bulkWrite(ops);
      }
      return { ok: true as const };
    }
  });
  r.route({
  method: 'POST',
  url: '/applications',
  onRequest: [app.authGuard],
  schema: {
    body: z.object({
      vacancyId: z.string(),
      candidateId: z.string(),
      status: z.enum(['sent','interview','feedback','offer','hired','rejected']).default('sent'),
      notes: z.string().optional(),
    }),
    response: { 200: z.object({ ok: z.literal(true) }) , 404: z.object({ error: z.string() }) }
  },
  handler: async (req, reply) => {
    const tenantId = (req as any).user.tenantId;
    await Application.create({
      vacancyId: req.body.vacancyId,
      candidateId: req.body.candidateId,
      status: req.body.status,
      notes: req.body.notes ?? undefined,
      tenantId,
    });
    return { ok: true as const};
  }
});
};

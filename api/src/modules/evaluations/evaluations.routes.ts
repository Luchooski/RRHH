import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import * as TemplateService from './evaluation-template.service.js';
import * as CycleService from './evaluation-cycle.service.js';
import * as InstanceService from './evaluation-instance.service.js';

export default async function evaluationsRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  const ErrorSchema = z.object({ error: z.string() });

  // ========= TEMPLATES =========

  // List templates
  r.get(
    '/templates',
    {
      schema: {
        querystring: z.object({
          type: z.string().optional(),
          isActive: z.coerce.boolean().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const { type, isActive } = req.query as any;

        const templates = await TemplateService.listTemplates({
          tenantId,
          type,
          isActive,
        });

        return reply.send(templates);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error listing templates' });
      }
    }
  );

  // Create template
  r.post(
    '/templates',
    {
      schema: {
        body: z.any(), // Complex nested structure
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const userName = (req as any).user?.name || 'Unknown User';

        const template = await TemplateService.createTemplate({
          tenantId,
          userId,
          userName,
          data: req.body as any,
        });

        return reply.send(template);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error creating template' });
      }
    }
  );

  // Get template by ID
  r.get(
    '/templates/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const { id } = req.params as any;

        const template = await TemplateService.getTemplateById({
          tenantId,
          templateId: id,
        });

        return reply.send(template);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error getting template' });
      }
    }
  );

  // Update template
  r.put(
    '/templates/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.any(),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const { id } = req.params as any;

        const template = await TemplateService.updateTemplate({
          tenantId,
          templateId: id,
          updates: req.body as any,
        });

        return reply.send(template);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error updating template' });
      }
    }
  );

  // Delete template
  r.delete(
    '/templates/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const { id } = req.params as any;

        const result = await TemplateService.deleteTemplate({
          tenantId,
          templateId: id,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error deleting template' });
      }
    }
  );

  // Get default competencies
  r.get(
    '/templates/defaults/competencies',
    {
      schema: {
        response: { 200: z.any() },
      },
    },
    async (req, reply) => {
      const competencies = TemplateService.getDefaultCompetencies();
      return reply.send(competencies);
    }
  );

  // Get default rating scales
  r.get(
    '/templates/defaults/rating-scales',
    {
      schema: {
        response: { 200: z.any() },
      },
    },
    async (req, reply) => {
      const scales = TemplateService.getDefaultRatingScales();
      return reply.send(scales);
    }
  );

  // ========= CYCLES =========

  // List cycles
  r.get(
    '/cycles',
    {
      schema: {
        querystring: z.object({
          status: z.string().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const { status } = req.query as any;

        const cycles = await CycleService.listCycles({ tenantId, status });

        return reply.send(cycles);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error listing cycles' });
      }
    }
  );

  // Create cycle
  r.post(
    '/cycles',
    {
      schema: {
        body: z.object({
          name: z.string(),
          description: z.string().optional(),
          templateId: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          evaluationDeadline: z.string(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const userName = (req as any).user?.name || 'Unknown User';
        const body = req.body as any;

        const cycle = await CycleService.createCycle({
          tenantId,
          userId,
          userName,
          data: {
            ...body,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            evaluationDeadline: new Date(body.evaluationDeadline),
          },
        });

        return reply.send(cycle);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error creating cycle' });
      }
    }
  );

  // Get cycle by ID
  r.get(
    '/cycles/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const { id } = req.params as any;

        const cycle = await CycleService.getCycleById({ tenantId, cycleId: id });

        return reply.send(cycle);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error getting cycle' });
      }
    }
  );

  // Launch cycle
  r.post(
    '/cycles/:id/launch',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({
          employeeIds: z.array(z.string()).optional(),
          includeSelfEvaluation: z.boolean().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const { id } = req.params as any;
        const { employeeIds, includeSelfEvaluation } = req.body as any;

        const result = await CycleService.launchCycle({
          tenantId,
          cycleId: id,
          employeeIds,
          includeSelfEvaluation,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error launching cycle' });
      }
    }
  );

  // ========= EVALUATION INSTANCES =========

  // List evaluations
  r.get(
    '/evaluations',
    {
      schema: {
        querystring: z.object({
          cycleId: z.string().optional(),
          evaluatedEmployeeId: z.string().optional(),
          evaluatorId: z.string().optional(),
          status: z.string().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const query = req.query as any;

        const evaluations = await InstanceService.listEvaluations({
          tenantId,
          ...query,
        });

        return reply.send(evaluations);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error listing evaluations' });
      }
    }
  );

  // Get evaluation by ID
  r.get(
    '/evaluations/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const { id } = req.params as any;

        const evaluation = await InstanceService.getEvaluationById({
          tenantId,
          evaluationId: id,
        });

        return reply.send(evaluation);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error getting evaluation' });
      }
    }
  );

  // Update evaluation (save progress)
  r.put(
    '/evaluations/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.any(),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const { id } = req.params as any;

        const evaluation = await InstanceService.updateEvaluation({
          tenantId,
          evaluationId: id,
          userId,
          updates: req.body as any,
        });

        return reply.send(evaluation);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error updating evaluation' });
      }
    }
  );

  // Submit evaluation
  r.post(
    '/evaluations/:id/submit',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const userName = (req as any).user?.name || 'Unknown User';
        const { id } = req.params as any;

        const evaluation = await InstanceService.submitEvaluation({
          tenantId,
          evaluationId: id,
          userId,
          userName,
        });

        return reply.send(evaluation);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error submitting evaluation' });
      }
    }
  );

  // Manager review
  r.post(
    '/evaluations/:id/manager-review',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({
          approved: z.boolean(),
          comments: z.string().optional(),
          overallRating: z.number().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const userName = (req as any).user?.name || 'Unknown User';
        const { id } = req.params as any;
        const { approved, comments, overallRating } = req.body as any;

        const evaluation = await InstanceService.managerReview({
          tenantId,
          evaluationId: id,
          managerId: userId,
          managerName: userName,
          approved,
          comments,
          overallRating,
        });

        return reply.send(evaluation);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error in manager review' });
      }
    }
  );

  // HR review
  r.post(
    '/evaluations/:id/hr-review',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({
          approved: z.boolean(),
          comments: z.string().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const userName = (req as any).user?.name || 'Unknown User';
        const { id } = req.params as any;
        const { approved, comments } = req.body as any;

        const evaluation = await InstanceService.hrReview({
          tenantId,
          evaluationId: id,
          hrId: userId,
          hrName: userName,
          approved,
          comments,
        });

        return reply.send(evaluation);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error in HR review' });
      }
    }
  );

  // Get employee evaluation summary
  r.get(
    '/evaluations/employee/:employeeId/cycle/:cycleId/summary',
    {
      schema: {
        params: z.object({
          employeeId: z.string(),
          cycleId: z.string(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const { employeeId, cycleId } = req.params as any;

        const summary = await InstanceService.getEmployeeEvaluationSummary({
          tenantId,
          cycleId,
          employeeId,
        });

        return reply.send(summary);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error getting summary' });
      }
    }
  );
}

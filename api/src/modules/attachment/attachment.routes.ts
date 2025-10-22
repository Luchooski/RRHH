import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Employee } from '../employee/employee.model.js';
import {
  createAttachment,
  listAttachments,
  getAttachmentById,
  deleteAttachment,
  getAttachmentFile,
} from './attachment.service.js';

const ErrorDTO = z.object({ error: z.string() });
const OkDTO = z.object({ ok: z.literal(true) });

const FileTypeEnum = z.enum(['dni', 'cv', 'contract', 'certificate', 'photo', 'other']);

const AttachmentOutputSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  filename: z.string(),
  storedFilename: z.string(),
  fileType: FileTypeEnum,
  mimeType: z.string(),
  size: z.number(),
  uploadedBy: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const AttachmentListSchema = z.object({
  items: z.array(AttachmentOutputSchema),
  total: z.number(),
});

export const attachmentRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // POST /employees/:employeeId/attachments - Upload file
  r.route({
    method: 'POST',
    url: '/employees/:employeeId/attachments',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ employeeId: z.string() }),
      querystring: z.object({
        fileType: FileTypeEnum.optional(),
        description: z.string().optional(),
      }),
      response: {
        201: AttachmentOutputSchema,
        400: ErrorDTO,
        404: ErrorDTO,
      },
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const userId = (req as any).user.id;
      const { employeeId } = req.params;
      const { fileType, description } = req.query;

      // Verify employee exists and belongs to tenant
      const employee = await Employee.findOne({ _id: employeeId, tenantId }).lean();
      if (!employee) {
        return reply.code(404).send({ error: 'Employee not found' });
      }

      // Get uploaded file
      const data = await req.file();
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      const fileBuffer = await data.toBuffer();
      const filename = data.filename;
      const mimeType = data.mimetype;
      const size = fileBuffer.length;

      // Validate file size (max 10MB)
      if (size > 10 * 1024 * 1024) {
        return reply.code(400).send({ error: 'File too large. Maximum size is 10MB' });
      }

      // Create attachment
      const attachment = await createAttachment({
        tenantId,
        employeeId,
        filename,
        fileType: fileType || 'other',
        mimeType,
        size,
        uploadedBy: userId,
        description,
        fileBuffer,
      });

      return reply.code(201).send({
        id: String(attachment.id),
        employeeId: attachment.employeeId,
        filename: attachment.filename,
        storedFilename: attachment.storedFilename,
        fileType: attachment.fileType as any,
        mimeType: attachment.mimeType,
        size: attachment.size,
        uploadedBy: attachment.uploadedBy,
        description: attachment.description,
        createdAt: new Date(attachment.createdAt).toISOString(),
        updatedAt: new Date(attachment.updatedAt).toISOString(),
      });
    },
  });

  // GET /employees/:employeeId/attachments - List attachments
  r.route({
    method: 'GET',
    url: '/employees/:employeeId/attachments',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ employeeId: z.string() }),
      querystring: z.object({
        fileType: FileTypeEnum.optional(),
      }),
      response: {
        200: AttachmentListSchema,
        404: ErrorDTO,
      },
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const { employeeId } = req.params;
      const { fileType } = req.query;

      // Verify employee exists and belongs to tenant
      const employee = await Employee.findOne({ _id: employeeId, tenantId }).lean();
      if (!employee) {
        return reply.code(404).send({ error: 'Employee not found' });
      }

      // List attachments
      const attachments = await listAttachments(tenantId, employeeId, fileType);

      return {
        items: attachments.map(a => ({
          id: String(a._id),
          employeeId: a.employeeId,
          filename: a.filename,
          storedFilename: a.storedFilename,
          fileType: a.fileType as any,
          mimeType: a.mimeType,
          size: a.size,
          uploadedBy: a.uploadedBy,
          description: a.description,
          createdAt: new Date(a.createdAt).toISOString(),
          updatedAt: new Date(a.updatedAt).toISOString(),
        })),
        total: attachments.length,
      };
    },
  });

  // GET /attachments/:id/download - Download file
  r.route({
    method: 'GET',
    url: '/attachments/:id/download',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const { id } = req.params;

      const file = await getAttachmentFile(id, tenantId);

      if (!file) {
        return reply.code(404).send({ error: 'Attachment not found' });
      }

      reply.header('Content-Type', file.mimeType);
      reply.header('Content-Disposition', `attachment; filename="${file.filename}"`);
      return reply.send(file.buffer);
    },
  });

  // DELETE /attachments/:id - Delete attachment
  r.route({
    method: 'DELETE',
    url: '/attachments/:id',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: OkDTO,
        404: ErrorDTO,
      },
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const { id } = req.params;

      const deleted = await deleteAttachment(id, tenantId);

      if (!deleted) {
        return reply.code(404).send({ error: 'Attachment not found' });
      }

      return { ok: true as const };
    },
  });
};

export default attachmentRoutes;

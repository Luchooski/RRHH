import { Attachment, AttachmentDoc } from './attachment.model.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

interface CreateAttachmentParams {
  tenantId: string;
  employeeId: string;
  filename: string;
  fileType: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  description?: string;
  fileBuffer: Buffer;
}

export async function createAttachment(params: CreateAttachmentParams) {
  const {
    tenantId,
    employeeId,
    filename,
    fileType,
    mimeType,
    size,
    uploadedBy,
    description,
    fileBuffer,
  } = params;

  // Generate unique filename
  const ext = path.extname(filename);
  const uniqueName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
  const filePath = path.join(UPLOADS_DIR, uniqueName);

  // Save file to disk
  await fs.writeFile(filePath, fileBuffer);

  // Create database record
  const attachment = await Attachment.create({
    tenantId,
    employeeId,
    filename,
    storedFilename: uniqueName,
    fileType,
    mimeType,
    size,
    path: filePath,
    uploadedBy,
    description,
  });

  return attachment.toObject();
}

export async function listAttachments(tenantId: string, employeeId: string, fileType?: string) {
  const filter: any = { tenantId, employeeId };
  if (fileType) filter.fileType = fileType;

  const attachments = await Attachment.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  return attachments;
}

export async function getAttachmentById(id: string, tenantId: string) {
  const attachment = await Attachment.findOne({ _id: id, tenantId }).lean();
  return attachment;
}

export async function deleteAttachment(id: string, tenantId: string) {
  const attachment = await Attachment.findOne({ _id: id, tenantId });

  if (!attachment) {
    return null;
  }

  // Delete file from disk
  try {
    await fs.unlink(attachment.path);
  } catch (error) {
    console.error('Error deleting file from disk:', error);
    // Continue with database deletion even if file deletion fails
  }

  // Delete from database
  await Attachment.deleteOne({ _id: id, tenantId });

  return attachment.toObject();
}

export async function getAttachmentFile(id: string, tenantId: string) {
  const attachment = await Attachment.findOne({ _id: id, tenantId }).lean();

  if (!attachment) {
    return null;
  }

  try {
    const fileBuffer = await fs.readFile(attachment.path);
    return {
      buffer: fileBuffer,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
    };
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}

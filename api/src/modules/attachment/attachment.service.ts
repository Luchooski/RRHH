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
  tags?: string[];
  versionNotes?: string;
}

interface CreateVersionParams {
  parentId: string;
  tenantId: string;
  uploadedBy: string;
  fileBuffer: Buffer;
  versionNotes?: string;
}

interface SearchAttachmentsParams {
  tenantId: string;
  employeeId?: string;
  fileType?: string;
  tags?: string[];
  searchText?: string;
  onlyLatest?: boolean;
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
    tags,
    versionNotes,
  } = params;

  // Generate unique filename
  const ext = path.extname(filename);
  const uniqueName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
  const filePath = path.join(UPLOADS_DIR, uniqueName);

  // Save file to disk
  await fs.writeFile(filePath, fileBuffer);

  // Create searchable text from filename, description, and tags
  const searchableText = [
    filename,
    description || '',
    ...(tags || []),
  ].join(' ').toLowerCase();

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
    tags: tags || [],
    searchableText,
    versionNotes,
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

/**
 * Create a new version of an existing document
 */
export async function createVersion(params: CreateVersionParams) {
  const { parentId, tenantId, uploadedBy, fileBuffer, versionNotes } = params;

  // Get the original document (or the parent if this is already a version)
  const parent = await Attachment.findOne({ _id: parentId, tenantId });

  if (!parent) {
    throw new Error('Parent document not found');
  }

  // Find the root document
  const rootId = parent.parentId || parent._id;

  // Get the latest version number
  const latestVersion = await Attachment.findOne({
    $or: [{ _id: rootId }, { parentId: rootId }],
    tenantId,
  })
    .sort({ version: -1 })
    .lean();

  const newVersion = (latestVersion?.version || 0) + 1;

  // Mark all previous versions as not latest
  await Attachment.updateMany(
    {
      $or: [{ _id: rootId }, { parentId: rootId }],
      tenantId,
    },
    { $set: { isLatest: false } }
  );

  // Generate unique filename
  const ext = path.extname(parent.filename);
  const uniqueName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
  const filePath = path.join(UPLOADS_DIR, uniqueName);

  // Save file to disk
  await fs.writeFile(filePath, fileBuffer);

  // Create searchable text
  const searchableText = [
    parent.filename,
    parent.description || '',
    ...(parent.tags || []),
  ].join(' ').toLowerCase();

  // Create new version
  const newDoc = await Attachment.create({
    tenantId,
    employeeId: parent.employeeId,
    filename: parent.filename,
    storedFilename: uniqueName,
    fileType: parent.fileType,
    mimeType: parent.mimeType,
    size: fileBuffer.length,
    path: filePath,
    uploadedBy,
    description: parent.description,
    tags: parent.tags || [],
    searchableText,
    version: newVersion,
    parentId: rootId,
    isLatest: true,
    versionNotes,
  });

  return newDoc.toObject();
}

/**
 * Get version history for a document
 */
export async function getVersionHistory(documentId: string, tenantId: string) {
  const document = await Attachment.findOne({ _id: documentId, tenantId }).lean();

  if (!document) {
    return [];
  }

  const rootId = document.parentId || document._id;

  const versions = await Attachment.find({
    $or: [{ _id: rootId }, { parentId: rootId }],
    tenantId,
  })
    .sort({ version: -1 })
    .lean();

  return versions;
}

/**
 * Advanced search for attachments
 */
export async function searchAttachments(params: SearchAttachmentsParams) {
  const { tenantId, employeeId, fileType, tags, searchText, onlyLatest = true } = params;

  const filter: any = { tenantId };

  if (employeeId) {
    filter.employeeId = employeeId;
  }

  if (fileType) {
    filter.fileType = fileType;
  }

  if (onlyLatest) {
    filter.isLatest = true;
  }

  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }

  if (searchText) {
    filter.$text = { $search: searchText };
  }

  const attachments = await Attachment.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  return attachments;
}

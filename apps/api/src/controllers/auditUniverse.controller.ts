import type { Request, Response, NextFunction } from 'express';
import { AuditUniverseService } from '../services/auditUniverse.service.js';
import { recordAudit } from '../services/audit.service.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type {
  CreateAuditUniverseInput,
  UpdateAuditUniverseInput,
  ListAuditUniverseInput,
  AuditEntityStatus,
} from '@iams/shared';

const service = new AuditUniverseService();

function clientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip;
}

function safeMetadata(payload: Record<string, unknown>): Record<string, unknown> {
  const { notes, description, ...rest } = payload;
  return {
    ...rest,
    notesPresent: Boolean(notes),
    descriptionPresent: Boolean(description),
  };
}

export async function listEntities(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.query as unknown as ListAuditUniverseInput;
    const result = await service.list(input);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getEntity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const entity = await service.getById(id);
    sendSuccess(res, entity);
  } catch (err) {
    next(err);
  }
}

export async function createEntity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateAuditUniverseInput;
    const entity = await service.create(input, req.user!.id);

    recordAudit({
      action: 'audit_universe.create',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: safeMetadata({
        id: entity.id,
        code: entity.code,
        name: entity.name,
        entityType: entity.entityType,
        parentId: entity.parentId,
        ownerId: entity.ownerId,
      }),
    });

    sendSuccess(res, entity, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateEntity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as UpdateAuditUniverseInput;
    const entity = await service.update(id, input, req.user!.id);

    recordAudit({
      action: 'audit_universe.update',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: safeMetadata({
        id: entity.id,
        code: entity.code,
        name: entity.name,
        entityType: entity.entityType,
        status: entity.status,
        parentId: entity.parentId,
        ownerId: entity.ownerId,
      }),
    });

    sendSuccess(res, entity);
  } catch (err) {
    next(err);
  }
}

export async function setEntityStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: AuditEntityStatus };
    const entity = await service.setStatus(id, status, req.user!.id);

    recordAudit({
      action: 'audit_universe.status_change',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: entity.id, code: entity.code, status: entity.status },
    });

    sendSuccess(res, entity);
  } catch (err) {
    next(err);
  }
}

export async function deleteEntity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await service.getById(id);
    await service.delete(id);

    recordAudit({
      action: 'audit_universe.delete',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: existing.id, code: existing.code, name: existing.name },
    });

    sendSuccess(res, { message: 'Audit universe entity deleted' });
  } catch (err) {
    if (err instanceof NotFoundError) {
      recordAudit({
        action: 'audit_universe.delete_failed',
        category: 'data_access',
        userId: req.user?.id,
        ip: clientIp(req),
        userAgent: req.headers['user-agent'],
        metadata: { id: req.params.id, reason: 'not_found' },
        success: false,
      });
    }
    next(err);
  }
}

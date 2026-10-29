import type { Request, Response, NextFunction } from 'express';
import { FindingService } from '../services/finding.service.js';
import { recordAudit } from '../services/audit.service.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type {
  CreateFindingRequest,
  UpdateFindingRequest,
  ListFindingInput,
  TransitionFindingRequest,
  FindingStatus,
} from '@iams/shared';

const service = new FindingService();

function clientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip;
}

export async function listFindings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.query as unknown as ListFindingInput;
    const result = await service.list(input);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getFinding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const finding = await service.getById(id);
    sendSuccess(res, finding);
  } catch (err) {
    next(err);
  }
}

export async function createFinding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as CreateFindingRequest;
    const finding = await service.create(input, req.user!.id);
    recordAudit({
      action: 'finding.create',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: finding.id, reference: finding.reference, title: finding.title },
    });
    sendSuccess(res, finding, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateFinding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as UpdateFindingRequest;
    const finding = await service.update(id, input, req.user!.id);
    recordAudit({
      action: 'finding.update',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: finding.id, reference: finding.reference, status: finding.status },
    });
    sendSuccess(res, finding);
  } catch (err) {
    next(err);
  }
}

export async function transitionFinding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as TransitionFindingRequest;
    const finding = await service.transition(
      id,
      input.status as FindingStatus,
      req.user!.id,
      input.managementResponse,
      input.verificationNotes,
    );
    recordAudit({
      action: 'finding.transition',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: finding.id, reference: finding.reference, newStatus: finding.status },
    });
    sendSuccess(res, finding);
  } catch (err) {
    next(err);
  }
}

export async function deleteFinding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await service.getById(id);
    await service.delete(id);
    recordAudit({
      action: 'finding.delete',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: existing.id, reference: existing.reference },
    });
    sendSuccess(res, { message: 'Finding deleted' });
  } catch (err) {
    if (err instanceof NotFoundError) {
      recordAudit({
        action: 'finding.delete_failed',
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

export async function getFindingDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await service.getDashboard();
    sendSuccess(res, dashboard);
  } catch (err) {
    next(err);
  }
}

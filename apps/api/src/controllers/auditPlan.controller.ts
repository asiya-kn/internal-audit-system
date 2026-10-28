import type { Request, Response, NextFunction } from 'express';
import { AuditPlanService } from '../services/auditPlan.service.js';
import { recordAudit } from '../services/audit.service.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type {
  CreateAuditPlanInput,
  UpdateAuditPlanInput,
  ListAuditPlanInput,
  TransitionAuditPlanRequest,
  AuditPlanStatus,
} from '@iams/shared';

const service = new AuditPlanService();

function clientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip;
}

export async function listPlans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.query as unknown as ListAuditPlanInput;
    const result = await service.list(input);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const plan = await service.getById(id);
    sendSuccess(res, plan);
  } catch (err) {
    next(err);
  }
}

export async function createPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as CreateAuditPlanInput;
    const plan = await service.create(input, req.user!.id);
    recordAudit({
      action: 'audit_plan.create',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: plan.id, reference: plan.reference, title: plan.title },
    });
    sendSuccess(res, plan, 201);
  } catch (err) {
    next(err);
  }
}

export async function updatePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as UpdateAuditPlanInput;
    const plan = await service.update(id, input, req.user!.id);
    recordAudit({
      action: 'audit_plan.update',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: plan.id, reference: plan.reference, status: plan.status },
    });
    sendSuccess(res, plan);
  } catch (err) {
    next(err);
  }
}

export async function transitionPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as TransitionAuditPlanRequest;
    const plan = await service.transition(id, input.status as AuditPlanStatus, req.user!.id);
    recordAudit({
      action: 'audit_plan.transition',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: plan.id, reference: plan.reference, newStatus: plan.status },
    });
    sendSuccess(res, plan);
  } catch (err) {
    next(err);
  }
}

export async function deletePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await service.getById(id);
    await service.delete(id);
    recordAudit({
      action: 'audit_plan.delete',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: existing.id, reference: existing.reference },
    });
    sendSuccess(res, { message: 'Audit plan deleted' });
  } catch (err) {
    if (err instanceof NotFoundError) {
      recordAudit({
        action: 'audit_plan.delete_failed',
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

export async function getPlanDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await service.getDashboard();
    sendSuccess(res, dashboard);
  } catch (err) {
    next(err);
  }
}

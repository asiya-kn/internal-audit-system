import type { Request, Response, NextFunction } from 'express';
import { RiskService } from '../services/risk.service.js';
import { recordAudit } from '../services/audit.service.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type {
  CreateRiskInput,
  UpdateRiskInput,
  ListRiskInput,
  CreateRiskActionInput,
  UpdateRiskActionInput,
} from '@iams/shared';

const service = new RiskService();

function clientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip;
}

export async function listRisks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.query as unknown as ListRiskInput;
    const result = await service.list(input);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getRisk(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const risk = await service.getById(id);
    sendSuccess(res, risk);
  } catch (err) {
    next(err);
  }
}

export async function createRisk(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as CreateRiskInput;
    const risk = await service.create(input, req.user!.id);
    recordAudit({
      action: 'risk.create',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: risk.id, title: risk.title, auditEntityId: risk.auditEntityId },
    });
    sendSuccess(res, risk, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateRisk(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as UpdateRiskInput;
    const risk = await service.update(id, input, req.user!.id);
    recordAudit({
      action: 'risk.update',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: risk.id, title: risk.title, status: risk.status },
    });
    sendSuccess(res, risk);
  } catch (err) {
    next(err);
  }
}

export async function deleteRisk(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await service.getById(id);
    await service.delete(id);
    recordAudit({
      action: 'risk.delete',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: existing.id, title: existing.title },
    });
    sendSuccess(res, { message: 'Risk deleted' });
  } catch (err) {
    if (err instanceof NotFoundError) {
      recordAudit({
        action: 'risk.delete_failed',
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

export async function getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await service.getDashboard();
    sendSuccess(res, dashboard);
  } catch (err) {
    next(err);
  }
}

export async function createAction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { riskId } = req.params;
    const input = req.body as CreateRiskActionInput;
    const action = await service.createAction(riskId, input, req.user!.id);
    recordAudit({
      action: 'risk_action.create',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: action.id, riskId, title: action.title },
    });
    sendSuccess(res, action, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateAction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { actionId } = req.params;
    const input = req.body as UpdateRiskActionInput;
    const action = await service.updateAction(actionId, input, req.user!.id);
    recordAudit({
      action: 'risk_action.update',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: action.id, riskId: action.riskId, status: action.status },
    });
    sendSuccess(res, action);
  } catch (err) {
    next(err);
  }
}

export async function deleteAction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { actionId } = req.params;
    await service.deleteAction(actionId, req.user!.id);
    recordAudit({
      action: 'risk_action.delete',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: actionId },
    });
    sendSuccess(res, { message: 'Risk action deleted' });
  } catch (err) {
    next(err);
  }
}

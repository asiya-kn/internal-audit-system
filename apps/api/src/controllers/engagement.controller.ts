import type { Request, Response, NextFunction } from 'express';
import { EngagementService } from '../services/engagement.service.js';
import { recordAudit } from '../services/audit.service.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type {
  CreateEngagementRequest,
  UpdateEngagementRequest,
  ListEngagementInput,
  TransitionEngagementRequest,
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
  EngagementStatus,
  TeamMemberRole,
} from '@iams/shared';

const service = new EngagementService();

function clientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip;
}

export async function listEngagements(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.query as unknown as ListEngagementInput;
    const result = await service.list(input);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getEngagement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const eng = await service.getById(id);
    sendSuccess(res, eng);
  } catch (err) {
    next(err);
  }
}

export async function createEngagement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as CreateEngagementRequest;
    const eng = await service.create(input, req.user!.id);
    recordAudit({
      action: 'engagement.create',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: eng.id, reference: eng.reference, title: eng.title },
    });
    sendSuccess(res, eng, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateEngagement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as UpdateEngagementRequest;
    const eng = await service.update(id, input, req.user!.id);
    recordAudit({
      action: 'engagement.update',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: eng.id, reference: eng.reference, status: eng.status },
    });
    sendSuccess(res, eng);
  } catch (err) {
    next(err);
  }
}

export async function transitionEngagement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as TransitionEngagementRequest;
    const eng = await service.transition(id, input.status as EngagementStatus, req.user!.id, input.closureNotes);
    recordAudit({
      action: 'engagement.transition',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: eng.id, reference: eng.reference, newStatus: eng.status },
    });
    sendSuccess(res, eng);
  } catch (err) {
    next(err);
  }
}

export async function deleteEngagement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await service.getById(id);
    await service.delete(id);
    recordAudit({
      action: 'engagement.delete',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { id: existing.id, reference: existing.reference },
    });
    sendSuccess(res, { message: 'Engagement deleted' });
  } catch (err) {
    if (err instanceof NotFoundError) {
      recordAudit({
        action: 'engagement.delete_failed',
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

export async function getEngagementDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await service.getDashboard();
    sendSuccess(res, dashboard);
  } catch (err) {
    next(err);
  }
}

// ---- Team Members ----

export async function addTeamMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as AddTeamMemberRequest;
    const tm = await service.addTeamMember(id, input.userId, (input.role ?? 'AUDITOR') as TeamMemberRole);
    recordAudit({
      action: 'engagement_team.add',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { engagementId: id, userId: input.userId, role: input.role },
    });
    sendSuccess(res, tm, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateTeamMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, userId } = req.params;
    const input = req.body as UpdateTeamMemberRequest;
    const tm = await service.updateTeamMember(id, userId, input.role as TeamMemberRole);
    recordAudit({
      action: 'engagement_team.update',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { engagementId: id, userId, role: input.role },
    });
    sendSuccess(res, tm);
  } catch (err) {
    next(err);
  }
}

export async function removeTeamMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, userId } = req.params;
    await service.removeTeamMember(id, userId);
    recordAudit({
      action: 'engagement_team.remove',
      category: 'data_access',
      userId: req.user!.id,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { engagementId: id, userId },
    });
    sendSuccess(res, { message: 'Team member removed' });
  } catch (err) {
    next(err);
  }
}

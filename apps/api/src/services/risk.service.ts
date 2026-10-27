import { prisma } from '../config/db.js';
import { RiskRepository } from '../repositories/risk.repository.js';
import { mapRiskToSummary, mapRiskToDetail, mapActionToDto } from './risk.mapper.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import {
  scoreToLevel,
  residualScore,
  type RiskLevel,
  type RiskStatus,
  type ActionStatus,
} from '@iams/shared';
import type { Prisma } from '../generated/client/index.js';
import type {
  RiskSummaryDto,
  RiskDetailDto,
  RiskActionDto,
  RiskDashboardDto,
} from '@iams/shared';

const SORT_COLUMNS = [
  'title',
  'inherentScore',
  'inherentLevel',
  'residualScore',
  'residualLevel',
  'controlEffectiveness',
  'status',
  'riskCategory',
  'createdAt',
  'updatedAt',
] as const;

type SortColumn = (typeof SORT_COLUMNS)[number];

export class RiskService {
  constructor(
    private readonly repo: RiskRepository = new RiskRepository(),
  ) {}

  async list(input: import('@iams/shared').ListRiskInput): Promise<{ items: RiskSummaryDto[]; total: number; page: number; pageSize: number }> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const { sortBy, sortOrder, search, auditEntityId, status, inherentLevel, residualLevel, ownerId, riskCategory } = input;

    const where: Prisma.RiskWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { riskCategory: { contains: search, mode: 'insensitive' } },
        { auditEntity: { name: { contains: search, mode: 'insensitive' } } },
        { auditEntity: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (auditEntityId) where.auditEntityId = auditEntityId;
    if (status) where.status = status;
    if (inherentLevel) where.inherentLevel = inherentLevel;
    if (residualLevel) where.residualLevel = residualLevel;
    if (ownerId) where.ownerId = ownerId;
    if (riskCategory) where.riskCategory = { contains: riskCategory, mode: 'insensitive' };

    const sortCol: SortColumn = sortBy && (SORT_COLUMNS as readonly string[]).includes(sortBy)
      ? (sortBy as SortColumn)
      : 'inherentScore';
    const orderBy: Prisma.RiskOrderByWithRelationInput = {
      [sortCol]: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    const [items, total] = await Promise.all([
      this.repo.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      this.repo.count(where),
    ]);

    return { items: items.map(mapRiskToSummary), total, page, pageSize };
  }

  async getById(id: string): Promise<RiskDetailDto> {
    const risk = await this.repo.findById(id);
    if (!risk) throw new NotFoundError('Risk not found');
    return mapRiskToDetail(risk);
  }

  async create(input: import('@iams/shared').CreateRiskInput, userId: string): Promise<RiskDetailDto> {
    const entity = await prisma.auditUniverse.findUnique({ where: { id: input.auditEntityId } });
    if (!entity) {
      throw new ValidationError('The specified audit entity does not exist', { auditEntityId: input.auditEntityId });
    }

    if (input.ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: input.ownerId } });
      if (!owner) throw new ValidationError('The specified owner does not exist', { ownerId: input.ownerId });
    }

    const inherentScore = input.inherentLikelihood * input.inherentImpact;
    const inherentLevel = scoreToLevel(inherentScore);
    const ctrlPct = input.controlEffectiveness ?? 0;
    const resScore = residualScore(inherentScore, ctrlPct);
    const resLevel = scoreToLevel(resScore);

    const created = await this.repo.create({
      title: input.title,
      description: input.description,
      auditEntity: { connect: { id: input.auditEntityId } },
      inherentLikelihood: input.inherentLikelihood,
      inherentImpact: input.inherentImpact,
      inherentScore,
      inherentLevel: inherentLevel as RiskLevel,
      existingControls: input.existingControls,
      controlEffectiveness: ctrlPct,
      residualScore: resScore,
      residualLevel: resLevel as RiskLevel,
      riskCategory: input.riskCategory,
      notes: input.notes,
      owner: input.ownerId ? { connect: { id: input.ownerId } } : undefined,
      createdBy: { connect: { id: userId } },
      updatedBy: { connect: { id: userId } },
    });

    return mapRiskToDetail(created);
  }

  async update(id: string, input: import('@iams/shared').UpdateRiskInput, userId: string): Promise<RiskDetailDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Risk not found');

    if (input.auditEntityId && input.auditEntityId !== existing.auditEntityId) {
      const entity = await prisma.auditUniverse.findUnique({ where: { id: input.auditEntityId } });
      if (!entity) throw new ValidationError('The specified audit entity does not exist', { auditEntityId: input.auditEntityId });
    }

    if (input.ownerId !== undefined && input.ownerId !== null && input.ownerId !== existing.ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: input.ownerId } });
      if (!owner) throw new ValidationError('The specified owner does not exist', { ownerId: input.ownerId });
    }

    const likelihood = input.inherentLikelihood ?? existing.inherentLikelihood;
    const impact = input.inherentImpact ?? existing.inherentImpact;
    const ctrlPct = input.controlEffectiveness ?? existing.controlEffectiveness;
    const inherentScore = likelihood * impact;
    const inherentLevel = scoreToLevel(inherentScore);
    const resScore = residualScore(inherentScore, ctrlPct);
    const resLevel = scoreToLevel(resScore);

    const data: Prisma.RiskUpdateInput = {
      inherentScore,
      inherentLevel: inherentLevel as RiskLevel,
      residualScore: resScore,
      residualLevel: resLevel as RiskLevel,
      controlEffectiveness: ctrlPct,
      updatedBy: { connect: { id: userId } },
    };

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.auditEntityId !== undefined) data.auditEntity = { connect: { id: input.auditEntityId } };
    if (input.inherentLikelihood !== undefined) data.inherentLikelihood = input.inherentLikelihood;
    if (input.inherentImpact !== undefined) data.inherentImpact = input.inherentImpact;
    if (input.existingControls !== undefined) data.existingControls = input.existingControls;
    if (input.status !== undefined) data.status = input.status as RiskStatus;
    if (input.riskCategory !== undefined) data.riskCategory = input.riskCategory;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.ownerId !== undefined) {
      data.owner = input.ownerId ? { connect: { id: input.ownerId } } : { disconnect: true };
    }

    const updated = await this.repo.update(id, data);
    return mapRiskToDetail(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Risk not found');
    await this.repo.delete(id);
  }

  // ---- Actions ----

  async createAction(riskId: string, input: import('@iams/shared').CreateRiskActionInput, userId: string): Promise<RiskActionDto> {
    const risk = await this.repo.findById(riskId);
    if (!risk) throw new NotFoundError('Risk not found');

    if (input.assigneeId) {
      const user = await prisma.user.findUnique({ where: { id: input.assigneeId } });
      if (!user) throw new ValidationError('The specified assignee does not exist', { assigneeId: input.assigneeId });
    }

    const action = await this.repo.createAction({
      title: input.title,
      description: input.description,
      risk: { connect: { id: riskId } },
      assignee: input.assigneeId ? { connect: { id: input.assigneeId } } : undefined,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      status: (input.status ?? 'OPEN') as ActionStatus,
    });

    await this.repo.update(riskId, { updatedBy: { connect: { id: userId } } });
    return mapActionToDto(action);
  }

  async updateAction(actionId: string, input: import('@iams/shared').UpdateRiskActionInput, userId: string): Promise<RiskActionDto> {
    const existing = await this.repo.findActionById(actionId);
    if (!existing) throw new NotFoundError('Risk action not found');

    if (input.assigneeId !== undefined && input.assigneeId !== null && input.assigneeId !== existing.assigneeId) {
      const user = await prisma.user.findUnique({ where: { id: input.assigneeId } });
      if (!user) throw new ValidationError('The specified assignee does not exist', { assigneeId: input.assigneeId });
    }

    const data: Prisma.RiskActionUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.assigneeId !== undefined) {
      data.assignee = input.assigneeId ? { connect: { id: input.assigneeId } } : { disconnect: true };
    }
    if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (input.completedAt !== undefined) data.completedAt = input.completedAt ? new Date(input.completedAt) : null;
    if (input.status !== undefined) data.status = input.status as ActionStatus;

    const updated = await this.repo.updateAction(actionId, data);
    await this.repo.update(existing.riskId, { updatedBy: { connect: { id: userId } } });
    return mapActionToDto(updated);
  }

  async deleteAction(actionId: string, userId: string): Promise<void> {
    const existing = await this.repo.findActionById(actionId);
    if (!existing) throw new NotFoundError('Risk action not found');
    await this.repo.deleteAction(actionId);
    await this.repo.update(existing.riskId, { updatedBy: { connect: { id: userId } } });
  }

  // ---- Dashboard ----

  async getDashboard(): Promise<RiskDashboardDto> {
    const all = await this.repo.findMany({
      where: {},
      orderBy: { inherentScore: 'desc' },
      take: 100,
    });

    const byInherentLevel: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const byResidualLevel: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const byStatus: Record<RiskStatus, number> = { OPEN: 0, MITIGATING: 0, MONITORING: 0, CLOSED: 0 };

    let openActions = 0;
    let overdueActions = 0;
    const riskIdsWithOverdue = new Set<string>();

    for (const risk of all) {
      byInherentLevel[risk.inherentLevel]++;
      byResidualLevel[risk.residualLevel]++;
      byStatus[risk.status]++;
      for (const action of risk.actions) {
        if (action.status === 'OPEN' || action.status === 'IN_PROGRESS') openActions++;
        const isOverdue = action.dueDate &&
          action.status !== 'COMPLETED' &&
          action.status !== 'CANCELLED' &&
          new Date(action.dueDate) < new Date();
        if (isOverdue) {
          overdueActions++;
          riskIdsWithOverdue.add(risk.id);
        }
      }
    }

    return {
      totalRisks: all.length,
      byInherentLevel,
      byResidualLevel,
      byStatus,
      openActions,
      overdueActions,
      risksWithOverdueActions: riskIdsWithOverdue.size,
      topRisks: all.slice(0, 5).map(mapRiskToSummary),
    };
  }
}

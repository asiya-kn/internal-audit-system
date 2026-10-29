import { prisma } from '../config/db.js';
import { FindingRepository } from '../repositories/finding.repository.js';
import { mapFindingToSummary, mapFindingToDetail } from './finding.mapper.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import { canTransitionFinding, type FindingStatus, type FindingCategory, type FindingSeverity, type FindingDashboardDto } from '@iams/shared';
import type { Prisma } from '../generated/client/index.js';
import type {
  FindingSummaryDto,
  FindingDetailDto,
  CreateFindingInput,
  UpdateFindingInput,
  ListFindingInput,
} from '@iams/shared';

const SORT_COLUMNS = [
  'title',
  'reference',
  'category',
  'severity',
  'status',
  'targetResolutionDate',
  'createdAt',
  'updatedAt',
] as const;

type SortColumn = (typeof SORT_COLUMNS)[number];

const STATUS_LABELS: Record<FindingStatus, string> = {
  DRAFT: 'Draft', OPEN: 'Open', MANAGEMENT_RESPONSE: 'Management Response',
  ACTION_PLAN: 'Action Plan', REMEDIATED: 'Remediated', VERIFIED: 'Verified',
  CLOSED: 'Closed', CANCELLED: 'Cancelled',
};

export class FindingService {
  constructor(
    private readonly repo: FindingRepository = new FindingRepository(),
  ) {}

  async list(input: ListFindingInput): Promise<{ items: FindingSummaryDto[]; total: number; page: number; pageSize: number }> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const { sortBy, sortOrder, search, engagementId, auditEntityId, category, severity, status, responsibleOwnerId, overdue } = input;

    const where: Prisma.FindingWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { auditEntity: { name: { contains: search, mode: 'insensitive' } } },
        { auditEntity: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (engagementId) where.engagementId = engagementId;
    if (auditEntityId) where.auditEntityId = auditEntityId;
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (responsibleOwnerId) where.responsibleOwnerId = responsibleOwnerId;

    if (overdue === true || overdue === 'true') {
      where.targetResolutionDate = { lt: new Date() };
      where.status = { notIn: ['CLOSED', 'VERIFIED', 'CANCELLED', 'REMEDIATED'] };
    }

    const sortCol: SortColumn = sortBy && (SORT_COLUMNS as readonly string[]).includes(sortBy)
      ? (sortBy as SortColumn)
      : 'createdAt';
    const orderBy: Prisma.FindingOrderByWithRelationInput = {
      [sortCol]: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    const [items, total] = await Promise.all([
      this.repo.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      this.repo.count(where),
    ]);

    return { items: items.map(mapFindingToSummary), total, page, pageSize };
  }

  async getById(id: string): Promise<FindingDetailDto> {
    const finding = await this.repo.findById(id);
    if (!finding) throw new NotFoundError('Finding not found');
    return mapFindingToDetail(finding);
  }

  async create(input: CreateFindingInput, userId: string): Promise<FindingDetailDto> {
    const entity = await prisma.auditUniverse.findUnique({ where: { id: input.auditEntityId } });
    if (!entity) throw new ValidationError('The specified audit entity does not exist', { auditEntityId: input.auditEntityId });

    const existing = await this.repo.findByReference(input.reference);
    if (existing) throw new ConflictError(`A finding with reference "${input.reference}" already exists`);

    if (input.engagementId) {
      const eng = await prisma.engagement.findUnique({ where: { id: input.engagementId } });
      if (!eng) throw new ValidationError('The specified engagement does not exist', { engagementId: input.engagementId });
    }

    if (input.responsibleOwnerId) {
      const user = await prisma.user.findUnique({ where: { id: input.responsibleOwnerId } });
      if (!user) throw new ValidationError('The specified responsible owner does not exist', { responsibleOwnerId: input.responsibleOwnerId });
    }

    const data: Prisma.FindingCreateInput = {
      reference: input.reference,
      title: input.title,
      auditEntity: { connect: { id: input.auditEntityId } },
      engagement: input.engagementId ? { connect: { id: input.engagementId } } : undefined,
      category: (input.category ?? 'OTHER') as FindingCategory,
      severity: (input.severity ?? 'MEDIUM') as FindingSeverity,
      condition: input.condition,
      criteria: input.criteria,
      cause: input.cause,
      impact: input.impact,
      recommendations: input.recommendations,
      responsibleOwner: input.responsibleOwnerId ? { connect: { id: input.responsibleOwnerId } } : undefined,
      targetResolutionDate: input.targetResolutionDate ? new Date(input.targetResolutionDate) : undefined,
      createdBy: { connect: { id: userId } },
      updatedBy: { connect: { id: userId } },
    };

    const created = await this.repo.create(data);
    return mapFindingToDetail(created);
  }

  async update(id: string, input: UpdateFindingInput, userId: string): Promise<FindingDetailDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Finding not found');

    if (existing.status === 'CLOSED' || existing.status === 'CANCELLED') {
      throw new ValidationError(`Cannot edit a finding that is ${STATUS_LABELS[existing.status].toLowerCase()}`);
    }

    if (input.auditEntityId && input.auditEntityId !== existing.auditEntityId) {
      const entity = await prisma.auditUniverse.findUnique({ where: { id: input.auditEntityId } });
      if (!entity) throw new ValidationError('The specified audit entity does not exist', { auditEntityId: input.auditEntityId });
    }

    if (input.engagementId !== undefined && input.engagementId !== null && input.engagementId !== existing.engagementId) {
      const eng = await prisma.engagement.findUnique({ where: { id: input.engagementId } });
      if (!eng) throw new ValidationError('The specified engagement does not exist', { engagementId: input.engagementId });
    }

    if (input.responsibleOwnerId !== undefined && input.responsibleOwnerId !== null && input.responsibleOwnerId !== existing.responsibleOwnerId) {
      const user = await prisma.user.findUnique({ where: { id: input.responsibleOwnerId } });
      if (!user) throw new ValidationError('The specified responsible owner does not exist', { responsibleOwnerId: input.responsibleOwnerId });
    }

    const data: Prisma.FindingUpdateInput = {
      updatedBy: { connect: { id: userId } },
    };

    if (input.title !== undefined) data.title = input.title;
    if (input.auditEntityId !== undefined) data.auditEntity = { connect: { id: input.auditEntityId } };
    if (input.engagementId !== undefined) data.engagement = input.engagementId ? { connect: { id: input.engagementId } } : { disconnect: true };
    if (input.category !== undefined) data.category = input.category as FindingCategory;
    if (input.severity !== undefined) data.severity = input.severity as FindingSeverity;
    if (input.condition !== undefined) data.condition = input.condition;
    if (input.criteria !== undefined) data.criteria = input.criteria;
    if (input.cause !== undefined) data.cause = input.cause;
    if (input.impact !== undefined) data.impact = input.impact;
    if (input.recommendations !== undefined) data.recommendations = input.recommendations;
    if (input.responsibleOwnerId !== undefined) data.responsibleOwner = input.responsibleOwnerId ? { connect: { id: input.responsibleOwnerId } } : { disconnect: true };
    if (input.targetResolutionDate !== undefined) data.targetResolutionDate = input.targetResolutionDate ? new Date(input.targetResolutionDate) : null;

    const updated = await this.repo.update(id, data);
    return mapFindingToDetail(updated);
  }

  async transition(
    id: string,
    newStatus: FindingStatus,
    userId: string,
    managementResponse?: string,
    verificationNotes?: string,
  ): Promise<FindingDetailDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Finding not found');

    if (!canTransitionFinding(existing.status, newStatus)) {
      throw new ValidationError(`Cannot transition from ${STATUS_LABELS[existing.status]} to ${STATUS_LABELS[newStatus]}`);
    }

    const data: Prisma.FindingUpdateInput = {
      status: newStatus,
      updatedBy: { connect: { id: userId } },
    };

    if (newStatus === 'MANAGEMENT_RESPONSE' && managementResponse) {
      data.managementResponse = managementResponse;
      data.managementRespondedAt = new Date();
      data.managementRespondedBy = { connect: { id: userId } };
    }

    if (newStatus === 'VERIFIED') {
      data.verifiedAt = new Date();
      data.verifiedBy = { connect: { id: userId } };
      if (verificationNotes) data.verificationNotes = verificationNotes;
    }

    if (newStatus === 'CLOSED') {
      data.closedAt = new Date();
    }

    const updated = await this.repo.update(id, data);
    return mapFindingToDetail(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Finding not found');

    if (existing.status !== 'DRAFT' && existing.status !== 'CANCELLED') {
      throw new ValidationError('Only draft or cancelled findings can be deleted');
    }

    await this.repo.delete(id);
  }

  async getDashboard(): Promise<FindingDashboardDto> {
    const all = await this.repo.findMany({
      where: {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const bySeverity: Record<FindingSeverity, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const byStatus: Record<FindingStatus, number> = {
      DRAFT: 0, OPEN: 0, MANAGEMENT_RESPONSE: 0, ACTION_PLAN: 0,
      REMEDIATED: 0, VERIFIED: 0, CLOSED: 0, CANCELLED: 0,
    };
    const byCategory: Partial<Record<FindingCategory, number>> = {};

    let overdueCount = 0;
    const now = new Date();

    for (const f of all) {
      bySeverity[f.severity]++;
      byStatus[f.status]++;
      byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;

      if (
        f.targetResolutionDate &&
        f.targetResolutionDate < now &&
        f.status !== 'CLOSED' && f.status !== 'VERIFIED' &&
        f.status !== 'CANCELLED' && f.status !== 'REMEDIATED'
      ) {
        overdueCount++;
      }
    }

    return {
      totalFindings: all.length,
      bySeverity,
      byStatus,
      byCategory,
      openCount: byStatus.OPEN + byStatus.MANAGEMENT_RESPONSE + byStatus.ACTION_PLAN,
      overdueCount,
      remediatedCount: byStatus.REMEDIATED,
      verifiedCount: byStatus.VERIFIED,
      closedCount: byStatus.CLOSED,
      recentFindings: all.slice(0, 5).map(mapFindingToSummary),
    };
  }
}

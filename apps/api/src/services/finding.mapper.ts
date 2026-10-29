import type { FindingWithRelations } from '../repositories/finding.repository.js';
import type { FindingSummaryDto, FindingDetailDto } from '@iams/shared';

function userName(user: FindingWithRelations['responsibleOwner']): string | null {
  if (!user) return null;
  return `${user.firstName} ${user.lastName}`.trim();
}

export function mapFindingToSummary(f: FindingWithRelations): FindingSummaryDto {
  const now = new Date();
  const isOverdue = Boolean(
    f.targetResolutionDate &&
    f.targetResolutionDate < now &&
    f.status !== 'CLOSED' &&
    f.status !== 'VERIFIED' &&
    f.status !== 'CANCELLED' &&
    f.status !== 'REMEDIATED',
  );

  return {
    id: f.id,
    reference: f.reference,
    title: f.title,
    engagementId: f.engagementId,
    engagementReference: f.engagement?.reference ?? null,
    auditEntityId: f.auditEntityId,
    auditEntityCode: f.auditEntity.code,
    auditEntityName: f.auditEntity.name,
    category: f.category,
    severity: f.severity,
    status: f.status,
    responsibleOwnerId: f.responsibleOwnerId,
    responsibleOwnerName: userName(f.responsibleOwner),
    targetResolutionDate: f.targetResolutionDate?.toISOString() ?? null,
    isOverdue,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

export function mapFindingToDetail(f: FindingWithRelations): FindingDetailDto {
  return {
    ...mapFindingToSummary(f),
    condition: f.condition,
    criteria: f.criteria,
    cause: f.cause,
    impact: f.impact,
    recommendations: f.recommendations,
    managementResponse: f.managementResponse,
    managementRespondedAt: f.managementRespondedAt?.toISOString() ?? null,
    managementRespondedById: f.managementRespondedById,
    managementRespondedByName: userName(f.managementRespondedBy),
    closedAt: f.closedAt?.toISOString() ?? null,
    verifiedAt: f.verifiedAt?.toISOString() ?? null,
    verifiedById: f.verifiedById,
    verifiedByName: userName(f.verifiedBy),
    verificationNotes: f.verificationNotes,
    createdById: f.createdById,
    createdByName: userName(f.createdBy),
  };
}

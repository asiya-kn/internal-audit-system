import type { AuditUniverseWithRelations } from '../repositories/auditUniverse.repository.js';
import type {
  AuditUniverseSummaryDto,
  AuditUniverseDetailDto,
} from '@iams/shared';

function ownerName(owner: AuditUniverseWithRelations['owner']): string | null {
  if (!owner) return null;
  return `${owner.firstName} ${owner.lastName}`.trim();
}

export function mapToSummary(entity: AuditUniverseWithRelations): AuditUniverseSummaryDto {
  return {
    id: entity.id,
    code: entity.code,
    name: entity.name,
    entityType: entity.entityType,
    status: entity.status,
    department: entity.department,
    parentId: entity.parentId,
    parentName: entity.parent?.name ?? null,
    ownerId: entity.ownerId,
    ownerName: ownerName(entity.owner),
    childCount: entity._count.children,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export function mapToDetail(entity: AuditUniverseWithRelations): AuditUniverseDetailDto {
  return {
    ...mapToSummary(entity),
    description: entity.description,
    businessProcess: entity.businessProcess,
    riskRating: entity.riskRating,
    notes: entity.notes,
    children: [],
  };
}

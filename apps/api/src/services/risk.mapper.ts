import type { RiskWithRelations, RiskActionWithRelations } from '../repositories/risk.repository.js';
import type { RiskSummaryDto, RiskDetailDto, RiskActionDto } from '@iams/shared';

function ownerName(owner: RiskWithRelations['owner']): string | null {
  if (!owner) return null;
  return `${owner.firstName} ${owner.lastName}`.trim();
}

function assigneeName(assignee: RiskActionWithRelations['assignee']): string | null {
  if (!assignee) return null;
  return `${assignee.firstName} ${assignee.lastName}`.trim();
}

function isActionOverdue(action: RiskActionWithRelations): boolean {
  if (!action.dueDate) return false;
  if (action.status === 'COMPLETED' || action.status === 'CANCELLED') return false;
  return new Date(action.dueDate) < new Date();
}

export function mapActionToDto(action: RiskActionWithRelations): RiskActionDto {
  return {
    id: action.id,
    riskId: action.riskId,
    title: action.title,
    description: action.description,
    assigneeId: action.assigneeId,
    assigneeName: assigneeName(action.assignee),
    dueDate: action.dueDate?.toISOString() ?? null,
    completedAt: action.completedAt?.toISOString() ?? null,
    status: action.status,
    createdAt: action.createdAt.toISOString(),
    updatedAt: action.updatedAt.toISOString(),
  };
}

export function mapRiskToSummary(risk: RiskWithRelations): RiskSummaryDto {
  const overdueCount = risk.actions.filter(isActionOverdue).length;

  return {
    id: risk.id,
    title: risk.title,
    auditEntityId: risk.auditEntityId,
    auditEntityCode: risk.auditEntity.code,
    auditEntityName: risk.auditEntity.name,
    inherentScore: risk.inherentScore,
    inherentLevel: risk.inherentLevel,
    residualScore: risk.residualScore,
    residualLevel: risk.residualLevel,
    controlEffectiveness: risk.controlEffectiveness,
    status: risk.status,
    riskCategory: risk.riskCategory,
    ownerId: risk.ownerId,
    ownerName: ownerName(risk.owner),
    actionCount: risk._count.actions,
    overdueActionCount: overdueCount,
    createdAt: risk.createdAt.toISOString(),
    updatedAt: risk.updatedAt.toISOString(),
  };
}

export function mapRiskToDetail(risk: RiskWithRelations): RiskDetailDto {
  return {
    ...mapRiskToSummary(risk),
    description: risk.description,
    inherentLikelihood: risk.inherentLikelihood,
    inherentImpact: risk.inherentImpact,
    existingControls: risk.existingControls,
    notes: risk.notes,
    actions: risk.actions.map(mapActionToDto),
  };
}

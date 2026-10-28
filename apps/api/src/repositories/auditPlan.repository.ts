import { prisma } from '../config/db.js';
import type { Prisma } from '../generated/client/index.js';

export type AuditPlanWithRelations = Prisma.AuditPlanGetPayload<{
  include: {
    auditEntity: { select: { id: true; code: true; name: true } };
    risk: { select: { id: true; title: true; inherentLevel: true; residualLevel: true } };
    leadAuditor: { select: { id: true; firstName: true; lastName: true } };
    approvedBy: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

const planInclude = {
  auditEntity: { select: { id: true, code: true, name: true } },
  risk: { select: { id: true, title: true, inherentLevel: true, residualLevel: true } },
  leadAuditor: { select: { id: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

export class AuditPlanRepository {
  async findById(id: string): Promise<AuditPlanWithRelations | null> {
    return prisma.auditPlan.findUnique({ where: { id }, include: planInclude });
  }

  async findByReference(reference: string): Promise<AuditPlanWithRelations | null> {
    return prisma.auditPlan.findUnique({ where: { reference }, include: planInclude });
  }

  async findMany(params: {
    where: Prisma.AuditPlanWhereInput;
    orderBy?: Prisma.AuditPlanOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }): Promise<AuditPlanWithRelations[]> {
    return prisma.auditPlan.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
      include: planInclude,
    });
  }

  async count(where: Prisma.AuditPlanWhereInput): Promise<number> {
    return prisma.auditPlan.count({ where });
  }

  async create(data: Prisma.AuditPlanCreateInput): Promise<AuditPlanWithRelations> {
    return prisma.auditPlan.create({ data, include: planInclude });
  }

  async update(id: string, data: Prisma.AuditPlanUpdateInput): Promise<AuditPlanWithRelations> {
    return prisma.auditPlan.update({ where: { id }, data, include: planInclude });
  }

  async delete(id: string): Promise<void> {
    await prisma.auditPlan.delete({ where: { id } });
  }
}

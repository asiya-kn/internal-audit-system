import { prisma } from '../config/db.js';
import type { Prisma } from '../generated/client/index.js';

export type RiskWithRelations = Prisma.RiskGetPayload<{
  include: {
    auditEntity: { select: { id: true; code: true; name: true } };
    owner: { select: { id: true; firstName: true; lastName: true } };
    actions: {
      include: {
        assignee: { select: { id: true; firstName: true; lastName: true } };
      };
    };
    _count: { select: { actions: true } };
  };
}>;

export type RiskActionWithRelations = Prisma.RiskActionGetPayload<{
  include: {
    assignee: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

const riskInclude = {
  auditEntity: { select: { id: true, code: true, name: true } },
  owner: { select: { id: true, firstName: true, lastName: true } },
  actions: {
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  _count: { select: { actions: true } },
} as const;

export class RiskRepository {
  async findById(id: string): Promise<RiskWithRelations | null> {
    return prisma.risk.findUnique({ where: { id }, include: riskInclude });
  }

  async findMany(params: {
    where: Prisma.RiskWhereInput;
    orderBy?: Prisma.RiskOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }): Promise<RiskWithRelations[]> {
    return prisma.risk.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
      include: riskInclude,
    });
  }

  async count(where: Prisma.RiskWhereInput): Promise<number> {
    return prisma.risk.count({ where });
  }

  async create(data: Prisma.RiskCreateInput): Promise<RiskWithRelations> {
    return prisma.risk.create({ data, include: riskInclude });
  }

  async update(id: string, data: Prisma.RiskUpdateInput): Promise<RiskWithRelations> {
    return prisma.risk.update({ where: { id }, data, include: riskInclude });
  }

  async delete(id: string): Promise<void> {
    await prisma.risk.delete({ where: { id } });
  }

  async findActionById(id: string): Promise<RiskActionWithRelations | null> {
    return prisma.riskAction.findUnique({
      where: { id },
      include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async createAction(data: Prisma.RiskActionCreateInput): Promise<RiskActionWithRelations> {
    return prisma.riskAction.create({
      data,
      include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async updateAction(id: string, data: Prisma.RiskActionUpdateInput): Promise<RiskActionWithRelations> {
    return prisma.riskAction.update({
      where: { id },
      data,
      include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async deleteAction(id: string): Promise<void> {
    await prisma.riskAction.delete({ where: { id } });
  }
}

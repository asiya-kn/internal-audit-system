import { prisma } from '../config/db.js';
import type { Prisma } from '../generated/client/index.js';

export type FindingWithRelations = Prisma.FindingGetPayload<{
  include: {
    engagement: { select: { id: true; reference: true } };
    auditEntity: { select: { id: true; code: true; name: true } };
    responsibleOwner: { select: { id: true; firstName: true; lastName: true } };
    managementRespondedBy: { select: { id: true; firstName: true; lastName: true } };
    verifiedBy: { select: { id: true; firstName: true; lastName: true } };
    createdBy: { select: { id: true; firstName: true; lastName: true } };
    updatedBy: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

const findingInclude = {
  engagement: { select: { id: true, reference: true } },
  auditEntity: { select: { id: true, code: true, name: true } },
  responsibleOwner: { select: { id: true, firstName: true, lastName: true } },
  managementRespondedBy: { select: { id: true, firstName: true, lastName: true } },
  verifiedBy: { select: { id: true, firstName: true, lastName: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  updatedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

export class FindingRepository {
  async findById(id: string): Promise<FindingWithRelations | null> {
    return prisma.finding.findUnique({ where: { id }, include: findingInclude });
  }

  async findByReference(reference: string): Promise<FindingWithRelations | null> {
    return prisma.finding.findUnique({ where: { reference }, include: findingInclude });
  }

  async findMany(params: {
    where: Prisma.FindingWhereInput;
    orderBy?: Prisma.FindingOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }): Promise<FindingWithRelations[]> {
    return prisma.finding.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
      include: findingInclude,
    });
  }

  async count(where: Prisma.FindingWhereInput): Promise<number> {
    return prisma.finding.count({ where });
  }

  async create(data: Prisma.FindingCreateInput): Promise<FindingWithRelations> {
    return prisma.finding.create({ data, include: findingInclude });
  }

  async update(id: string, data: Prisma.FindingUpdateInput): Promise<FindingWithRelations> {
    return prisma.finding.update({ where: { id }, data, include: findingInclude });
  }

  async delete(id: string): Promise<void> {
    await prisma.finding.delete({ where: { id } });
  }
}

import { prisma } from '../config/db.js';
import type { Prisma, AuditUniverse } from '../generated/client/index.js';

export type AuditUniverseWithRelations = Prisma.AuditUniverseGetPayload<{
  include: {
    parent: { select: { id: true; name: true } };
    owner: { select: { id: true; firstName: true; lastName: true } };
    createdBy: { select: { id: true; firstName: true; lastName: true } };
    updatedBy: { select: { id: true; firstName: true; lastName: true } };
    _count: { select: { children: true } };
  };
}>;

export class AuditUniverseRepository {
  async findById(id: string): Promise<AuditUniverseWithRelations | null> {
    return prisma.auditUniverse.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { children: true } },
      },
    });
  }

  async findByCode(code: string): Promise<AuditUniverse | null> {
    return prisma.auditUniverse.findUnique({ where: { code } });
  }

  async findChildren(parentId: string): Promise<AuditUniverse[]> {
    return prisma.auditUniverse.findMany({ where: { parentId } });
  }

  async count(params: {
    where: Prisma.AuditUniverseWhereInput;
  }): Promise<number> {
    return prisma.auditUniverse.count({ where: params.where });
  }

  async findMany(params: {
    where: Prisma.AuditUniverseWhereInput;
    orderBy?: Prisma.AuditUniverseOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }): Promise<AuditUniverseWithRelations[]> {
    return prisma.auditUniverse.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
      include: {
        parent: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { children: true } },
      },
    });
  }

  async create(data: Prisma.AuditUniverseCreateInput): Promise<AuditUniverseWithRelations> {
    return prisma.auditUniverse.create({
      data,
      include: {
        parent: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { children: true } },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.AuditUniverseUpdateInput,
  ): Promise<AuditUniverseWithRelations> {
    return prisma.auditUniverse.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { children: true } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.auditUniverse.delete({ where: { id } });
  }
}

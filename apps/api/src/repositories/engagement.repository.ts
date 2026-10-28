import { prisma } from '../config/db.js';
import type { Prisma } from '../generated/client/index.js';

export type EngagementWithRelations = Prisma.EngagementGetPayload<{
  include: {
    auditPlan: { select: { id: true; reference: true } };
    auditEntity: { select: { id: true; code: true; name: true } };
    risk: { select: { id: true; title: true; inherentLevel: true; residualLevel: true } };
    leadAuditor: { select: { id: true; firstName: true; lastName: true } };
    closedBy: { select: { id: true; firstName: true; lastName: true } };
    teamMembers: {
      include: {
        user: { select: { id: true; firstName: true; lastName: true; email: true } };
      };
    };
    _count: { select: { teamMembers: true } };
  };
}>;

export type TeamMemberWithRelations = Prisma.EngagementTeamMemberGetPayload<{
  include: {
    user: { select: { id: true; firstName: true; lastName: true; email: true } };
  };
}>;

const engagementInclude = {
  auditPlan: { select: { id: true, reference: true } },
  auditEntity: { select: { id: true, code: true, name: true } },
  risk: { select: { id: true, title: true, inherentLevel: true, residualLevel: true } },
  leadAuditor: { select: { id: true, firstName: true, lastName: true } },
  closedBy: { select: { id: true, firstName: true, lastName: true } },
  teamMembers: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
  _count: { select: { teamMembers: true } },
} as const;

export class EngagementRepository {
  async findById(id: string): Promise<EngagementWithRelations | null> {
    return prisma.engagement.findUnique({ where: { id }, include: engagementInclude });
  }

  async findByReference(reference: string): Promise<EngagementWithRelations | null> {
    return prisma.engagement.findUnique({ where: { reference }, include: engagementInclude });
  }

  async findMany(params: {
    where: Prisma.EngagementWhereInput;
    orderBy?: Prisma.EngagementOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }): Promise<EngagementWithRelations[]> {
    return prisma.engagement.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
      include: engagementInclude,
    });
  }

  async count(where: Prisma.EngagementWhereInput): Promise<number> {
    return prisma.engagement.count({ where });
  }

  async create(data: Prisma.EngagementCreateInput): Promise<EngagementWithRelations> {
    return prisma.engagement.create({ data, include: engagementInclude });
  }

  async update(id: string, data: Prisma.EngagementUpdateInput): Promise<EngagementWithRelations> {
    return prisma.engagement.update({ where: { id }, data, include: engagementInclude });
  }

  async delete(id: string): Promise<void> {
    await prisma.engagement.delete({ where: { id } });
  }

  async findTeamMember(engagementId: string, userId: string): Promise<TeamMemberWithRelations | null> {
    return prisma.engagementTeamMember.findUnique({
      where: { engagementId_userId: { engagementId, userId } },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async addTeamMember(data: Prisma.EngagementTeamMemberCreateInput): Promise<TeamMemberWithRelations> {
    return prisma.engagementTeamMember.create({
      data,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async updateTeamMember(engagementId: string, userId: string, data: Prisma.EngagementTeamMemberUpdateInput): Promise<TeamMemberWithRelations> {
    return prisma.engagementTeamMember.update({
      where: { engagementId_userId: { engagementId, userId } },
      data,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async removeTeamMember(engagementId: string, userId: string): Promise<void> {
    await prisma.engagementTeamMember.delete({
      where: { engagementId_userId: { engagementId, userId } },
    });
  }
}

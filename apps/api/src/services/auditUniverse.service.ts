import { prisma } from '../config/db.js';
import { AuditUniverseRepository } from '../repositories/auditUniverse.repository.js';
import { mapToSummary, mapToDetail } from './auditUniverse.mapper.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../utils/errors.js';
import type {
  AuditUniverseSummaryDto,
  AuditUniverseDetailDto,
  CreateAuditUniverseInput,
  UpdateAuditUniverseInput,
  ListAuditUniverseInput,
  AuditEntityStatus,
} from '@iams/shared';
import type { Prisma } from '../generated/client/index.js';

const SORT_COLUMNS = [
  'code',
  'name',
  'entityType',
  'status',
  'department',
  'createdAt',
  'updatedAt',
] as const;

type SortColumn = (typeof SORT_COLUMNS)[number];

export class AuditUniverseService {
  constructor(
    private readonly repo: AuditUniverseRepository = new AuditUniverseRepository(),
  ) {}

  async list(
    input: ListAuditUniverseInput,
  ): Promise<{ items: AuditUniverseSummaryDto[]; total: number; page: number; pageSize: number }> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const {
      sortBy,
      sortOrder,
      search,
      entityType,
      status,
      parentId,
      ownerId,
      department,
      includeArchived,
    } = input;

    const where: Prisma.AuditUniverseWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { businessProcess: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (entityType) where.entityType = entityType;
    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (ownerId) where.ownerId = ownerId;

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (status) {
      where.status = status;
    } else if (!includeArchived) {
      where.status = { not: 'ARCHIVED' };
    }

    const sortCol: SortColumn = sortBy && (SORT_COLUMNS as readonly string[]).includes(sortBy)
      ? (sortBy as SortColumn)
      : 'name';
    const orderBy: Prisma.AuditUniverseOrderByWithRelationInput = {
      [sortCol]: sortOrder === 'desc' ? 'desc' : 'asc',
    };

    const [items, total] = await Promise.all([
      this.repo.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.repo.count({ where }),
    ]);

    return {
      items: items.map(mapToSummary),
      total,
      page,
      pageSize,
    };
  }

  async getById(id: string): Promise<AuditUniverseDetailDto> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundError('Audit universe entity not found');
    return mapToDetail(entity);
  }

  async create(input: CreateAuditUniverseInput, userId: string): Promise<AuditUniverseDetailDto> {
    const existing = await this.repo.findByCode(input.code);
    if (existing) {
      throw new ConflictError(`An audit universe entity with code "${input.code}" already exists`);
    }

    if (input.parentId) {
      const parent = await this.repo.findById(input.parentId);
      if (!parent) {
        throw new ValidationError('The specified parent entity does not exist', { parentId: input.parentId });
      }
    }

    if (input.ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: input.ownerId } });
      if (!owner) {
        throw new ValidationError('The specified owner does not exist', { ownerId: input.ownerId });
      }
    }

    const created = await this.repo.create({
      code: input.code,
      name: input.name,
      description: input.description,
      entityType: input.entityType,
      status: input.status ?? 'ACTIVE',
      parent: input.parentId ? { connect: { id: input.parentId } } : undefined,
      businessProcess: input.businessProcess,
      department: input.department,
      riskRating: input.riskRating,
      notes: input.notes,
      owner: input.ownerId ? { connect: { id: input.ownerId } } : undefined,
      createdBy: { connect: { id: userId } },
      updatedBy: { connect: { id: userId } },
    });

    return mapToDetail(created);
  }

  async update(id: string, input: UpdateAuditUniverseInput, userId: string): Promise<AuditUniverseDetailDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Audit universe entity not found');

    if (input.code && input.code !== existing.code) {
      const conflict = await this.repo.findByCode(input.code);
      if (conflict && conflict.id !== id) {
        throw new ConflictError(`An audit universe entity with code "${input.code}" already exists`);
      }
    }

    if (input.parentId !== undefined && input.parentId !== null && input.parentId !== existing.parentId) {
      if (input.parentId === id) {
        throw new ValidationError('An entity cannot be its own parent');
      }
      const parent = await this.repo.findById(input.parentId);
      if (!parent) {
        throw new ValidationError('The specified parent entity does not exist', { parentId: input.parentId });
      }
      await this.assertNoCycle(id, input.parentId);
    }

    if (input.ownerId !== undefined && input.ownerId !== null && input.ownerId !== existing.ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: input.ownerId } });
      if (!owner) {
        throw new ValidationError('The specified owner does not exist', { ownerId: input.ownerId });
      }
    }

    const data: Prisma.AuditUniverseUpdateInput = {};
    if (input.code !== undefined) data.code = input.code;
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.entityType !== undefined) data.entityType = input.entityType;
    if (input.status !== undefined) data.status = input.status;
    if (input.businessProcess !== undefined) data.businessProcess = input.businessProcess;
    if (input.department !== undefined) data.department = input.department;
    if (input.riskRating !== undefined) data.riskRating = input.riskRating;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.ownerId !== undefined) {
      data.owner = input.ownerId ? { connect: { id: input.ownerId } } : { disconnect: true };
    }
    if (input.parentId !== undefined) {
      data.parent = input.parentId ? { connect: { id: input.parentId } } : { disconnect: true };
    }
    data.updatedBy = { connect: { id: userId } };

    const updated = await this.repo.update(id, data);
    return mapToDetail(updated);
  }

  async setStatus(
    id: string,
    status: AuditEntityStatus,
    userId: string,
  ): Promise<AuditUniverseDetailDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Audit universe entity not found');

    const updated = await this.repo.update(id, {
      status,
      updatedBy: { connect: { id: userId } },
    });
    return mapToDetail(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Audit universe entity not found');

    const children = await this.repo.findChildren(id);
    if (children.length > 0) {
      throw new ValidationError(
        'This entity cannot be deleted because it has child entities. Reassign or delete the children first.',
        { childCount: children.length },
      );
    }

    await this.repo.delete(id);
  }

  private async assertNoCycle(entityId: string, newParentId: string): Promise<void> {
    let currentId: string | null = newParentId;
    const visited = new Set<string>();
    while (currentId) {
      if (currentId === entityId) {
        throw new ValidationError(
          'The selected parent would create a circular hierarchy reference.',
          { parentId: newParentId },
        );
      }
      if (visited.has(currentId)) break;
      visited.add(currentId);
      const node = await this.repo.findById(currentId);
      currentId = node?.parentId ?? null;
    }
  }
}

import { z } from 'zod';
import { AUDIT_ENTITY_TYPES, AUDIT_ENTITY_STATUSES } from '@iams/shared';
import { paginationSchema } from './auth.schema.js';

export const entityTypeSchema = z.enum(AUDIT_ENTITY_TYPES as [string, ...string[]]);
export const entityStatusSchema = z.enum(AUDIT_ENTITY_STATUSES as [string, ...string[]]);

export const createAuditUniverseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(50, 'Code must not exceed 50 characters')
    .regex(/^[A-Za-z0-9\-_.]+$/, 'Code may only contain letters, numbers, dashes, underscores and dots'),
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name must not exceed 200 characters'),
  description: z.string().max(2000, 'Description must not exceed 2000 characters').optional(),
  entityType: entityTypeSchema,
  status: entityStatusSchema.optional(),
  parentId: z.string().uuid('Parent must be a valid UUID').nullable().optional(),
  businessProcess: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  riskRating: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  ownerId: z.string().uuid('Owner must be a valid UUID').nullable().optional(),
});

export const updateAuditUniverseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(50, 'Code must not exceed 50 characters')
    .regex(/^[A-Za-z0-9\-_.]+$/, 'Code may only contain letters, numbers, dashes, underscores and dots')
    .optional(),
  name: z.string().trim().min(1, 'Name is required').max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  entityType: entityTypeSchema.optional(),
  status: entityStatusSchema.optional(),
  parentId: z.string().uuid().nullable().optional(),
  businessProcess: z.string().max(200).nullable().optional(),
  department: z.string().max(200).nullable().optional(),
  riskRating: z.string().max(50).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

export const listAuditUniverseSchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
  entityType: entityTypeSchema.optional(),
  status: entityStatusSchema.optional(),
  parentId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  department: z.string().max(200).optional(),
  includeArchived: z.coerce.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('A valid UUID is required'),
});

export type CreateAuditUniverseInput = z.infer<typeof createAuditUniverseSchema>;
export type UpdateAuditUniverseInput = z.infer<typeof updateAuditUniverseSchema>;
export type ListAuditUniverseInput = z.infer<typeof listAuditUniverseSchema>;

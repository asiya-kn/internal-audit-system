import { z } from 'zod';
import { FINDING_CATEGORIES, FINDING_SEVERITIES, FINDING_STATUSES } from '@iams/shared';
import { paginationSchema, uuidSchema } from './auth.schema.js';

export const findingCategorySchema = z.enum(FINDING_CATEGORIES as [string, ...string[]]);
export const findingSeveritySchema = z.enum(FINDING_SEVERITIES as [string, ...string[]]);
export const findingStatusSchema = z.enum(FINDING_STATUSES as [string, ...string[]]);

export const createFindingSchema = z.object({
  reference: z.string().trim().min(1, 'Reference is required').max(100, 'Reference must not exceed 100 characters')
    .regex(/^[A-Za-z0-9\-_.]+$/, 'Only letters, numbers, dashes, underscores and dots are allowed'),
  title: z.string().trim().min(1, 'Title is required').max(500, 'Title must not exceed 500 characters'),
  engagementId: z.string().uuid().nullable().optional(),
  auditEntityId: z.string().uuid('A valid audit entity is required'),
  category: findingCategorySchema.optional(),
  severity: findingSeveritySchema.optional(),
  condition: z.string().trim().min(1, 'Condition is required').max(10000),
  criteria: z.string().max(10000).optional(),
  cause: z.string().max(10000).optional(),
  impact: z.string().max(10000).optional(),
  recommendations: z.string().max(10000).optional(),
  responsibleOwnerId: z.string().uuid().nullable().optional(),
  targetResolutionDate: z.string().datetime().nullable().optional(),
});

export const updateFindingSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  engagementId: z.string().uuid().nullable().optional(),
  auditEntityId: z.string().uuid().optional(),
  category: findingCategorySchema.optional(),
  severity: findingSeveritySchema.optional(),
  condition: z.string().trim().min(1).max(10000).optional(),
  criteria: z.string().max(10000).nullable().optional(),
  cause: z.string().max(10000).nullable().optional(),
  impact: z.string().max(10000).nullable().optional(),
  recommendations: z.string().max(10000).nullable().optional(),
  responsibleOwnerId: z.string().uuid().nullable().optional(),
  targetResolutionDate: z.string().datetime().nullable().optional(),
});

export const listFindingSchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
  engagementId: z.string().uuid().optional(),
  auditEntityId: z.string().uuid().optional(),
  category: findingCategorySchema.optional(),
  severity: findingSeveritySchema.optional(),
  status: findingStatusSchema.optional(),
  responsibleOwnerId: z.string().uuid().optional(),
  overdue: z.enum(['true', 'false']).optional(),
});

export const transitionFindingSchema = z.object({
  status: findingStatusSchema,
  managementResponse: z.string().max(10000).optional(),
  verificationNotes: z.string().max(10000).optional(),
});

export const findingIdParamSchema = z.object({
  id: uuidSchema,
});

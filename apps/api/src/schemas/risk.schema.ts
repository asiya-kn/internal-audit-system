import { z } from 'zod';
import { RISK_LEVELS, RISK_STATUSES, ACTION_STATUSES } from '@iams/shared';
import { paginationSchema } from './auth.schema.js';

export const riskLevelSchema = z.enum(RISK_LEVELS as [string, ...string[]]);
export const riskStatusSchema = z.enum(RISK_STATUSES as [string, ...string[]]);
export const actionStatusSchema = z.enum(ACTION_STATUSES as [string, ...string[]]);

const riskScore = z.coerce.number().int().min(1, 'Must be at least 1').max(5, 'Must not exceed 5');
const controlPct = z.coerce.number().int().min(0, 'Must be at least 0').max(100, 'Must not exceed 100');

export const createRiskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300, 'Title must not exceed 300 characters'),
  description: z.string().max(2000).optional(),
  auditEntityId: z.string().uuid('A valid audit entity is required'),
  inherentLikelihood: riskScore,
  inherentImpact: riskScore,
  existingControls: z.string().max(2000).optional(),
  controlEffectiveness: controlPct.optional(),
  riskCategory: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

export const updateRiskSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  auditEntityId: z.string().uuid().optional(),
  inherentLikelihood: riskScore.optional(),
  inherentImpact: riskScore.optional(),
  existingControls: z.string().max(2000).nullable().optional(),
  controlEffectiveness: controlPct.optional(),
  status: riskStatusSchema.optional(),
  riskCategory: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

export const listRiskSchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
  auditEntityId: z.string().uuid().optional(),
  status: riskStatusSchema.optional(),
  inherentLevel: riskLevelSchema.optional(),
  residualLevel: riskLevelSchema.optional(),
  ownerId: z.string().uuid().optional(),
  riskCategory: z.string().max(200).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('A valid UUID is required'),
});

export const createActionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: actionStatusSchema.optional(),
});

export const updateActionSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  status: actionStatusSchema.optional(),
});

export type CreateRiskInput = z.infer<typeof createRiskSchema>;
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>;
export type ListRiskInput = z.infer<typeof listRiskSchema>;
export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;

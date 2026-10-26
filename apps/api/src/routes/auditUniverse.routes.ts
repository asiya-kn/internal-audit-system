import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createAuditUniverseSchema,
  updateAuditUniverseSchema,
  listAuditUniverseSchema,
  idParamSchema,
} from '../schemas/auditUniverse.schema.js';
import { z } from 'zod';
import {
  listEntities,
  getEntity,
  createEntity,
  updateEntity,
  setEntityStatus,
  deleteEntity,
} from '../controllers/auditUniverse.controller.js';

const router = Router();

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
});

router.get(
  '/',
  authenticate,
  requirePermission('audit_universe.view'),
  validateQuery(listAuditUniverseSchema),
  listEntities,
);

router.get(
  '/:id',
  authenticate,
  requirePermission('audit_universe.view'),
  validateParams(idParamSchema),
  getEntity,
);

router.post(
  '/',
  authenticate,
  requirePermission('audit_universe.create'),
  validateBody(createAuditUniverseSchema),
  createEntity,
);

router.put(
  '/:id',
  authenticate,
  requirePermission('audit_universe.update'),
  validateParams(idParamSchema),
  validateBody(updateAuditUniverseSchema),
  updateEntity,
);

router.patch(
  '/:id/status',
  authenticate,
  requirePermission('audit_universe.update'),
  validateParams(idParamSchema),
  validateBody(statusSchema),
  setEntityStatus,
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('audit_universe.delete'),
  validateParams(idParamSchema),
  deleteEntity,
);

export default router;

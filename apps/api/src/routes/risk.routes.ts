import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createRiskSchema,
  updateRiskSchema,
  listRiskSchema,
  idParamSchema,
  createActionSchema,
  updateActionSchema,
} from '../schemas/risk.schema.js';
import { z } from 'zod';
import {
  listRisks,
  getRisk,
  createRisk,
  updateRisk,
  deleteRisk,
  getDashboard,
  createAction,
  updateAction,
  deleteAction,
} from '../controllers/risk.controller.js';

const router = Router();

router.get('/dashboard', authenticate, requirePermission('risk.view'), getDashboard);

router.get('/', authenticate, requirePermission('risk.view'), validateQuery(listRiskSchema), listRisks);

router.get('/:id', authenticate, requirePermission('risk.view'), validateParams(idParamSchema), getRisk);

router.post('/', authenticate, requirePermission('risk.create'), validateBody(createRiskSchema), createRisk);

router.put('/:id', authenticate, requirePermission('risk.update'), validateParams(idParamSchema), validateBody(updateRiskSchema), updateRisk);

router.delete('/:id', authenticate, requirePermission('risk.delete'), validateParams(idParamSchema), deleteRisk);

const actionParamsSchema = z.object({
  id: z.string().uuid(),
  actionId: z.string().uuid(),
});

// Actions nested under a risk
router.post('/:riskId/actions', authenticate, requirePermission('risk.update'), validateBody(createActionSchema), createAction);
router.put('/:id/actions/:actionId', authenticate, requirePermission('risk.update'), validateParams(actionParamsSchema), validateBody(updateActionSchema), updateAction);
router.delete('/:id/actions/:actionId', authenticate, requirePermission('risk.update'), validateParams(actionParamsSchema), deleteAction);

export default router;

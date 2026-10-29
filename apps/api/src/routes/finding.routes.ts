import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createFindingSchema,
  updateFindingSchema,
  listFindingSchema,
  transitionFindingSchema,
  findingIdParamSchema,
} from '../schemas/finding.schema.js';
import {
  listFindings,
  getFinding,
  createFinding,
  updateFinding,
  transitionFinding,
  deleteFinding,
  getFindingDashboard,
} from '../controllers/finding.controller.js';

const router = Router();

router.get('/dashboard', authenticate, requirePermission('findings.view'), getFindingDashboard);

router.get('/', authenticate, requirePermission('findings.view'), validateQuery(listFindingSchema), listFindings);

router.get('/:id', authenticate, requirePermission('findings.view'), validateParams(findingIdParamSchema), getFinding);

router.post('/', authenticate, requirePermission('findings.create'), validateBody(createFindingSchema), createFinding);

router.put('/:id', authenticate, requirePermission('findings.update'), validateParams(findingIdParamSchema), validateBody(updateFindingSchema), updateFinding);

router.patch('/:id/status', authenticate, requirePermission('findings.update'), validateParams(findingIdParamSchema), validateBody(transitionFindingSchema), transitionFinding);

router.delete('/:id', authenticate, requirePermission('findings.update'), validateParams(findingIdParamSchema), deleteFinding);

export default router;

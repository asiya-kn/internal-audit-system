import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createAuditPlanSchema,
  updateAuditPlanSchema,
  listAuditPlanSchema,
  transitionAuditPlanSchema,
  idParamSchema,
} from '../schemas/auditPlan.schema.js';
import {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  transitionPlan,
  deletePlan,
  getPlanDashboard,
} from '../controllers/auditPlan.controller.js';

const router = Router();

router.get('/dashboard', authenticate, requirePermission('audit_plan.view'), getPlanDashboard);

router.get('/', authenticate, requirePermission('audit_plan.view'), validateQuery(listAuditPlanSchema), listPlans);

router.get('/:id', authenticate, requirePermission('audit_plan.view'), validateParams(idParamSchema), getPlan);

router.post('/', authenticate, requirePermission('audit_plan.create'), validateBody(createAuditPlanSchema), createPlan);

router.put('/:id', authenticate, requirePermission('audit_plan.update'), validateParams(idParamSchema), validateBody(updateAuditPlanSchema), updatePlan);

router.patch('/:id/status', authenticate, requirePermission('audit_plan.approve'), validateParams(idParamSchema), validateBody(transitionAuditPlanSchema), transitionPlan);

router.delete('/:id', authenticate, requirePermission('audit_plan.update'), validateParams(idParamSchema), deletePlan);

export default router;

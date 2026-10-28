import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createEngagementSchema,
  updateEngagementSchema,
  listEngagementSchema,
  transitionEngagementSchema,
  addTeamMemberSchema,
  updateTeamMemberSchema,
  idParamSchema,
  teamMemberParamsSchema,
} from '../schemas/engagement.schema.js';
import {
  listEngagements,
  getEngagement,
  createEngagement,
  updateEngagement,
  transitionEngagement,
  deleteEngagement,
  getEngagementDashboard,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
} from '../controllers/engagement.controller.js';

const router = Router();

router.get('/dashboard', authenticate, requirePermission('engagements.view'), getEngagementDashboard);

router.get('/', authenticate, requirePermission('engagements.view'), validateQuery(listEngagementSchema), listEngagements);

router.get('/:id', authenticate, requirePermission('engagements.view'), validateParams(idParamSchema), getEngagement);

router.post('/', authenticate, requirePermission('engagements.create'), validateBody(createEngagementSchema), createEngagement);

router.put('/:id', authenticate, requirePermission('engagements.update'), validateParams(idParamSchema), validateBody(updateEngagementSchema), updateEngagement);

router.patch('/:id/status', authenticate, requirePermission('engagements.update'), validateParams(idParamSchema), validateBody(transitionEngagementSchema), transitionEngagement);

router.delete('/:id', authenticate, requirePermission('engagements.update'), validateParams(idParamSchema), deleteEngagement);

// Team members nested under an engagement
router.post('/:id/team-members', authenticate, requirePermission('engagements.assign'), validateParams(idParamSchema), validateBody(addTeamMemberSchema), addTeamMember);
router.put('/:id/team-members/:userId', authenticate, requirePermission('engagements.assign'), validateParams(teamMemberParamsSchema), validateBody(updateTeamMemberSchema), updateTeamMember);
router.delete('/:id/team-members/:userId', authenticate, requirePermission('engagements.assign'), validateParams(teamMemberParamsSchema), removeTeamMember);

export default router;

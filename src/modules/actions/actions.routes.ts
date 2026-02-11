import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { validateRole } from '../../middlewares/role.middleware.js';
import { Role } from '@prisma/client';
import { ActionsController } from './actions.controller.js';
import {
  actionIdParamSchema,
  createActionSchema,
  updateActionSchema
} from './actions.dto.js';

const router = Router();
const controller = new ActionsController();

// All routes here require ADMIN access
// Note: validateKeycloakToken must come first to populate req.user
router.use(validateKeycloakToken);
router.use(validateRole([Role.ADMIN]));

router.get('/', asyncHandler(controller.getActions));
router.get(
  '/:id',
  validateRequest(actionIdParamSchema),
  asyncHandler(controller.getAction)
);
router.post(
  '/',
  validateRequest(createActionSchema),
  asyncHandler(controller.createAction)
);
router.put(
  '/:id',
  validateRequest(updateActionSchema),
  asyncHandler(controller.updateAction)
);
router.delete(
  '/:id',
  validateRequest(actionIdParamSchema),
  asyncHandler(controller.deleteAction)
);
router.put(
  '/validate-transfer-ortho/:id',
  validateRequest(actionIdParamSchema),
  asyncHandler(controller.validateTransferToOrtho)
);
router.put(
  '/validate-transfer-paro/:id',
  validateRequest(actionIdParamSchema),
  asyncHandler(controller.validateTransferToParo)
);

export default router;

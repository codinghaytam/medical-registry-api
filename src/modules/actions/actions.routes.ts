import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { ActionsController } from './actions.controller.js';
import {
  actionIdParamSchema,
  createActionSchema,
  updateActionSchema
} from './actions.dto.js';

const router = Router();
const controller = new ActionsController();

router.get('/', validateKeycloakToken, asyncHandler(controller.getActions));
router.get(
  '/:id',
  validateKeycloakToken,
  validateRequest(actionIdParamSchema),
  asyncHandler(controller.getAction)
);
router.post(
  '/',
  validateKeycloakToken,
  validateRequest(createActionSchema),
  asyncHandler(controller.createAction)
);
router.put(
  '/:id',
  validateKeycloakToken,
  validateRequest(updateActionSchema),
  asyncHandler(controller.updateAction)
);
router.delete(
  '/:id',
  validateKeycloakToken,
  validateRequest(actionIdParamSchema),
  asyncHandler(controller.deleteAction)
);
router.put(
  '/validate-transfer-ortho/:id',
  validateKeycloakToken,
  validateRequest(actionIdParamSchema),
  asyncHandler(controller.validateTransferToOrtho)
);
router.put(
  '/validate-transfer-paro/:id',
  validateKeycloakToken,
  validateRequest(actionIdParamSchema),
  asyncHandler(controller.validateTransferToParo)
);

export default router;

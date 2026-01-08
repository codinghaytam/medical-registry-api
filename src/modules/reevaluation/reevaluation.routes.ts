import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { uploadMultipleImages } from '../../utils/upload.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import {
  createReevaluationSchema,
  reevaluationIdParamSchema,
  updateReevaluationSchema
} from './reevaluation.dto.js';
import { ReevaluationController } from './reevaluation.controller.js';

const router = Router();
const controller = new ReevaluationController();

router.get('/', validateKeycloakToken, asyncHandler(controller.getReevaluations));
router.get(
  '/:id',
  validateKeycloakToken,
  validateRequest(reevaluationIdParamSchema),
  asyncHandler(controller.getReevaluation)
);
router.post(
  '/',
  validateKeycloakToken,
  uploadMultipleImages,
  validateRequest(createReevaluationSchema),
  asyncHandler(controller.createReevaluation)
);
router.put(
  '/:id',
  validateKeycloakToken,
  uploadMultipleImages,
  validateRequest(updateReevaluationSchema),
  asyncHandler(controller.updateReevaluation)
);
router.delete(
  '/:id',
  validateKeycloakToken,
  validateRequest(reevaluationIdParamSchema),
  asyncHandler(controller.deleteReevaluation)
);

export default router;

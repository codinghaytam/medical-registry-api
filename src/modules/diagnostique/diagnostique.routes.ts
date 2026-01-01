import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import {
  createDiagnostiqueSchema,
  diagnostiqueIdParamSchema,
  updateDiagnostiqueSchema
} from './diagnostique.dto.js';
import { DiagnostiqueController } from './diagnostique.controller.js';

const router = Router();
const controller = new DiagnostiqueController();

router.get('/', validateKeycloakToken, asyncHandler(controller.getDiagnostiques));
router.get(
  '/:id',
  validateKeycloakToken,
  validateRequest(diagnostiqueIdParamSchema),
  asyncHandler(controller.getDiagnostique)
);
router.post(
  '/',
  validateKeycloakToken,
  validateRequest(createDiagnostiqueSchema),
  asyncHandler(controller.createDiagnostique)
);
router.put(
  '/:id',
  validateKeycloakToken,
  validateRequest(updateDiagnostiqueSchema),
  asyncHandler(controller.updateDiagnostique)
);
router.delete(
  '/:id',
  validateKeycloakToken,
  validateRequest(diagnostiqueIdParamSchema),
  asyncHandler(controller.deleteDiagnostique)
);

export default router;

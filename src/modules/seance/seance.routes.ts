import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import {
  createSeanceSchema,
  seanceIdParamSchema,
  updateSeanceSchema
} from './seance.dto.js';
import { SeanceController } from './seance.controller.js';

const router = Router();
const controller = new SeanceController();

router.get('/', validateKeycloakToken, asyncHandler(controller.getSeances));
router.get(
  '/:id',
  validateKeycloakToken,
  validateRequest(seanceIdParamSchema),
  asyncHandler(controller.getSeance)
);
router.post(
  '/',
  validateKeycloakToken,
  validateRequest(createSeanceSchema),
  asyncHandler(controller.createSeance)
);
router.put(
  '/:id',
  validateKeycloakToken,
  validateRequest(updateSeanceSchema),
  asyncHandler(controller.updateSeance)
);
router.delete(
  '/:id',
  validateKeycloakToken,
  validateRequest(seanceIdParamSchema),
  asyncHandler(controller.deleteSeance)
);

export default router;

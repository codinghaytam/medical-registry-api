import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { validateRole } from '../../middlewares/role.middleware.js';
import { Role } from '@prisma/client';
import {
  createSeanceSchema,
  seanceIdParamSchema,
  updateSeanceSchema
} from './seance.dto.js';
import { SeanceController } from './seance.controller.js';

const router = Router();
const controller = new SeanceController();

// All routes require authentication
router.use(validateKeycloakToken);

// Read Routes - Public to authenticated users (with filtering in service)
router.get(
  '/',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  asyncHandler(controller.getSeances)
);
router.get(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  validateRequest(seanceIdParamSchema),
  asyncHandler(controller.getSeance)
);

// Write Routes - strictly ADMIN and MEDECIN
router.post(
  '/',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(createSeanceSchema),
  asyncHandler(controller.createSeance)
);
router.put(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(updateSeanceSchema),
  asyncHandler(controller.updateSeance)
);
router.delete(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(seanceIdParamSchema),
  asyncHandler(controller.deleteSeance)
);

export default router;

import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { validatePhone } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { validateRole } from '../../middlewares/role.middleware.js';
import { Role } from '@prisma/client';
import {
  createEtudiantSchema,
  etudiantIdParamSchema,
  updateEtudiantSchema
} from './etudiant.dto.js';
import { EtudiantController } from './etudiant.controller.js';

const router = Router();
const controller = new EtudiantController();

// All routes require authentication
router.use(validateKeycloakToken);

// Read Routes - Public to authenticated users
router.get(
  '/',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  asyncHandler(controller.getEtudiants)
);
router.get(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  validateRequest(etudiantIdParamSchema),
  asyncHandler(controller.getEtudiant)
);

// Write Routes - strictly ADMIN
router.post(
  '/',
  validateRole([Role.ADMIN]),
  validatePhone,
  validateRequest(createEtudiantSchema),
  asyncHandler(controller.createEtudiant)
);
router.put(
  '/:id',
  validateRole([Role.ADMIN]),
  validatePhone,
  validateRequest(updateEtudiantSchema),
  asyncHandler(controller.updateEtudiant)
);
router.delete(
  '/:id',
  validateRole([Role.ADMIN]),
  validateRequest(etudiantIdParamSchema),
  asyncHandler(controller.deleteEtudiant)
);

export default router;

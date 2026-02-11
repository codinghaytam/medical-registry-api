import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { validatePhone } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { validateRole } from '../../middlewares/role.middleware.js';
import { Role } from '@prisma/client';
import {
  createMedecinSchema,
  medecinEmailParamSchema,
  medecinIdParamSchema,
  medecinProfessionParamSchema,
  updateMedecinSchema
} from './medecin.dto.js';
import { MedecinController } from './medecin.controller.js';

const router = Router();
const controller = new MedecinController();

// All routes require authentication
router.use(validateKeycloakToken);

// Read Routes - Public to authenticated users
router.get(
  '/',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  asyncHandler(controller.getMedecins)
);
router.get(
  '/profession/:profession',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  validateRequest(medecinProfessionParamSchema),
  asyncHandler(controller.getByProfession)
);
router.get(
  '/email/:email',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  validateRequest(medecinEmailParamSchema),
  asyncHandler(controller.getByEmail)
);
router.get(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  validateRequest(medecinIdParamSchema),
  asyncHandler(controller.getMedecin)
);

// Write Routes - strictly ADMIN
router.post(
  '/',
  validateRole([Role.ADMIN]),
  validatePhone,
  validateRequest(createMedecinSchema),
  asyncHandler(controller.createMedecin)
);
router.put(
  '/:id',
  validateRole([Role.ADMIN]),
  validatePhone,
  validateRequest(updateMedecinSchema),
  asyncHandler(controller.updateMedecin)
);
router.delete(
  '/:id',
  validateRole([Role.ADMIN]),
  validateRequest(medecinIdParamSchema),
  asyncHandler(controller.deleteMedecin)
);

export default router;

import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { validatePhone } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import {
  createEtudiantSchema,
  etudiantIdParamSchema,
  updateEtudiantSchema
} from './etudiant.dto.js';
import { EtudiantController } from './etudiant.controller.js';

const router = Router();
const controller = new EtudiantController();

router.get('/', validateKeycloakToken, asyncHandler(controller.getEtudiants));
router.get(
  '/:id',
  validateKeycloakToken,
  validateRequest(etudiantIdParamSchema),
  asyncHandler(controller.getEtudiant)
);
router.post(
  '/',
  validateKeycloakToken,
  validatePhone,
  validateRequest(createEtudiantSchema),
  asyncHandler(controller.createEtudiant)
);
router.put(
  '/:id',
  validateKeycloakToken,
  validatePhone,
  validateRequest(updateEtudiantSchema),
  asyncHandler(controller.updateEtudiant)
);
router.delete(
  '/:id',
  validateKeycloakToken,
  validateRequest(etudiantIdParamSchema),
  asyncHandler(controller.deleteEtudiant)
);

export default router;

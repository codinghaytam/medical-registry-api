import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { validatePhone } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
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

router.get('/', validateKeycloakToken, asyncHandler(controller.getMedecins));
router.get(
  '/profession/:profession',
  validateKeycloakToken,
  validateRequest(medecinProfessionParamSchema),
  asyncHandler(controller.getByProfession)
);
router.get(
  '/email/:email',
  validateKeycloakToken,
  validateRequest(medecinEmailParamSchema),
  asyncHandler(controller.getByEmail)
);
router.get(
  '/:id',
  validateKeycloakToken,
  validateRequest(medecinIdParamSchema),
  asyncHandler(controller.getMedecin)
);
router.post(
  '/',
  validateKeycloakToken,
  validatePhone,
  validateRequest(createMedecinSchema),
  asyncHandler(controller.createMedecin)
);
router.put(
  '/:id',
  validateKeycloakToken,
  validatePhone,
  validateRequest(updateMedecinSchema),
  asyncHandler(controller.updateMedecin)
);
router.delete(
  '/:id',
  validateKeycloakToken,
  validateRequest(medecinIdParamSchema),
  asyncHandler(controller.deleteMedecin)
);

export default router;

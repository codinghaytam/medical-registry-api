import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import {
  addDiagnosisSchema,
  consultationIdParamSchema,
  createConsultationSchema,
  updateConsultationSchema,
  updateDiagnosisSchema
} from './consultation.dto.js';
import { ConsultationController } from './consultation.controller.js';

const router = Router();
const controller = new ConsultationController();

router.get('/', validateKeycloakToken, asyncHandler(controller.getConsultations));
router.get(
  '/:id',
  validateKeycloakToken,
  validateRequest(consultationIdParamSchema),
  asyncHandler(controller.getConsultation)
);
router.post(
  '/',
  validateKeycloakToken,
  validateRequest(createConsultationSchema),
  asyncHandler(controller.createConsultation)
);
router.post(
  '/:id/diagnosis',
  validateKeycloakToken,
  validateRequest(addDiagnosisSchema),
  asyncHandler(controller.addDiagnosis)
);
router.put(
  '/:id',
  validateKeycloakToken,
  validateRequest(updateConsultationSchema),
  asyncHandler(controller.updateConsultation)
);
router.put(
  '/diagnosis/:diagnosisId',
  validateKeycloakToken,
  validateRequest(updateDiagnosisSchema),
  asyncHandler(controller.updateDiagnosis)
);
router.delete(
  '/:id',
  validateKeycloakToken,
  validateRequest(consultationIdParamSchema),
  asyncHandler(controller.deleteConsultation)
);

export default router;

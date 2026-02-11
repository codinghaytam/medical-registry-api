import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { validateRole } from '../../middlewares/role.middleware.js';
import { Role } from '@prisma/client';
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

// All routes require authentication
router.use(validateKeycloakToken);

// Read Routes - Public to authenticated users (with filtering in service)
router.get(
  '/',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  asyncHandler(controller.getConsultations)
);
router.get(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  validateRequest(consultationIdParamSchema),
  asyncHandler(controller.getConsultation)
);

// Write Routes - strictly ADMIN and MEDECIN
router.post(
  '/',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(createConsultationSchema),
  asyncHandler(controller.createConsultation)
);
router.post(
  '/:id/diagnosis',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(addDiagnosisSchema),
  asyncHandler(controller.addDiagnosis)
);
router.put(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(updateConsultationSchema),
  asyncHandler(controller.updateConsultation)
);
router.put(
  '/diagnosis/:diagnosisId',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(updateDiagnosisSchema),
  asyncHandler(controller.updateDiagnosis)
);
router.delete(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(consultationIdParamSchema),
  asyncHandler(controller.deleteConsultation)
);

export default router;

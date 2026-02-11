import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { validateRole } from '../../middlewares/role.middleware.js';
import { Role } from '@prisma/client';
import {
  createPatientSchema,
  patientIdParamSchema,
  transferSchema,
  updatePatientSchema,
  validateTransferSchema
} from './patient.dto.js';
import { PatientController } from './patient.controller.js';

const router = Router();
const controller = new PatientController();

// All routes require authentication
router.use(validateKeycloakToken);

// Read Routes - Accessible by ADMIN, MEDECIN, ETUDIANT
router.get(
  '/',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  asyncHandler(controller.getPatients)
);
router.get(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  validateRequest(patientIdParamSchema),
  asyncHandler(controller.getPatient)
);

// Write Routes - accessible ONLY by ADMIN and MEDECIN (Students are Read-Only)
router.post(
  '/',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(createPatientSchema),
  asyncHandler(controller.createPatient)
);
router.put(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(updatePatientSchema),
  asyncHandler(controller.updatePatient)
);
router.delete(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(patientIdParamSchema),
  asyncHandler(controller.deletePatient)
);
router.put(
  '/Paro-Ortho/:id',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(transferSchema),
  asyncHandler(controller.transferParoToOrtho)
);
router.put(
  '/Ortho-Paro/:id',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(transferSchema),
  asyncHandler(controller.transferOrthoToParo)
);
router.put(
  '/validate-transfer/:actionId',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(validateTransferSchema),
  asyncHandler(controller.validateTransfer)
);

export default router;

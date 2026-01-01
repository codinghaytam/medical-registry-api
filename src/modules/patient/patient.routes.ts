import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
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

router.get('/', validateKeycloakToken, asyncHandler(controller.getPatients));
router.get(
  '/:id',
  validateKeycloakToken,
  validateRequest(patientIdParamSchema),
  asyncHandler(controller.getPatient)
);
router.post(
  '/',
  validateKeycloakToken,
  validateRequest(createPatientSchema),
  asyncHandler(controller.createPatient)
);
router.put(
  '/:id',
  validateKeycloakToken,
  validateRequest(updatePatientSchema),
  asyncHandler(controller.updatePatient)
);
router.delete(
  '/:id',
  validateKeycloakToken,
  validateRequest(patientIdParamSchema),
  asyncHandler(controller.deletePatient)
);
router.put(
  '/Paro-Ortho/:id',
  validateKeycloakToken,
  validateRequest(transferSchema),
  asyncHandler(controller.transferParoToOrtho)
);
router.put(
  '/Ortho-Paro/:id',
  validateKeycloakToken,
  validateRequest(transferSchema),
  asyncHandler(controller.transferOrthoToParo)
);
router.put(
  '/validate-transfer/:actionId',
  validateKeycloakToken,
  validateRequest(validateTransferSchema),
  asyncHandler(controller.validateTransfer)
);

export default router;

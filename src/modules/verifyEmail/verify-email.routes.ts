import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { emailParamSchema, verifyEmailBodySchema } from './verify-email.dto.js';
import { VerifyEmailController } from './verify-email.controller.js';

const router = Router();
const controller = new VerifyEmailController();

router.post(
  '/:email',
  validateRequest(emailParamSchema.merge(verifyEmailBodySchema)),
  asyncHandler(controller.sendVerification)
);
router.get(
  '/:email/status',
  validateRequest(emailParamSchema),
  asyncHandler(controller.getStatus)
);
router.put(
  '/:email/resend',
  validateRequest(emailParamSchema.merge(verifyEmailBodySchema)),
  asyncHandler(controller.resendVerification)
);
router.put(
  '/:email/mark-verified',
  validateKeycloakToken,
  validateRequest(emailParamSchema),
  asyncHandler(controller.markVerified)
);

export default router;

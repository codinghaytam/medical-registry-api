import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { passwordChangeSchema } from './password-change.dto.js';
import { PasswordChangeController } from './password-change.controller.js';

const router = Router();
const controller = new PasswordChangeController();

router.put(
  '/:email',
  validateRequest(passwordChangeSchema),
  asyncHandler(controller.changePassword)
);

export default router;

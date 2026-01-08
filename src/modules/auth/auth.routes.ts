import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { loginSchema, logoutSchema, refreshSchema, signupSchema } from './auth.dto.js';
import { AuthController } from './auth.controller.js';

const router = Router();
const controller = new AuthController();

router.post('/login', validateRequest(loginSchema), asyncHandler(controller.login));
router.post('/refresh', validateRequest(refreshSchema), asyncHandler(controller.refresh));
router.post('/logout', validateRequest(logoutSchema), asyncHandler(controller.logout));
router.post('/signup', validateRequest(signupSchema), asyncHandler(controller.signup));

export default router;

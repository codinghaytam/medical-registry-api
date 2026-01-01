import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import {
  adminEmailParamSchema,
  adminIdParamSchema,
  createAdminSchema,
  updateAdminSchema
} from './admin.dto.js';
import { AdminController } from './admin.controller.js';

const router = Router();
const controller = new AdminController();

router.get('/', validateKeycloakToken, asyncHandler(controller.getAdmins));
router.get(
  '/email/:email',
  validateKeycloakToken,
  validateRequest(adminEmailParamSchema),
  asyncHandler(controller.getAdminByEmail)
);
router.get(
  '/:id',
  validateKeycloakToken,
  validateRequest(adminIdParamSchema),
  asyncHandler(controller.getAdminById)
);
router.post(
  '/',
  validateKeycloakToken,
  validateRequest(createAdminSchema),
  asyncHandler(controller.createAdmin)
);
router.put(
  '/:id',
  validateKeycloakToken,
  validateRequest(updateAdminSchema),
  asyncHandler(controller.updateAdmin)
);
router.delete(
  '/:id',
  validateKeycloakToken,
  validateRequest(adminIdParamSchema),
  asyncHandler(controller.deleteAdmin)
);

export default router;

import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { validatePhone } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  userEmailParamSchema,
  userIdParamSchema,
  userRoleParamSchema
} from './user.dto.js';
import { UserController } from './user.controller.js';

const router = Router();
const controller = new UserController();

router.get('/', validateKeycloakToken, asyncHandler(controller.getUsers));
router.get(
  '/role/:role',
  validateKeycloakToken,
  validateRequest(userRoleParamSchema),
  asyncHandler(controller.getUsersByRole)
);
router.get(
  '/medecins',
  validateKeycloakToken,
  asyncHandler(controller.getMedecins)
);
router.get(
  '/email/:email',
  validateKeycloakToken,
  validateRequest(userEmailParamSchema),
  asyncHandler(controller.getUserByEmail)
);
router.get(
  '/:id',
  validateKeycloakToken,
  validateRequest(userIdParamSchema),
  asyncHandler(controller.getUserById)
);
router.post(
  '/',
  validateKeycloakToken,
  validatePhone,
  validateRequest(createUserSchema),
  asyncHandler(controller.createUser)
);
router.put(
  '/:id',
  validateKeycloakToken,
  validatePhone,
  validateRequest(updateUserSchema),
  asyncHandler(controller.updateUser)
);
router.delete(
  '/:id',
  validateKeycloakToken,
  validateRequest(userIdParamSchema),
  asyncHandler(controller.deleteUser)
);

export default router;

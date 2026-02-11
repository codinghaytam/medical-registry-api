import { Router } from 'express';
import { validateKeycloakToken } from '../../utils/keycloak.js';
import { validatePhone } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { validateRole } from '../../middlewares/role.middleware.js';
import { Role } from '@prisma/client';
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

// All routes require authentication
router.use(validateKeycloakToken);

// Read Routes
router.get(
  '/',
  validateRole([Role.ADMIN, Role.MEDECIN]), // Admin can manage, Doctor might need directory
  asyncHandler(controller.getUsers)
);
router.get(
  '/role/:role',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(userRoleParamSchema),
  asyncHandler(controller.getUsersByRole)
);
router.get(
  '/medecins',
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]), // Everyone needs to see doctors
  asyncHandler(controller.getMedecins)
);
router.get(
  '/email/:email',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(userEmailParamSchema),
  asyncHandler(controller.getUserByEmail)
);
router.get(
  '/:id',
  validateRole([Role.ADMIN, Role.MEDECIN]),
  validateRequest(userIdParamSchema),
  asyncHandler(controller.getUserById)
);

// Write Routes - strictly ADMIN
router.post(
  '/',
  validateRole([Role.ADMIN]),
  validatePhone,
  validateRequest(createUserSchema),
  asyncHandler(controller.createUser)
);
router.put(
  '/:id',
  validateRole([Role.ADMIN]), // Self-update should ideally be separate, restricting to Admin for now
  validatePhone,
  validateRequest(updateUserSchema),
  asyncHandler(controller.updateUser)
);
router.delete(
  '/:id',
  validateRole([Role.ADMIN]),
  validateRequest(userIdParamSchema),
  asyncHandler(controller.deleteUser)
);

export default router;

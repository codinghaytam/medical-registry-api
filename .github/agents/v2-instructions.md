# Agent Instructions - Medical Registry API (v2)

## Overview
This document provides instructions for AI agents working on the Medical Registry API. The system has undergone a comprehensive RBAC (Role-Based Access Control) refactor to enforce strict permission boundaries.

## Role-Based Access Control (RBAC)

### Core Principle
**All routes MUST enforce role-based access control using the `validateRole` middleware.**

### Role Definitions
- **ADMIN**: Full system access, user management, action validation
- **MEDECIN**: Access to patients matching their profession, own consultations/seances
- **ETUDIANT**: Read-only access to all clinical data

### Middleware Usage
```typescript
import { validateRole } from '../../middlewares/role.middleware.js';
import { Role } from '@prisma/client';

// Example: Allow only ADMIN and MEDECIN to create
router.post('/', 
  validateKeycloakToken,
  validateRole([Role.ADMIN, Role.MEDECIN]),
  asyncHandler(controller.create)
);

// Example: Allow all authenticated users to read
router.get('/',
  validateKeycloakToken,
  validateRole([Role.ADMIN, Role.MEDECIN, Role.ETUDIANT]),
  asyncHandler(controller.getAll)
);
```

## Module-Specific Rules

### Patient Module
- **Write Access**: ADMIN, MEDECIN only
- **Read Access**: All authenticated users
- **Filtering**: Medecins see only patients where `Patient.State === Medecin.Profession`
- **Implementation**: Filtering is handled in `PatientService.getPatients()`

### Consultation & Seance Modules
- **Write Access**: ADMIN, MEDECIN only
- **Read Access**: All authenticated users
- **Ownership**: Medecins can only edit records where `medecinId` matches their own ID
- **Implementation**: Filtering is handled in service layer

### Actions Module
- **All Access**: ADMIN only
- **Purpose**: Transfer validation, administrative actions
- **Security**: Critical - contains patient transfer approvals

### User Management (Users, Medecin, Etudiant)
- **Write Access**: ADMIN only
- **Read Access**: All authenticated users (directory listing)
- **Keycloak Sync**: User creation/updates sync with Keycloak

## Testing Requirements

### Unit Tests
**Location**: `tests/unit/modules/[module]/`

**Required Coverage**:
- Service layer RBAC filtering logic
- Middleware role validation
- Keycloak synchronization logic

**Example**:
```typescript
describe('PatientService', () => {
  it('should filter patients by profession for MEDECIN role', async () => {
    // Test implementation
  });
});
```

### Integration Tests
**Location**: `tests/integration/`

**Framework**: Supertest + Jest with ESM support

**Note**: Integration tests require authentication strategy (mock tokens or test Keycloak instance)

## Code Modification Guidelines

### When Adding New Routes
1. **Always** add `validateKeycloakToken` middleware first
2. **Always** add `validateRole([...])` with appropriate roles
3. **Document** the access control decision in comments
4. **Test** both positive and negative authorization cases

### When Modifying Services
1. **Check** if role-based filtering is needed
2. **Implement** filtering in service layer, not controller
3. **Test** filtering logic with unit tests
4. **Document** filtering behavior

### When Adding New Modules
1. Follow the established pattern: `routes.ts` → `controller.ts` → `service.ts` → `repository.ts`
2. Add RBAC middleware to all routes
3. Create unit tests for service layer
4. Update `docs/ROLE_CAPABILITIES.md`

## Progress Tracking

### Required Files
- `.github/refactor-progress.md`: Module-by-module RBAC compliance checklist
- `.github/refactor-log.md`: Chronological log of changes
- `docs/ROLE_CAPABILITIES.md`: User-facing capability matrix

### When Making Changes
1. Update the relevant progress file
2. Mark items as `[x]` when complete, `[/]` when in progress
3. Add entries to refactor-log.md with date and description

## Common Pitfalls

### ❌ Don't
- Skip role validation middleware on "internal" routes
- Implement authorization in controllers (use services)
- Hardcode role checks without using `validateRole`
- Forget to test negative authorization cases

### ✅ Do
- Use `validateRole` middleware consistently
- Implement filtering in service layer
- Write unit tests for RBAC logic
- Document role requirements in route comments
- Sync user changes with Keycloak

## Architecture Notes

### Authentication Flow
1. Keycloak issues JWT token
2. `validateKeycloakToken` middleware verifies token
3. User email extracted from token
4. `validateRole` middleware queries database for user role
5. Role checked against allowed roles
6. Request proceeds or returns 403 Forbidden

### Database-First Role Check
**Critical**: Roles are verified against the database, NOT the token. This ensures:
- Role changes take effect immediately
- No token refresh required for permission changes
- Single source of truth (database)

## References
- Implementation Plan: `/brain/[conversation-id]/implementation_plan.md`
- Walkthrough: `/brain/[conversation-id]/walkthrough.md`
- Refactor Log: `.github/refactor-log.md`
- Progress Tracker: `.github/refactor-progress.md`

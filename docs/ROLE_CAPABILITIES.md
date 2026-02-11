# Role-Based Access Control - Medical Registry API

> **Last Updated**: 2026-02-07  
> **Status**: ✅ Implemented and Tested

This document describes the **implemented** Role-Based Access Control (RBAC) system for the Medical Registry API.

## Role Definitions

| Role | Code | Description |
|:-----|:-----|:------------|
| **ADMIN** | `Role.ADMIN` | System administrator with full access |
| **MEDECIN** | `Role.MEDECIN` | Doctor/Practitioner with profession-based access |
| **ETUDIANT** | `Role.ETUDIANT` | Student with read-only access |

## Security Architecture

### Authentication & Authorization Flow
1. **Authentication**: Keycloak issues JWT bearer tokens
2. **Token Verification**: `validateKeycloakToken` middleware verifies JWT signature
3. **Role Verification**: `validateRole` middleware checks user role against **database** (not token)
4. **Access Decision**: Request proceeds (200/201) or returns 403 Forbidden

### Critical Security Feature
**Database-First Role Check**: User roles are verified against the PostgreSQL database, NOT the Keycloak token. This ensures:
- Role changes take effect immediately (no token refresh needed)
- Single source of truth (database)
- Prevents token-based privilege escalation

## Module Access Matrix

### Patient Module
**Routes**: `/patient/*`

| Operation | Endpoint | ADMIN | MEDECIN | ETUDIANT |
|:----------|:---------|:-----:|:-------:|:--------:|
| List Patients | `GET /patient` | ✅ All | ✅ Filtered* | ✅ All |
| Get Patient | `GET /patient/:id` | ✅ | ✅ | ✅ |
| Create Patient | `POST /patient` | ✅ | ✅ | ❌ 403 |
| Update Patient | `PUT /patient/:id` | ✅ | ✅ | ❌ 403 |
| Delete Patient | `DELETE /patient/:id` | ✅ | ✅ | ❌ 403 |
| Transfer Patient | `PUT /patient/Paro-Ortho/:id` | ✅ | ✅ | ❌ 403 |

**\*Filtering Logic**: Medecins only see patients where `Patient.State === Medecin.Profession`
- **ORTHODONTAIRE** doctors see only `ORTHODONTAIRE` patients
- **PARODONTAIRE** doctors see only `PARODONTAIRE` patients

**Implementation**: `PatientService.getPatients()` applies profession-based filtering

---

### Consultation Module
**Routes**: `/consultation/*`

| Operation | Endpoint | ADMIN | MEDECIN | ETUDIANT |
|:----------|:---------|:-----:|:-------:|:--------:|
| List Consultations | `GET /consultation` | ✅ All | ✅ Filtered* | ✅ All |
| Get Consultation | `GET /consultation/:id` | ✅ | ✅ | ✅ |
| Create Consultation | `POST /consultation` | ✅ | ✅ | ❌ 403 |
| Update Consultation | `PUT /consultation/:id` | ✅ | ✅ Own** | ❌ 403 |
| Delete Consultation | `DELETE /consultation/:id` | ✅ | ✅ Own** | ❌ 403 |

**\*Filtering Logic**: Medecins only see consultations where `Consultation.medecinId === Medecin.id`

**\*\*Ownership Check**: Medecins can only edit/delete their own consultations

**Implementation**: `ConsultationService.getConsultations()` applies ownership filtering

---

### Seance Module
**Routes**: `/seance/*`

| Operation | Endpoint | ADMIN | MEDECIN | ETUDIANT |
|:----------|:---------|:-----:|:-------:|:--------:|
| List Seances | `GET /seance` | ✅ All | ✅ Filtered* | ✅ All |
| Get Seance | `GET /seance/:id` | ✅ | ✅ | ✅ |
| Create Seance | `POST /seance` | ✅ | ✅ | ❌ 403 |
| Update Seance | `PUT /seance/:id` | ✅ | ✅ Own** | ❌ 403 |
| Delete Seance | `DELETE /seance/:id` | ✅ | ✅ Own** | ❌ 403 |

**\*Filtering Logic**: Medecins only see seances where `Seance.medecinId === Medecin.id`

**\*\*Ownership Check**: Medecins can only edit/delete their own seances

**Implementation**: `SeanceService.getSeances()` applies ownership filtering

---

### Actions Module (Administrative)
**Routes**: `/actions/*`

| Operation | Endpoint | ADMIN | MEDECIN | ETUDIANT |
|:----------|:---------|:-----:|:-------:|:--------:|
| List Actions | `GET /actions` | ✅ | ❌ 403 | ❌ 403 |
| Validate Transfer | `PUT /actions/validate-transfer-ortho/:id` | ✅ | ❌ 403 | ❌ 403 |
| Validate Transfer | `PUT /actions/validate-transfer-paro/:id` | ✅ | ❌ 403 | ❌ 403 |

**Security**: Actions module contains sensitive audit logs and transfer validations. **ADMIN ONLY**.

**Implementation**: All routes protected with `validateRole([Role.ADMIN])`

---

### User Management Modules
**Routes**: `/users/*`, `/medecin/*`, `/etudiant/*`

| Operation | Endpoint Pattern | ADMIN | MEDECIN | ETUDIANT |
|:----------|:----------------|:-----:|:-------:|:--------:|
| List Users | `GET /users` | ✅ | ✅ | ✅ |
| Get User | `GET /users/:id` | ✅ | ✅ | ✅ |
| Create User | `POST /users` | ✅ | ❌ 403 | ❌ 403 |
| Update User | `PUT /users/:id` | ✅ | ❌ 403 | ❌ 403 |
| Delete User | `DELETE /users/:id` | ✅ | ❌ 403 | ❌ 403 |

**Note**: Same access pattern applies to `/medecin/*` and `/etudiant/*` routes

**Keycloak Sync**: User creation/updates automatically sync with Keycloak identity provider

**Implementation**: Write operations protected with `validateRole([Role.ADMIN])`

---

## Notification System

Real-time notifications are sent via Socket.IO to `user:{userId}` channels.

| Event Type | Triggered By | Recipients |
|:-----------|:-------------|:-----------|
| `PATIENT_TRANSFERRED` | Patient transfer initiated | All doctors in target profession |
| `PATIENT_ASSIGNED` | Patient assigned to doctor | Assigned doctor |
| `CONSULTATION_CREATED` | New consultation | Associated doctor |
| `SEANCE_CREATED` | New seance | Associated doctor |

## Testing Coverage

### Unit Tests ✅
- **Middleware**: `RoleMiddleware` - Authorization logic
- **Services**: 
  - `PatientService` - Profession-based filtering
  - `ConsultationService` - Ownership filtering
  - `SeanceService` - Ownership filtering
  - `ActionsService` - Transfer validation
  - `UserService`, `MedecinService`, `EtudiantService` - Keycloak sync

**Run**: `npm test`

### Integration Tests 🔧
- **Framework**: Supertest + Jest (ESM)
- **Status**: Infrastructure ready, requires authentication strategy
- **Location**: `tests/integration/`

## Manual Verification Checklist

Use these steps to verify RBAC enforcement:

### Student (ETUDIANT) Restrictions
```bash
# Get a student token from Keycloak
TOKEN="<student-jwt-token>"

# ✅ Should succeed (200)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/patient

# ❌ Should fail (403 Forbidden)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","prenom":"Patient"}' \
  http://localhost:3000/patient
```

### Doctor (MEDECIN) Filtering
```bash
# Get a doctor token (ORTHODONTAIRE profession)
TOKEN="<medecin-jwt-token>"

# Should only return ORTHODONTAIRE patients
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/patient
```

### Admin (ADMIN) Access
```bash
# Get an admin token
TOKEN="<admin-jwt-token>"

# ✅ Should succeed (200) - Admin-only endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/actions
```

## Implementation Details

### Middleware Stack (Typical Route)
```typescript
router.post('/patient',
  validateKeycloakToken,           // 1. Verify JWT signature
  validateRole([Role.ADMIN, Role.MEDECIN]),  // 2. Check DB role
  validateRequest(createPatientSchema),      // 3. Validate input
  asyncHandler(controller.create)            // 4. Execute business logic
);
```

### Service-Layer Filtering Example
```typescript
// PatientService.getPatients()
async getPatients(user: TokenUser) {
  const dbUser = await userRepository.findByEmail(user.email);
  
  if (dbUser.role === Role.MEDECIN) {
    const medecin = await medecinRepository.findByUserId(dbUser.id);
    // Filter by profession
    return patientRepository.findByState(medecin.profession);
  }
  
  // ADMIN and ETUDIANT see all
  return patientRepository.findAll();
}
```

## References

- **Implementation Plan**: `brain/[conversation-id]/implementation_plan.md`
- **Walkthrough**: `brain/[conversation-id]/walkthrough.md`
- **Refactor Log**: `.github/refactor-log.md`
- **Agent Instructions**: `.github/agents/v2-instructions.md`
- **Project Context**: `.github/project-context.md`

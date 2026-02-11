# Refactor Log

## [2026-02-06] - Initialization
- Created `refactor-log.md` to track changes.
- Established `project-context.md` and `v2-instructions.md`.
- **Goal**: Implement strict RBAC with Student View-Only and Medecin Profession-based access.

## [2026-02-06] - Security Layer
- **[NEW]** `src/middlewares/role.middleware.ts`: Implemented `validateRole` middleware.
  - Verifies user email from Keycloak token against local PostgreSQL `User` table.
  - Enforces `allowedRoles` check.
- **[UPDATE]** Modules Secured:
  - `Actions`: ADMIN only.
  - `Patient`: Medecin (Profession filter), Student (Read Only).
  - `Consultation`: Medecin (Ownership filter), Student (Read Only).
  - `Seance`: Medecin (Ownership filter), Student (Read Only).
  - `Users`, `Etudiant`, `Medecin`: Admin (Write), Authenticated (Read).
- **[TEST]** Verified `RoleMiddleware` with Unit Tests (Jest).
- **[TEST]** Verified Service RBAC Logic (Unit Tests):
  - `PatientService`: Verified Profession-based filtering.
  - `ConsultationService`: Verified Medecin ID filtering.
  - `SeanceService`: Verified Medecin ID filtering.
- **[REFACTOR]** Test Structure:
  - Moved tests to `tests/unit/modules`.
  - Configured `tests/setup.ts` for Keycloak mocking.
- **[TEST]** Expanded Unit Coverage:
  - `ActionsService`, `UserService`, `MedecinService`, `EtudiantService`.
  - All unit tests passing.
- **[INFRA]** Integration Test Framework:
  - Created `tests/integration/` structure.
  - Configured Jest for ESM with `ts-jest/presets/default-esm`.
  - Refactored server entry point (`src/server.ts`) for testability.
  - Added environment variable mocking in `tests/setup.ts`.

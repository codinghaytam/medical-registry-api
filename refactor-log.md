# Layered Architecture Refactor Log

- **Start Date:** 2026-01-01
- **Intended Branch:** `refactor-layered-architecture` *(blocked – terminal access not yet authorized, awaiting user guidance)*
- **Project Context:** Node.js + Express + TypeScript API backed by Prisma ORM
- **Primary Goals:**
  1. Restructure into feature modules with Controller → Service → Repository layers.
  2. Introduce Prisma transactions for multi-step operations.
  3. Add unit tests with mocks for services and repositories.
  4. Preserve existing API surface (routes, payloads, status codes).

## Critical Rules Snapshot
- Keep API contract untouched; no route/path/method/payload changes.
- Do not modify unrelated infra files (README, Docker, CI, etc.).
- Never edit `node_modules/`.
- Do not assume business logic—ask if uncertain.
- Use Zod (or equivalent) for DTO validation.
- Centralize error handling and logging.
- Consolidate integration/Postman tests into one file.
- Add unit tests for every new service/repository.
- Avoid running tests/servers/CLI unless explicitly approved.

## Step 1 – Discovery & Analysis (2026-01-01)
### API Surface & Features
- **users**: CRUD plus role filtering and Keycloak sync; mixes authentication logic with Prisma queries.
- **admin**: Dedicated admin management relying heavily on Keycloak admin client; complex branching by Keycloak ID vs DB ID.
- **medecin / etudiant**: Duplicated flows for creating Keycloak + Prisma records; manual phone handling via middleware.
- **patient**: Basic CRUD plus transfer routes (`Paro-Ortho`, `Ortho-Paro`, `validate-transfer`).
- **consultation**: Creates patient+consultation in one call, attaches diagnoses, and deletes via manual cascade; partial transaction usage only on delete.
- **diagnostique**: Stand-alone CRUD but overlaps with consultation diagnoses logic.
- **seance / reevaluation**: File uploads, Keycloak lookups, and seance-type validation embedded inside routers; reevaluation already uses a transaction when creating seance+reevaluation.
- **actions**: CRUD plus special validation for `TRANSFER_ORTHO`.
- **password-change / verify-email**: Utility routes for Keycloak interactions.
- **enum** endpoints: simple value exposers (no auth middleware yet but should).

### Shared Utilities
- `utils/keycloak.ts`: central Keycloak admin connection with token refresh plus JWT guard.
- `utils/validation.ts`: phone middleware only.
- `utils/upload.ts`: duplicate multer configs and helpers; reevaluation route reimplements portions locally.
- `utils/config.ts`: environment validation + logging.

### Current Pain Points / Risks
1. **Single-layer routers:** HTTP handlers directly instantiate `PrismaClient`, perform business logic, and call `$disconnect()` after each request (can exhaust connection pool).
2. **No DTO validation:** Payloads rely on TypeScript types only; runtime validation absent → risk of invalid data.
3. **Keycloak coupling:** Each router manually connects to Keycloak; no shared service abstraction or caching.
4. **Transaction gaps:** Multi-step sequences (patient transfers, admin/medecin creation, diagnosis writes) lack atomicity.
5. **File handling divergence:** `reevaluation` route redefines multer config instead of reusing `utils/upload` abstractions.
6. **Testing coverage:** Only utility unit tests exist (`config`, `upload`, `validation`); no tests for routes/logic.
7. **Error handling:** Each route catches errors independently; no centralized middleware or typed errors.

### Opportunities & Decisions
- Create `src/modules/<feature>/` folders encapsulating controller/service/repository/dto/tests.
- Introduce common `BaseRepository` pattern to accept `PrismaClient | Prisma.TransactionClient` for transaction support.
- Wrap Keycloak interactions into dedicated services (e.g., `IdentityService`).
- Standardize file upload handling via shared helper + storage configuration.
- Use Zod schemas per DTO; controllers perform validation before delegating to services.

### Open Questions / Clarifications Needed
1. **Seance type/business rules:** Are there additional medecin-profession combinations beyond ORTHODONTAIRE ↔ PARODONTAIRE to enforce?
2. **Action validation flows:** Should `TRANSFER_PARO` actions also require explicit validation like `TRANSFER_ORTHO`?
3. **Admin creation defaults:** When names are missing, can blank names persist or should we enforce first/last name fields?
4. **File storage paths:** Is unifying uploads under a single directory acceptable, or must legacy paths remain for backward compatibility?

*Awaiting user guidance on the above before adjusting business rules.*

---
## Step 2 – Execution Log (2026-01-01 → ongoing)
- Created shared utilities: Prisma singleton, `ApiError`, request logger, async handler wrapper, validation + error middlewares.
- Scaffolding: `src/modules/<feature>/` with DTO, repository, service, controller, and router for every legacy route (users, admin, medecin, etudiant, patient, actions, consultation, diagnostique, seance, reevaluation, enums, password-change, verify-email).
- Centralized routing with `src/modules/routes.ts`, replaced legacy `src/routes/*.ts` files, and wired `app.ts` to register feature routers + global error handlers.
- Migrated file upload + Keycloak logic into services, preserved API contracts, began wrapping multi-step flows (patient transfers, action validation, consultation delete, reevaluation create) in Prisma transactions.
- Extended transaction coverage to medecin/etudiant/user create-update-delete flows via `prisma.$transaction` and removed the obsolete `src/routes/` directory entirely.
- Outstanding: transaction audit for remaining flows, service/repository unit tests, integration test consolidation, documentation updates once refactor stabilizes.

*Next Step: finish transaction coverage review, then start writing unit tests per module before consolidating integration tests.*

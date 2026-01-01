# GitHub Copilot Refactoring Instructions


The goal is to migrate to a **Layered Architecture (Controller → Service → Repository)** with a **feature-based folder structure**, while adding transactional safety and unit tests — **without altering the public API contract**.

## Critical Rules (Must Follow Strictly)

- **Do NOT modify any files unrelated to the project source code** (e.g., README.md, .gitignore, package.json scripts, Dockerfiles, CI configs, etc.) unless explicitly required for the refactor (e.g., adding a test script).
- **Never touch or modify anything inside `node_modules/`** — this is forbidden.
- **If you are confused, uncertain, or lack context about existing code behavior**, stop and ask for clarification. **Do not invent or assume logic**.
- **You are allowed to change technologies** (e.g., switch from Joi to Zod for validation, introduce new libraries like class-validator, etc.) if it improves maintainability and fits the target architecture.
- **You are NOT expected to run tests or start the server**. Do not attempt to execute `npm test`, `npm run dev`, or any terminal commands unless explicitly permitted.
- **Terminal/command line access is prohibited** unless the user explicitly grants permission.
- **All Postman/Newman integration tests** (if any exist or are to be added) must be consolidated into a **single collection file** (e.g., `tests/postman_collection.json`).
- **Unit tests must be added** for services and repositories using Jest + mocks. Place them alongside the code (e.g., `user.service.test.ts`) or in a `__tests__` subfolder per module.

## Target Architecture Recap
src/
├── modules/
│    └── [feature]/
│         ├── [feature].controller.ts
│         ├── [feature].service.ts
│         ├── [feature].repository.ts
│         ├── [feature].routes.ts
│         └── [feature].dto.ts
├── middlewares/
├── config/
├── utils/
├── app.ts
└── server.ts
text## Refactoring Requirements
- Preserve **all existing route paths, HTTP methods, request/response shapes, status codes, and side effects**.
- Add **Prisma transactions** (`prisma.$transaction()`) wherever multiple database operations must be atomic.
- Use **Zod** (or similar) for runtime input validation in controllers or middleware.
- Centralize error handling.
- Add **unit tests** with proper mocking (especially of Prisma client).
- Ensure changes are traceable via small commits and `refactor-log.md`.

## Process Guidelines
1. Work on branch: `refactor-layered-architecture`
2. Make small, focused commits
3. Update `refactor-log.md` after each logical change
4. If unsure about business logic → **ask the user**
5. Never assume undocumented behavior

Resume safely from any point using git history and `refactor-log.md` if interrupted.
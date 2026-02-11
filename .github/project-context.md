# Medical Registry API - Project Context

> **Last Updated**: 2026-02-06
> **Description**: Source of Truth for Business Rules, Role Capabilities, and Architecture.

## 1. System Overview
Medical Registry API is a backend service for managing dental clinical workflows (Orthodontics & Periodontics).
**Stack**: Node.js (Express), TypeScript, Prisma (PostgreSQL), Keycloak (Auth), Socket.IO (Real-time).

## 2. Role-Based Access Control (RBAC) Rules

### 🛡️ ADMIN
- **Capability**: Superuser.
- **Access**:
  - Full Read/Write access to ALL modules.
  - Exclusive View access to the **Actions** module (System Audit Log).
  - Can delete records (must return comprehensive errors if DB integrity prevents it).

### 🩺 MEDECIN (Doctor)
- **Capability**: Supervisor / Practitioner.
- **Access**:
  - **View**: 'Their' Patients, Seances, Consultations.
  - **Edit**: 'Their' Patients, Seances, Consultations.
  - **Reevaluation**: Can CREATE reevaluations. Can EDIT reevaluations *only if created by them*.
- **"Their Data" Definition**:
  - **Patients**: Patients whose `State` matches the Doctor's `Profession` (ORTHODONTAIRE vs PARODONTAIRE).
  - **Consultations/Seances**: Records where `medecinId` matches the Doctor's ID.

### 🎓 ETUDIANT (Student)
- **Capability**: Observer / Learner.
- **Configuration**: **READ ONLY**.
- **Access**:
  - Can VIEW Patients, Seances, Consultations, Diagnoses.
  - **CANNOT** Create, Update, or Delete any record.

## 3. Security Architecture
- **Authentication**: Keycloak (Bearer Token).
- **Authorization**:
  - **Middleware**: `validateRole(allowedRoles)` must be used on ALL protected routes.
  - **Verification**: Middleware *must* verify the role against the local PostgreSQL `User` table using the email claim, NOT the Keycloak token role.

## 4. Module Specifics
- **Actions**: System-level API. Viewable *only* by ADMIN.
- **Patient**: Core data.
- **Consultation**: Linked to Patient and Doctor.
- **Notification**: Real-time updates via Socket.IO.

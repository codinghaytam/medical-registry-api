# GEMINI.md

## Project Overview

This is a medical registry backend service. It appears to be designed for managing patient data, consultations, diagnoses, and other medical actions within a clinical setting. The system includes roles for students, doctors, and administrators, and it seems to support different medical professions like orthodontics and periodontics.

### Key Technologies

*   **Backend:** Node.js with Express.js
*   **Database:** PostgreSQL with Prisma as the ORM
*   **Authentication:** Keycloak
*   **Real-time Communication:** Socket.IO
*   **Language:** TypeScript
*   **Telemetry:** OpenTelemetry

### Architecture

The project follows a modular architecture, with different features separated into their own modules under the `src/modules` directory. Each module has its own routes, controllers, services, and repositories.

*   `src/app.ts`: The main application entry point, where middleware is configured and the server is started.
*   `src/modules/routes.ts`: Aggregates all the feature routes and registers them with the Express app.
*   `src/lib/prisma.ts`: Prisma client initialization.
*   `src/lib/socket.ts`: Socket.IO server initialization.
*   `prisma/schema.prisma`: Defines the database schema, models, and relationships.

## Building and Running

### Prerequisites

*   Node.js
*   PostgreSQL
*   Keycloak

### Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up environment variables:**
    Copy `.env.example` to `.env` and fill in the required values for your database, Keycloak, and other configurations.
    ```bash
    cp .env.example .env
    ```

3.  **Apply database migrations:**
    ```bash
    npx prisma migrate deploy
    ```

### Running the Application

*   **Development mode:**
    This command will build the project and restart the server on file changes.
    ```bash
    npm run dev
    ```

*   **Production mode:**
    This command will start the server.
    ```bash
    npm start
    ```

### Testing

No explicit test command is defined in `package.json`. You might need to add a test runner like Jest or Mocha.

```bash
# Example of a possible test command
npm test
```

## Development Conventions

*   **Modular Structure:** The code is organized into modules based on features (e.g., `patient`, `consultation`, `seance`).
*   **Data Layer:** Prisma is used for database interactions. Each module that requires database access has its own repository file (e.g., `patient.repository.ts`).
*   **API Design:** The API is RESTful, with routes defined in `*.routes.ts` files.
*   **Validation:** DTO (Data Transfer Object) files (e.g., `patient.dto.ts`) are used for data validation, likely with a library like Yup or Zod.
*   **Real-time Updates:** Socket.IO is used for real-time communication, likely for features like notifications.

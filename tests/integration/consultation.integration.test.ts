
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/lib/prisma';
import { verifyKeycloakToken } from '../../src/utils/keycloak';
import { Role, Profession } from '@prisma/client';

// Mock Keycloak middleware
jest.mock('../../src/utils/keycloak', () => ({
    ...jest.requireActual('../../src/utils/keycloak'),
    verifyKeycloakToken: jest.fn(),
    getUserByEmail: jest.fn(),
}));

// Mock Prisma
jest.mock('../../src/lib/prisma', () => ({
    __esModule: true,
    default: {
        consultation: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        medecin: {
            findUnique: jest.fn(),
            findFirst: jest.fn()
        }
    },
}));

describe('Consultation Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockMedecinUser = {
        email: 'medecin@test.com',
        role: Role.MEDECIN,
        realm_access: { roles: ['MEDECIN'] },
    };

    const mockStudentUser = {
        email: 'student@test.com',
        role: Role.ETUDIANT,
        realm_access: { roles: ['ETUDIANT'] },
    };

    describe('POST /consultations', () => {
        it('should allow MEDECIN to create consultation', async () => {
            (verifyKeycloakToken as jest.Mock).mockResolvedValue(mockMedecinUser);

            // Mock db user lookup used by middleware
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'medecin-id',
                role: Role.MEDECIN,
                email: 'medecin@test.com'
            });

            // Mock Medecin lookup
            (prisma.medecin.findFirst as jest.Mock).mockResolvedValue({
                id: 'med-id',
                userId: 'medecin-id',
                profession: Profession.ORTHODONTAIRE
            });

            (prisma.consultation.create as jest.Mock).mockResolvedValue({
                id: 'cons-1',
                medecinId: 'med-id',
            });

            const response = await request(app)
                .post('/consultations')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    patientId: 'p1',
                    date: new Date(),
                    motif: 'CHECKUP',
                });

            expect(response.status).not.toBe(401);
            expect(response.status).not.toBe(403);
            // Depending on controller implementation, might be 201 or 200
            expect([200, 201]).toContain(response.status);
        });

        it('should deny ETUDIANT from creating consultation', async () => {
            (verifyKeycloakToken as jest.Mock).mockResolvedValue(mockStudentUser);

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'student-id',
                role: Role.ETUDIANT,
                email: 'student@test.com'
            });

            const response = await request(app)
                .post('/consultations')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    patientId: 'p1',
                    date: new Date(),
                    motif: 'CHECKUP',
                });

            expect(response.status).toBe(403);
        });
    });
});

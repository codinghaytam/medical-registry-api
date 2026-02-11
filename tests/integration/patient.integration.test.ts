
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
        patient: {
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

describe('Patient Integration - RBAC', () => {
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

    describe('POST /patient', () => {
        it('should allow MEDECIN to create patient', async () => {
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

            (prisma.patient.create as jest.Mock).mockResolvedValue({
                id: 'patient-1',
                nom: 'Test',
                prenom: 'Patient',
            });

            const response = await request(app)
                .post('/patient')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    nom: 'Test',
                    prenom: 'Patient',
                    dateNaissance: '2000-01-01',
                    sexe: 'M',
                });

            expect(response.status).not.toBe(401);
            expect(response.status).not.toBe(403);
            // Should be successful (200 or 201)
            expect([200, 201]).toContain(response.status);
        });

        it('should deny ETUDIANT from creating patient', async () => {
            (verifyKeycloakToken as jest.Mock).mockResolvedValue(mockStudentUser);

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'student-id',
                role: Role.ETUDIANT,
                email: 'student@test.com'
            });

            const response = await request(app)
                .post('/patient')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    nom: 'Test',
                    prenom: 'Patient',
                    dateNaissance: '2000-01-01',
                    sexe: 'M',
                });

            expect(response.status).toBe(403);
        });
    });

    describe('GET /patient', () => {
        it('should allow ETUDIANT to view patients (read-only)', async () => {
            (verifyKeycloakToken as jest.Mock).mockResolvedValue(mockStudentUser);

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'student-id',
                role: Role.ETUDIANT,
                email: 'student@test.com'
            });

            (prisma.patient.findMany as jest.Mock).mockResolvedValue([
                { id: 'p1', nom: 'Patient', prenom: 'One' }
            ]);

            const response = await request(app)
                .get('/patient')
                .set('Authorization', 'Bearer valid-token');

            expect(response.status).toBe(200);
        });
    });
});

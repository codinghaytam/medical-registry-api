
import { UserService } from '../../../../src/modules/users/user.service';
import { UserRepository } from '../../../../src/modules/users/user.repository';
import { MedecinRepository } from '../../../../src/modules/medecin/medecin.repository';
import { EtudiantRepository } from '../../../../src/modules/etudiant/etudiant.repository';
import { Role } from '@prisma/client';
import { safeKeycloakConnect, getUserByEmail } from '../../../../src/utils/keycloak';

// Mocks
jest.mock('../../../../src/modules/users/user.repository');
jest.mock('../../../../src/modules/medecin/medecin.repository');
jest.mock('../../../../src/modules/etudiant/etudiant.repository');
jest.mock('../../../../src/utils/keycloak');
jest.mock('../../../../src/lib/prisma', () => ({
    __esModule: true,
    default: {
        $transaction: jest.fn((callback) => callback()),
    },
}));

describe('UserService', () => {
    let service: UserService;
    let userRepo: jest.Mocked<UserRepository>;
    let kcClientMock: any;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new UserService();
        userRepo = (service as any).repository;

        kcClientMock = {
            users: {
                create: jest.fn(),
                find: jest.fn(),
                update: jest.fn(),
                resetPassword: jest.fn(),
                del: jest.fn(),
                findOne: jest.fn()
            }
        };
        (safeKeycloakConnect as jest.Mock).mockResolvedValue(kcClientMock);
        (getUserByEmail as jest.Mock).mockResolvedValue(null);
    });

    describe('create', () => {
        it('should create user in Keycloak and DB', async () => {
            const payload = {
                username: 'testuser',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: Role.ADMIN,
                pwd: 'password123'
            };

            kcClientMock.users.create.mockResolvedValue({ id: 'kc-id-123' });
            userRepo.findByEmail.mockResolvedValue(null);
            userRepo.create.mockResolvedValue({ ...payload, id: 'db-id-123', name: 'Test User', phone: '' } as any);

            const result = await service.create(payload);

            expect(kcClientMock.users.create).toHaveBeenCalled();
            expect(userRepo.create).toHaveBeenCalled();
            expect(result.keycloakId).toBe('kc-id-123');
        });

        it('should throw if user exists in DB', async () => {
            userRepo.findByEmail.mockResolvedValue({ id: '1' } as any);
            await expect(service.create({ email: 'exist@example.com' } as any))
                .rejects.toThrow('already exists');
        });
    });

    describe('getMedecinsWithKeycloak', () => {
        it('should merge medecin data with keycloak info', async () => {
            const medecinRepo = (service as any).medecinRepository;
            medecinRepo.findAll.mockResolvedValue([{ userId: 'kc-id-1', id: 'm1' }] as any);
            kcClientMock.users.findOne.mockResolvedValue({ id: 'kc-id-1', email: 'test@test.com' });

            const result = await service.getMedecinsWithKeycloak();

            expect(result[0].userInfo).toEqual({ id: 'kc-id-1', email: 'test@test.com' });
        });
    });
});


import { EtudiantService } from '../../../../src/modules/etudiant/etudiant.service';
import { EtudiantRepository } from '../../../../src/modules/etudiant/etudiant.repository';
import { UserRepository } from '../../../../src/modules/users/user.repository';
import { safeKeycloakConnect } from '../../../../src/utils/keycloak';

jest.mock('../../../../src/modules/etudiant/etudiant.repository');
jest.mock('../../../../src/modules/users/user.repository');
jest.mock('../../../../src/utils/keycloak');
jest.mock('../../../../src/lib/prisma', () => ({
    __esModule: true,
    default: {
        $transaction: jest.fn((callback) => callback()),
    },
}));

describe('EtudiantService', () => {
    let service: EtudiantService;
    let etudiantRepo: jest.Mocked<EtudiantRepository>;
    let userRepo: jest.Mocked<UserRepository>;
    let kcClientMock: any;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new EtudiantService();
        etudiantRepo = (service as any).repository;
        userRepo = (service as any).userRepository;

        kcClientMock = {
            users: {
                create: jest.fn(),
                find: jest.fn(),
                update: jest.fn(),
                resetPassword: jest.fn(),
                del: jest.fn()
            }
        };
        (safeKeycloakConnect as jest.Mock).mockResolvedValue(kcClientMock);
    });

    describe('create', () => {
        it('should create student in Keycloak, User DB, and Etudiant DB', async () => {
            const payload = {
                username: 'etud1',
                email: 'etud@test.com',
                firstName: 'Etu',
                lastName: 'Diant',
                niveau: '3',
                pwd: 'pass'
            };

            userRepo.create.mockResolvedValue({ id: 'user-id-1' } as any);
            etudiantRepo.create.mockResolvedValue({ id: 'etud-id-1', niveau: 3 } as any);

            const result = await service.create(payload);

            expect(kcClientMock.users.create).toHaveBeenCalled();
            expect(userRepo.create).toHaveBeenCalled();
            expect(etudiantRepo.create).toHaveBeenCalled();
            expect(result.id).toBe('etud-id-1');
        });
    });
});

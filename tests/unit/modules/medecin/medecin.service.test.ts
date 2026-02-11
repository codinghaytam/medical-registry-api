
import { MedecinService } from '../../../../src/modules/medecin/medecin.service';
import { MedecinRepository } from '../../../../src/modules/medecin/medecin.repository';
import { UserRepository } from '../../../../src/modules/users/user.repository';
import { Profession, Role } from '@prisma/client';
import { safeKeycloakConnect } from '../../../../src/utils/keycloak';

jest.mock('../../../../src/modules/medecin/medecin.repository');
jest.mock('../../../../src/modules/users/user.repository');
jest.mock('../../../../src/utils/keycloak');
jest.mock('../../../../src/lib/prisma', () => ({
    __esModule: true,
    default: {
        $transaction: jest.fn((callback) => callback()),
    },
}));

describe('MedecinService', () => {
    let service: MedecinService;
    let medecinRepo: jest.Mocked<MedecinRepository>;
    let userRepo: jest.Mocked<UserRepository>;
    let kcClientMock: any;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new MedecinService();
        medecinRepo = (service as any).repository;
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
        it('should create medecin in Keycloak, User DB, and Medecin DB', async () => {
            const payload = {
                username: 'medecin1',
                email: 'med@test.com',
                firstName: 'Med',
                lastName: 'Ecin',
                profession: Profession.ORTHODONTAIRE,
                isSpecialiste: true,
                pwd: 'pass'
            };

            userRepo.create.mockResolvedValue({ id: 'user-id-1' } as any);
            medecinRepo.create.mockResolvedValue({ id: 'med-id-1', profession: Profession.ORTHODONTAIRE } as any);

            const result = await service.create(payload);

            expect(kcClientMock.users.create).toHaveBeenCalled();
            expect(userRepo.create).toHaveBeenCalled();
            expect(medecinRepo.create).toHaveBeenCalled();
            expect(result.profession).toBe(Profession.ORTHODONTAIRE);
        });

        it('should throw if invalid profession', async () => {
            await expect(service.create({ profession: 'INVALID' } as any))
                .rejects.toThrow('Invalid profession');
        });
    });
});

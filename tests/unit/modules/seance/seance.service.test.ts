import { SeanceService } from '../../../../src/modules/seance/seance.service';
import { SeanceRepository } from '../../../../src/modules/seance/seance.repository';
import { MedecinRepository } from '../../../../src/modules/medecin/medecin.repository';
import { Role } from '@prisma/client';

// Mocks
jest.mock('../../../../src/utils/keycloak', () => ({
    safeKeycloakConnect: jest.fn(),
    KeycloakAdminClient: jest.fn(),
}));
jest.mock('../../../../src/lib/socket', () => ({
    getIO: jest.fn(),
}));
jest.mock('../../../../src/modules/seance/seance.repository');
jest.mock('../../../../src/modules/medecin/medecin.repository');
jest.mock('../../../../src/modules/notification/notification.service');

describe('SeanceService', () => {
    let service: SeanceService;
    let seanceRepo: jest.Mocked<SeanceRepository>;
    let medecinRepo: jest.Mocked<MedecinRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new SeanceService();
        seanceRepo = (service as any).repository;
        medecinRepo = (service as any).medecinRepository;
    });

    describe('list', () => {
        it('should return all seances for ADMIN user', async () => {
            const user = { id: 'admin-id', role: Role.ADMIN };
            const mockSeances = [{ id: '1', medecinId: 'm1' }];
            seanceRepo.findAll.mockResolvedValue(mockSeances as any);

            const result = await service.list(user);

            expect(seanceRepo.findAll).toHaveBeenCalled();
            expect(seanceRepo.findAllByMedecinId).not.toHaveBeenCalled();
            expect(result).toEqual([
                {
                    ...mockSeances[0],
                    medecin: { userInfo: null }
                }
            ]);
        });

        it('should return filtered seances for MEDECIN user', async () => {
            const user = { id: 'medecin-user-id', role: 'MEDECIN' };
            const mockMedecin = { id: 'med-id-123', userId: 'medecin-user-id' };
            const mockSeances = [{ id: '1', medecinId: 'med-id-123' }];

            medecinRepo.findByUserId.mockResolvedValue(mockMedecin as any);
            seanceRepo.findAllByMedecinId.mockResolvedValue(mockSeances as any);

            const result = await service.list(user);

            expect(medecinRepo.findByUserId).toHaveBeenCalledWith(user.id);
            expect(seanceRepo.findAllByMedecinId).toHaveBeenCalledWith(mockMedecin.id);
            expect(result).toEqual([
                {
                    ...mockSeances[0],
                    medecin: { userInfo: null }
                }
            ]);
        });

        it('should return empty list if MEDECIN profile not found', async () => {
            const user = { id: 'medecin-user-id', role: 'MEDECIN' };
            medecinRepo.findByUserId.mockResolvedValue(null);

            const result = await service.list(user);

            expect(medecinRepo.findByUserId).toHaveBeenCalledWith(user.id);
            expect(seanceRepo.findAllByMedecinId).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });

        it('should return all seances if no user provided', async () => {
            const mockSeances = [{ id: '1' }];
            seanceRepo.findAll.mockResolvedValue(mockSeances as any);

            const result = await service.list(undefined);

            expect(seanceRepo.findAll).toHaveBeenCalled();
            expect(result).toEqual([
                {
                    ...mockSeances[0],
                    medecin: { userInfo: null }
                }
            ]);
        });
    });
});

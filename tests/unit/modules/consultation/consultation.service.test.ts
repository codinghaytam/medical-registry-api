import { ConsultationService } from '../../../../src/modules/consultation/consultation.service';
import { ConsultationRepository } from '../../../../src/modules/consultation/consultation.repository';
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
jest.mock('../../../../src/modules/consultation/consultation.repository');
jest.mock('../../../../src/modules/medecin/medecin.repository');
jest.mock('../../../../src/modules/diagnostique/diagnostique.repository');
jest.mock('../../../../src/modules/notification/notification.service');

describe('ConsultationService', () => {
    let service: ConsultationService;
    let consultationRepo: jest.Mocked<ConsultationRepository>;
    let medecinRepo: jest.Mocked<MedecinRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ConsultationService();
        consultationRepo = (service as any).repository;
        medecinRepo = (service as any).medecinRepository;
    });

    describe('list', () => {
        it('should return all consultations for ADMIN user', async () => {
            const user = { id: 'admin-id', role: Role.ADMIN };
            const mockConsultations = [{ id: '1', medecinId: 'm1' }];
            consultationRepo.findAll.mockResolvedValue(mockConsultations as any);

            const result = await service.list(user);

            expect(consultationRepo.findAll).toHaveBeenCalled();
            expect(consultationRepo.findAllByMedecinId).not.toHaveBeenCalled();
            expect(result).toEqual(mockConsultations);
        });

        it('should return filtered consultations for MEDECIN user', async () => {
            const user = { id: 'medecin-user-id', role: 'MEDECIN' };
            const mockMedecin = { id: 'med-id-123', userId: 'medecin-user-id' };
            const mockConsultations = [{ id: '1', medecinId: 'med-id-123' }];

            medecinRepo.findByUserId.mockResolvedValue(mockMedecin as any);
            consultationRepo.findAllByMedecinId.mockResolvedValue(mockConsultations as any);

            const result = await service.list(user);

            expect(medecinRepo.findByUserId).toHaveBeenCalledWith(user.id);
            expect(consultationRepo.findAllByMedecinId).toHaveBeenCalledWith(mockMedecin.id);
            expect(result).toEqual(mockConsultations);
        });

        it('should return empty list if MEDECIN profile not found', async () => {
            const user = { id: 'medecin-user-id', role: 'MEDECIN' };
            medecinRepo.findByUserId.mockResolvedValue(null);

            const result = await service.list(user);

            expect(medecinRepo.findByUserId).toHaveBeenCalledWith(user.id);
            expect(consultationRepo.findAllByMedecinId).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });

        it('should return all consultations if no user provided', async () => {
            const mockConsultations = [{ id: '1' }];
            consultationRepo.findAll.mockResolvedValue(mockConsultations as any);

            const result = await service.list(undefined);

            expect(consultationRepo.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockConsultations);
        });
    });
});

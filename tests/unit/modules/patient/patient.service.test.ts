
import { PatientService } from '../../../../src/modules/patient/patient.service';
import { PatientRepository } from '../../../../src/modules/patient/patient.repository';
import { MedecinRepository } from '../../../../src/modules/medecin/medecin.repository';
import { Profession, Role } from '@prisma/client';

// Mocks
jest.mock('../../../../src/utils/keycloak', () => ({
    safeKeycloakConnect: jest.fn(),
}));
jest.mock('../../../../src/lib/socket', () => ({
    getIO: jest.fn(),
}));
jest.mock('../../../../src/modules/patient/patient.repository');
jest.mock('../../../../src/modules/medecin/medecin.repository');
jest.mock('../../../../src/modules/actions/actions.repository');
jest.mock('../../../../src/modules/actions/actions.service');
jest.mock('../../../../src/modules/notification/notification.service');

describe('PatientService', () => {
    let service: PatientService;
    let patientRepo: jest.Mocked<PatientRepository>;
    let medecinRepo: jest.Mocked<MedecinRepository>;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Initialize service
        service = new PatientService();

        // Access the mocked instances
        patientRepo = (service as any).repository;
        medecinRepo = (service as any).medecinRepository;
    });

    describe('list', () => {
        it('should return all patients for ADMIN user', async () => {
            const user = { id: 'admin-id', role: Role.ADMIN };
            const mockPatients = [{ id: '1', nom: 'Test', profession: 'ORTHO' }];
            patientRepo.findAll.mockResolvedValue(mockPatients as any);

            const result = await service.list(user);

            expect(patientRepo.findAll).toHaveBeenCalled();
            expect(patientRepo.findAllByState).not.toHaveBeenCalled();
            expect(result).toEqual(mockPatients);
        });

        it('should return filtered patients for MEDECIN user', async () => {
            const user = { id: 'medecin-id', role: 'MEDECIN' }; // Using string matching logic from service
            const mockMedecin = { id: 'med-1', profession: Profession.ORTHODONTAIRE };
            const mockPatients = [{ id: '1', nom: 'ValidePatient' }];

            medecinRepo.findByUserId.mockResolvedValue(mockMedecin as any);
            patientRepo.findAllByState.mockResolvedValue(mockPatients as any);

            const result = await service.list(user);

            expect(medecinRepo.findByUserId).toHaveBeenCalledWith(user.id);
            expect(patientRepo.findAllByState).toHaveBeenCalledWith(Profession.ORTHODONTAIRE);
            expect(result).toEqual(mockPatients);
        });

        it('should return empty list if MEDECIN profile not found', async () => {
            const user = { id: 'medecin-id', role: 'MEDECIN' };
            medecinRepo.findByUserId.mockResolvedValue(null);

            const result = await service.list(user);

            expect(medecinRepo.findByUserId).toHaveBeenCalledWith(user.id);
            expect(patientRepo.findAllByState).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });

        it('should return all patients if no user provided (legacy/internal usage)', async () => {
            // Logic: if(!user) -> returns findAll()
            const mockPatients = [{ id: '1' }];
            patientRepo.findAll.mockResolvedValue(mockPatients as any);

            const result = await service.list(undefined);

            expect(patientRepo.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockPatients);
        });
    });
});

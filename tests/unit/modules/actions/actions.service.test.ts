
import { ActionsService } from '../../../../src/modules/actions/actions.service';
import { ActionsRepository } from '../../../../src/modules/actions/actions.repository';
import { ActionType, Profession } from '@prisma/client';
import prisma from '../../../../src/lib/prisma';
import { ApiError } from '../../../../src/utils/apiError';

// Mock dependencies
jest.mock('../../../../src/modules/actions/actions.repository');
jest.mock('../../../../src/lib/prisma', () => ({
    __esModule: true,
    default: {
        $transaction: jest.fn((callback) => callback(prisma)),
    },
}));

describe('ActionsService', () => {
    let service: ActionsService;
    let repository: jest.Mocked<ActionsRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ActionsService();
        repository = (service as any).repository;
    });

    describe('list', () => {
        it('should return all actions', async () => {
            const mockActions = [{ id: '1', type: ActionType.TRANSFER_ORTHO }];
            repository.findAll.mockResolvedValue(mockActions as any);

            const result = await service.list();
            expect(result).toEqual(mockActions);
        });
    });

    describe('validateTransfer', () => {
        it('should validate transfer and update patient state', async () => {
            const actionId = 'action-1';
            const mockAction = {
                id: actionId,
                type: ActionType.TRANSFER_ORTHO,
                isValid: false,
                patientId: 'p1'
            };

            repository.findById.mockResolvedValue(mockAction as any);
            repository.setValidity.mockResolvedValue({ ...mockAction, isValid: true } as any);
            repository.updatePatientState.mockResolvedValue({ id: 'p1', state: Profession.ORTHODONTAIRE } as any);

            const result = await service.validateTransferToOrtho(actionId);

            expect(repository.findById).toHaveBeenCalledWith(actionId, expect.anything());
            expect(repository.setValidity).toHaveBeenCalledWith(actionId, true, expect.anything());
            expect(repository.updatePatientState).toHaveBeenCalledWith('p1', Profession.ORTHODONTAIRE, expect.anything());
            expect(result.action.isValid).toBe(true);
        });

        it('should throw error if action type mismatch', async () => {
            const actionId = 'action-1';
            const mockAction = {
                id: actionId,
                type: ActionType.TRANSFER_PARO, // Mismatch
                isValid: false,
                patientId: 'p1'
            };
            repository.findById.mockResolvedValue(mockAction as any);

            await expect(service.validateTransferToOrtho(actionId))
                .rejects.toThrow(ApiError);
        });

        it('should throw error if already validated', async () => {
            const actionId = 'action-1';
            const mockAction = {
                id: actionId,
                type: ActionType.TRANSFER_ORTHO,
                isValid: true, // Already valid
                patientId: 'p1'
            };
            repository.findById.mockResolvedValue(mockAction as any);

            await expect(service.validateTransferToOrtho(actionId))
                .rejects.toThrow('already been validated');
        });
    });
});

import { ActionType, Profession } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';
import { ActionsRepository } from './actions.repository.js';

export class ActionsService {
  constructor(private readonly repository = new ActionsRepository()) {}

  list() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const action = await this.repository.findById(id);
    if (!action) {
      throw ApiError.notFound('Action not found');
    }
    return action;
  }

  create(payload: {
    type: ActionType;
    date: Date;
    medecinId: string;
    patientId: string;
    isValid?: boolean;
  }) {
    return this.repository.create({
      type: payload.type,
      date: payload.date,
      isValid: payload.isValid ?? false,
      medecin: { connect: { id: payload.medecinId } },
      patient: { connect: { id: payload.patientId } }
    });
  }

  async update(id: string, payload: Partial<{ type: ActionType; date: Date; medecinId: string; patientId: string; isValid: boolean; }>) {
    await this.getById(id);
    return this.repository.update(id, {
      type: payload.type,
      date: payload.date,
      isValid: payload.isValid,
      medecin: payload.medecinId ? { connect: { id: payload.medecinId } } : undefined,
      patient: payload.patientId ? { connect: { id: payload.patientId } } : undefined
    });
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repository.delete(id);
  }

  async validateTransfer(actionId: string, expectedType: ActionType, targetState: Profession) {
    return prisma.$transaction(async (tx) => {
      const action = await this.repository.findById(actionId, tx);
      if (!action) {
        throw ApiError.notFound('Action not found');
      }

      if (action.type !== expectedType) {
        throw ApiError.badRequest(`Action is not a ${expectedType} type`);
      }

      if (action.isValid) {
        throw ApiError.conflict('This transfer has already been validated');
      }

      const updatedAction = await this.repository.setValidity(actionId, true, tx);
      const patient = await this.repository.updatePatientState(action.patientId, targetState, tx);

      logger.info('Transfer validated', { actionId, targetState });
      return { action: updatedAction, patient };
    });
  }

  validateTransferToOrtho(actionId: string) {
    return this.validateTransfer(actionId, ActionType.TRANSFER_ORTHO, Profession.ORTHODONTAIRE);
  }

  validateTransferToParo(actionId: string) {
    return this.validateTransfer(actionId, ActionType.TRANSFER_PARO, Profession.PARODONTAIRE);
  }
}

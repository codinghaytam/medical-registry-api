import {
  ActionType,
  HygieneBuccoDentaire,
  MotifConsultation,
  Profession,
  TypeMastication
} from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';
import { ActionsRepository } from '../actions/actions.repository.js';
import { ActionsService } from '../actions/actions.service.js';
import { PatientRepository } from './patient.repository.js';

interface PatientPayload {
  nom: string;
  numeroDeDossier: string;
  prenom: string;
  adresse: string;
  tel: string;
  motifConsultation: MotifConsultation;
  anameseGenerale?: string | null;
  anamneseFamiliale?: string | null;
  anamneseLocale?: string | null;
  hygieneBuccoDentaire: HygieneBuccoDentaire;
  typeMastication: TypeMastication;
  antecedentsDentaires?: string | null;
}

export class PatientService {
  private readonly actionService: ActionsService;

  constructor(
    private readonly repository = new PatientRepository(),
    private readonly actionsRepository = new ActionsRepository()
  ) {
    this.actionService = new ActionsService(this.actionsRepository);
  }

  list() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const patient = await this.repository.findById(id);
    if (!patient) {
      throw ApiError.notFound('Patient not found');
    }
    return patient;
  }

  async create(payload: PatientPayload) {
    return this.repository.create({
      ...payload
    });
  }

  async update(id: string, payload: Partial<PatientPayload>) {
    await this.getById(id);
    return this.repository.update(id, payload);
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repository.delete(id);
  }

  private async transferPatient(
    patientId: string,
    medecinId: string,
    targetState: Profession,
    actionType: ActionType
  ) {
    return prisma.$transaction(async (tx) => {
      const patient = await this.repository.findById(patientId, tx);
      if (!patient) {
        throw ApiError.notFound('Patient not found');
      }

      await this.actionsRepository.create(
        {
          type: actionType,
          date: new Date(),
          isValid: false,
          medecin: { connect: { id: medecinId } },
          patient: { connect: { id: patientId } }
        },
        tx
      );

      const updatedPatient = await this.repository.updateState(patientId, targetState, tx);
      logger.info('Patient transfer requested', { patientId, targetState, actionType });
      return updatedPatient;
    });
  }

  transferParoToOrtho(patientId: string, medecinId: string) {
    return this.transferPatient(patientId, medecinId, Profession.ORTHODONTAIRE, ActionType.TRANSFER_ORTHO);
  }

  transferOrthoToParo(patientId: string, medecinId: string) {
    return this.transferPatient(patientId, medecinId, Profession.PARODONTAIRE, ActionType.TRANSFER_PARO);
  }

  validateTransfer(actionId: string) {
    return this.actionService.validateTransferToOrtho(actionId);
  }
}

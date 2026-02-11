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
import { MedecinRepository } from '../medecin/medecin.repository.js';
import { NotificationService } from '../notification/notification.service.js';

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
  private readonly notificationService: NotificationService;
  private readonly medecinRepository: MedecinRepository;

  constructor(
    private readonly repository = new PatientRepository(),
    private readonly actionsRepository = new ActionsRepository()
  ) {
    this.actionService = new ActionsService(this.actionsRepository);
    this.notificationService = new NotificationService();
    this.medecinRepository = new MedecinRepository();
  }

  async list(user?: { id: string; role: any }) {
    if (user && user.role === 'MEDECIN') {
      const medecin = await this.medecinRepository.findByUserId(user.id);
      if (medecin) {
        return this.repository.findAllByState(medecin.profession);
      }
      return []; // Fallback if medecin profile not found
    }
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

      // Send notification (async, not blocking transaction)
      // Getting medecin user ID would require an extra query if not available
      // For now we trust the client logic or we'd need to fetch medecin.userId

      const medecin = await tx.medecin.findUnique({
        where: { id: medecinId },
        select: { userId: true, user: { select: { name: true } } }
      });

      if (medecin) {
        const fromField = targetState === Profession.ORTHODONTAIRE ? 'PARODONTAIRE' : 'ORTHODONTAIRE';
        const toField = targetState === Profession.ORTHODONTAIRE ? 'ORTHODONTAIRE' : 'PARODONTAIRE';

        // Notify all doctors in the target field
        const targetMedecins = await tx.medecin.findMany({
          where: { profession: targetState },
          select: { userId: true }
        });

        const patientName = `${patient.nom} ${patient.prenom}`;
        const transferredBy = medecin.user.name ?? 'Inconnu';

        await Promise.all(
          targetMedecins.map((target) =>
            this.notificationService.notifyPatientTransferred(
              target.userId,
              patientId,
              patientName,
              fromField,
              toField,
              transferredBy
            )
          )
        );

        logger.info('Patient transfer notification sent', {
          patientId,
          targetState,
          recipientCount: targetMedecins.length
        });
      }

      return updatedPatient;
    });
  }

  transferParoToOrtho(patientId: string, medecinId: string) {
    // Notify doctors in ORTHO field?
    // For now, let's implement the notification triggers in validateTransfer or here if we identify the target.
    // Since we don't have a specific target user, we'll skip detailed targeting for now 
    // or implement a broadcast mechanism later.
    // However, the Action is created by `medecinId`.

    return this.transferPatient(patientId, medecinId, Profession.ORTHODONTAIRE, ActionType.TRANSFER_ORTHO);
  }

  transferOrthoToParo(patientId: string, medecinId: string) {
    return this.transferPatient(patientId, medecinId, Profession.PARODONTAIRE, ActionType.TRANSFER_PARO);
  }

  validateTransfer(actionId: string) {
    return this.actionService.validateTransferToOrtho(actionId);
  }
}

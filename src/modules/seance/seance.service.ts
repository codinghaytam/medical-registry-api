import { Profession, SeanceType } from '@prisma/client';
import { ApiError } from '../../utils/apiError.js';
import { safeKeycloakConnect, type KeycloakAdminClient, type KcAdminClient } from '../../utils/keycloak.js';
import { MedecinRepository } from '../medecin/medecin.repository.js';
import { SeanceRepository } from './seance.repository.js';

interface SeancePayload {
  type: SeanceType;
  date: Date;
  patientId: string;
  medecinId: string;
}

interface SeanceUpdatePayload {
  type?: SeanceType;
  date?: Date;
  patientId?: string;
  medecinId?: string;
}

const PARO_ONLY_TYPES: SeanceType[] = ['DETARTRAGE', 'SURFACAGE', 'REEVALUATION'];
const ORTHO_ONLY_TYPES: SeanceType[] = [
  'ACTIVATION',
  'DEBUT_DE_TRAITEMENT',
  'FIN_DE_TRAITEMENT',
  'SUIVI_POST_TRAITEMENT'
];

export class SeanceService {
  constructor(
    private readonly repository = new SeanceRepository(),
    private readonly medecinRepository = new MedecinRepository()
  ) {}

  private async validateTypeWithMedecin(type: SeanceType, medecinId: string) {
    const medecin = await this.medecinRepository.findById(medecinId);
    if (!medecin) {
      throw ApiError.notFound('Médecin introuvable');
    }

    if (PARO_ONLY_TYPES.includes(type) && medecin.profession !== Profession.PARODONTAIRE) {
      throw ApiError.badRequest(`Les séances de type ${type} nécessitent un médecin PARODONTAIRE`);
    }

    if (ORTHO_ONLY_TYPES.includes(type) && medecin.profession !== Profession.ORTHODONTAIRE) {
      throw ApiError.badRequest(`Les séances de type ${type} nécessitent un médecin ORTHODONTAIRE`);
    }

    return medecin;
  }

  private async attachKeycloakInfo(seance: any, kc: KcAdminClient | null) {
    if (!kc) {
      return { ...seance, medecin: { ...seance.medecin, userInfo: null } };
    }

    try {
      const userInfo = await kc.users.findOne({ id: seance.medecin.userId });
      return {
        ...seance,
        medecin: {
          ...seance.medecin,
          userInfo: userInfo ?? null
        }
      };
    } catch (error) {
      return { ...seance, medecin: { ...seance.medecin, userInfo: null } };
    }
  }

  async list() {
    const seances = await this.repository.findAll();
    const kc = await safeKeycloakConnect();
    return Promise.all(seances.map((seance) => this.attachKeycloakInfo(seance, kc)));
  }

  async getById(id: string) {
    const seance = await this.repository.findById(id);
    if (!seance) {
      throw ApiError.notFound('Seance not found');
    }
    const kc = await safeKeycloakConnect();
    return this.attachKeycloakInfo(seance, kc);
  }

  async create(payload: SeancePayload) {
    await this.validateTypeWithMedecin(payload.type, payload.medecinId);

    const seance = await this.repository.create({
      type: payload.type,
      date: payload.date,
      patient: { connect: { id: payload.patientId } },
      medecin: { connect: { id: payload.medecinId } }
    });

    const kc = await safeKeycloakConnect();
    return this.attachKeycloakInfo(seance, kc);
  }

  async update(id: string, payload: SeanceUpdatePayload) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw ApiError.notFound('Seance not found');
    }

    const nextType = payload.type ?? current.type;
    const nextMedecinId = payload.medecinId ?? current.medecinId;
    await this.validateTypeWithMedecin(nextType, nextMedecinId);

    const updated = await this.repository.update(id, {
      type: payload.type,
      date: payload.date,
      patient: payload.patientId ? { connect: { id: payload.patientId } } : undefined,
      medecin: payload.medecinId ? { connect: { id: payload.medecinId } } : undefined
    });

    const kc = await safeKeycloakConnect();
    return this.attachKeycloakInfo(updated, kc);
  }

  async remove(id: string) {
    await this.repository.delete(id);
  }
}

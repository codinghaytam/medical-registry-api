import { Profession, Role } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { safeKeycloakConnect, type KeycloakAdminClient } from '../../utils/keycloak.js';
import { logger } from '../../utils/logger.js';
import { UserRepository } from '../users/user.repository.js';
import { MedecinRepository } from './medecin.repository.js';

interface MedecinPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profession: Profession;
  isSpecialiste: boolean;
  pwd: string;
  phone?: string;
}

interface MedecinUpdatePayload extends Partial<MedecinPayload> {}

export class MedecinService {
  constructor(
    private readonly repository = new MedecinRepository(),
    private readonly userRepository = new UserRepository()
  ) {}

  private async getKeycloakClient(): Promise<KcAdminClient> {
    const client = await safeKeycloakConnect();
    if (!client) {
      throw ApiError.internal('Keycloak service unavailable');
    }
    return client;
  }

  private buildName(firstName: string, lastName: string) {
    return `${firstName} ${lastName}`.trim();
  }

  list() {
    return this.repository.findAll();
  }

  findByProfession(profession: Profession) {
    return this.repository.findByProfession(profession);
  }

  async getById(id: string) {
    const medecin = await this.repository.findById(id);
    if (!medecin) {
      throw ApiError.notFound('Medecin not found');
    }
    return medecin;
  }

  async getByEmail(email: string) {
    const medecin = await this.repository.findByEmail(email);
    if (!medecin) {
      throw ApiError.notFound('Medecin not found');
    }
    return medecin;
  }

  async create(payload: MedecinPayload) {
    if (!(payload.profession in Profession)) {
      throw ApiError.badRequest('Invalid profession');
    }

    const kc = await this.getKeycloakClient();

    await kc.users.create({
      username: payload.username,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      enabled: true,
      credentials: [
        {
          type: 'password',
          value: payload.pwd,
          temporary: false
        }
      ],
      attributes: payload.phone ? { phoneNumber: [payload.phone] } : undefined
    });

    return prisma.$transaction(async (tx) => {
      const user = await this.userRepository.create(
        {
          username: payload.username,
          name: this.buildName(payload.firstName, payload.lastName),
          email: payload.email,
          role: Role.MEDECIN,
          phone: payload.phone ?? ''
        },
        tx
      );

      return this.repository.create(
        {
          profession: payload.profession,
          isSpecialiste: payload.isSpecialiste,
          user: { connect: { id: user.id } }
        },
        tx
      );
    });
  }

  async update(id: string, payload: MedecinUpdatePayload) {
    const medecin = await this.repository.findById(id);
    if (!medecin) {
      throw ApiError.notFound('Medecin not found');
    }

    if (payload.profession && !(payload.profession in Profession)) {
      throw ApiError.badRequest('Invalid profession');
    }

    const kc = await this.getKeycloakClient();
    const kcUsers = await kc.users.find({ email: medecin.user.email });
    const kcUser = kcUsers[0];

    if (kcUser?.id) {
      await kc.users.update(
        { id: kcUser.id },
        {
          email: payload.email ?? medecin.user.email,
          username: payload.username ?? medecin.user.username,
          firstName: payload.firstName ?? medecin.user.name.split(' ')[0],
          lastName: payload.lastName ?? medecin.user.name.split(' ').slice(1).join(' '),
          attributes: payload.phone !== undefined ? { phoneNumber: [payload.phone] } : undefined
        }
      );

      if (payload.pwd) {
        await kc.users.resetPassword({
          id: kcUser.id,
          credential: {
            type: 'password',
            value: payload.pwd,
            temporary: false
          }
        });
      }
    }

    return prisma.$transaction(async (tx) => {
      await this.userRepository.update(
        medecin.userId,
        {
          email: payload.email,
          username: payload.username,
          name:
            payload.firstName && payload.lastName
              ? this.buildName(payload.firstName, payload.lastName)
              : undefined,
          phone: payload.phone
        },
        tx
      );

      return this.repository.update(
        id,
        {
          profession: payload.profession,
          isSpecialiste: payload.isSpecialiste
        },
        tx
      );
    });
  }

  async delete(userId: string) {
    const medecin = await this.repository.findByUserId(userId);
    if (!medecin) {
      throw ApiError.notFound('Medecin not found');
    }

    if (!(medecin.profession in Profession)) {
      throw ApiError.badRequest('Invalid profession');
    }

    await prisma.$transaction(async (tx) => {
      await this.repository.delete(medecin.id, tx);
      await this.userRepository.delete(medecin.userId, tx);
    });

    const kc = await this.getKeycloakClient();
    const kcUsers = await kc.users.find({ email: medecin.user.email });
    if (kcUsers[0]?.id) {
      await kc.users.del({ id: kcUsers[0].id });
    } else {
      logger.warn('Unable to delete Keycloak user for medecin', { email: medecin.user.email });
    }
  }
}

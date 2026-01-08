import { Role } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { safeKeycloakConnect, type KeycloakAdminClient } from '../../utils/keycloak.js';
import { UserRepository } from '../users/user.repository.js';
import { EtudiantRepository } from './etudiant.repository.js';

interface EtudiantPayload {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  niveau: string;
  pwd: string;
  phone?: string;
}

interface EtudiantUpdatePayload extends Partial<EtudiantPayload> {}

export class EtudiantService {
  constructor(
    private readonly repository = new EtudiantRepository(),
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

  async getById(id: string) {
    const etudiant = await this.repository.findById(id);
    if (!etudiant) {
      throw ApiError.notFound('Etudiant not found');
    }
    return etudiant;
  }

  async create(payload: EtudiantPayload) {
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
          email: payload.email,
          name: this.buildName(payload.firstName, payload.lastName),
          role: Role.ETUDIANT,
          phone: payload.phone ?? ''
        },
        tx
      );

      return this.repository.create(
        {
          user: { connect: { id: user.id } },
          niveau: parseInt(payload.niveau, 10)
        },
        tx
      );
    });
  }

  async update(id: string, payload: EtudiantUpdatePayload) {
    const etudiant = await this.repository.findById(id);
    if (!etudiant) {
      throw ApiError.notFound('Etudiant not found');
    }

    const kc = await this.getKeycloakClient();
    const kcUsers = await kc.users.find({ email: etudiant.user.email });
    const kcUser = kcUsers[0];

    if (kcUser?.id) {
      await kc.users.update(
        { id: kcUser.id },
        {
          username: payload.username ?? etudiant.user.username,
          email: payload.email ?? etudiant.user.email,
          firstName: payload.firstName ?? etudiant.user.name.split(' ')[0],
          lastName: payload.lastName ?? etudiant.user.name.split(' ').slice(1).join(' '),
          attributes: payload.phone !== undefined ? { phoneNumber: [payload.phone] } : undefined,
          enabled: true
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
        etudiant.userId,
        {
          username: payload.username,
          email: payload.email,
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
          niveau: payload.niveau ? parseInt(payload.niveau, 10) : undefined
        },
        tx
      );
    });
  }

  async delete(userId: string) {
    const etudiant = await this.repository.findByUserId(userId);
    if (!etudiant) {
      throw ApiError.notFound('Etudiant not found');
    }

    const kc = await this.getKeycloakClient();
    const kcUsers = await kc.users.find({ email: etudiant.user.email });

    await prisma.$transaction(async (tx) => {
      await this.repository.delete(etudiant.id, tx);
      await this.userRepository.delete(etudiant.userId, tx);
    });

    if (kcUsers[0]?.id) {
      await kc.users.del({ id: kcUsers[0].id });
    }
  }
}

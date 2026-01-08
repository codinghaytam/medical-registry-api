import { Role } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { getUserByEmail, safeKeycloakConnect, type KeycloakAdminClient } from '../../utils/keycloak.js';
import { logger } from '../../utils/logger.js';
import { MedecinRepository } from '../medecin/medecin.repository.js';
import { EtudiantRepository } from '../etudiant/etudiant.repository.js';
import { UserRepository } from './user.repository.js';
import { type KeycloakAdminRestClient } from '../../utils/keycloak.js';

interface UserPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  pwd: string;
}

interface UpdatePayload extends Partial<UserPayload> {
  pwd?: string;
}

export class UserService {
  constructor(
    private readonly repository = new UserRepository(),
    private readonly medecinRepository = new MedecinRepository(),
    private readonly etudiantRepository = new EtudiantRepository()
  ) {}

  list() {
    return this.repository.findAll();
  }

  getByRole(role: Role) {
    return this.repository.findByRole(role);
  }

  async getById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  getByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  private async getKeycloakClient(): Promise<KeycloakAdminRestClient> {
    const client = await safeKeycloakConnect();
    if (!client) {
      throw ApiError.internal('Keycloak service unavailable');
    }
    return client;
  }

  private buildDisplayName(firstName: string, lastName: string) {
    return `${firstName} ${lastName}`.trim();
  }

  async getMedecinsWithKeycloak() {
    const medecins = await this.medecinRepository.findAll();
    const kc = await this.getKeycloakClient();

    const results = await Promise.all(
      medecins.map(async (medecin) => {
        try {
          const kcUser = await kc.users.findOne({ id: medecin.userId });
          return { ...medecin, userInfo: kcUser ?? null };
        } catch (error) {
          logger.warn('Failed to fetch Keycloak user for medecin', { error });
          return { ...medecin, userInfo: null };
        }
      })
    );

    return results;
  }

  async create(payload: UserPayload) {
    const existingUser = await this.repository.findByEmail(payload.email);
    if (existingUser) {
      throw ApiError.badRequest('User with this email already exists');
    }

    const kcExisting = await getUserByEmail(payload.email);
    if (kcExisting) {
      throw ApiError.badRequest('User with this email already exists in Keycloak');
    }

    const kc = await this.getKeycloakClient();

    const kcUser = await kc.users.create({
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

    const user = await this.repository.create({
      username: payload.username,
      email: payload.email,
      name: this.buildDisplayName(payload.firstName, payload.lastName),
      role: payload.role,
      phone: payload.phone ?? ''
    });

    return { ...user, keycloakId: kcUser.id };
  }

  async update(id: string, payload: UpdatePayload) {
    const currentUser = await this.getById(id);
    const kc = await this.getKeycloakClient();

    if (payload.role && !(payload.role in Role)) {
      throw ApiError.badRequest('Invalid role');
    }

    if (payload.email && payload.email !== currentUser.email) {
      const existing = await this.repository.findByEmail(payload.email);
      if (existing && existing.id !== id) {
        throw ApiError.conflict('Email already in use');
      }
    }

    const kcUsers = await kc.users.find({ email: currentUser.email });
    const kcUser = kcUsers[0];

    if (kcUser?.id) {
      await kc.users.update(
        { id: kcUser.id },
        {
          email: payload.email ?? currentUser.email,
          username: payload.username ?? currentUser.username,
          firstName: payload.firstName ?? currentUser.name.split(' ')[0],
          lastName: payload.lastName ?? currentUser.name.split(' ').slice(1).join(' '),
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

    const updated = await this.repository.update(id, {
      username: payload.username,
      email: payload.email,
      name:
        payload.firstName && payload.lastName
          ? this.buildDisplayName(payload.firstName, payload.lastName)
          : undefined,
      role: payload.role,
      phone: payload.phone
    });

    return updated;
  }

  async delete(id: string) {
    const user = await this.getById(id);
    await prisma.$transaction(async (tx) => {
      if (user.role === 'MEDECIN') {
        const medecin = await this.medecinRepository.findByUserId(id, tx);
        if (medecin) {
          await this.medecinRepository.delete(medecin.id, tx);
        }
      }

      if (user.role === 'ETUDIANT') {
        const etudiant = await this.etudiantRepository.findByUserId(id, tx);
        if (etudiant) {
          await this.etudiantRepository.delete(etudiant.id, tx);
        }
      }

      await this.repository.delete(id, tx);
    });

    const kc = await this.getKeycloakClient();
    const kcUsers = await kc.users.find({ email: user.email });
    if (kcUsers[0]?.id) {
      await kc.users.del({ id: kcUsers[0].id });
    }
  }
}

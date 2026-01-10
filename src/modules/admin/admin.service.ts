import { Role } from '@prisma/client';
import { ApiError } from '../../utils/apiError.js';
import { getUserByEmail, safeKeycloakConnect, type KeycloakAdminClient, type KcAdminClient } from '../../utils/keycloak.js';
import { logger } from '../../utils/logger.js';
import { UserRepository } from '../users/user.repository.js';

interface AdminPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  pwd?: string;
}

export class AdminService {
  constructor(private readonly repository = new UserRepository()) {}

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

  private async ensureAdminById(id: string) {
    const user = await this.repository.findById(id);
    if (!user || user.role !== Role.ADMIN) {
      throw ApiError.notFound('Admin not found');
    }
    return user;
  }

  private async fetchKeycloakUserById(kc: KcAdminClient, id: string) {
    try {
      return await kc.users.findOne({ id });
    } catch (error) {
      logger.warn('Keycloak lookup by ID failed', { id, error });
      return null;
    }
  }

  private async attachKeycloakDetails(user: { email: string }) {
    const kc = await this.getKeycloakClient();
    const kcUser = await getUserByEmail(user.email);
    return kcUser ?? null;
  }

  async list() {
    const admins = await this.repository.findByRole(Role.ADMIN);
    const kc = await this.getKeycloakClient();

    return Promise.all(
      admins.map(async (admin) => {
        const kcUser = await getUserByEmail(admin.email);
        return { ...admin, keycloakDetails: kcUser ?? null };
      })
    );
  }

  async getByEmail(email: string) {
    const admin = await this.repository.findByEmail(email);
    if (!admin || admin.role !== Role.ADMIN) {
      throw ApiError.notFound('Admin not found in database');
    }

    const kcUser = await getUserByEmail(email);
    return { ...admin, keycloakDetails: kcUser ?? null };
  }

  async getById(id: string) {
    const kc = await this.getKeycloakClient();
    const kcUser = await this.fetchKeycloakUserById(kc, id);

    if (kcUser?.email) {
      const admin = await this.repository.findByEmail(kcUser.email);
      if (!admin || admin.role !== Role.ADMIN) {
        throw ApiError.notFound('User is not an admin in the database');
      }
      return { ...kcUser, dbUser: admin };
    }

    const admin = await this.repository.findById(id);
    if (!admin || admin.role !== Role.ADMIN) {
      throw ApiError.notFound('Admin not found');
    }

    const kcDetails = await getUserByEmail(admin.email);
    return { ...admin, keycloakDetails: kcDetails ?? null };
  }

  async create(payload: AdminPayload) {
    const existing = await this.repository.findByEmail(payload.email);
    if (existing) {
      throw ApiError.badRequest('User with this email already exists');
    }

    const existingKc = await getUserByEmail(payload.email);
    if (existingKc) {
      throw ApiError.badRequest('User with this email already exists in Keycloak');
    }

    const kc = await this.getKeycloakClient();

    const kcUser = await kc.users.create({
      username: payload.username,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      enabled: true,
      credentials: payload.pwd
        ? [
            {
              type: 'password',
              value: payload.pwd,
              temporary: false
            }
          ]
        : undefined
    });

    const user = await this.repository.create({
      username: payload.username,
      email: payload.email,
      name: this.buildName(payload.firstName, payload.lastName),
      role: Role.ADMIN,
      phone: ''
    });

    return { ...user, keycloakId: kcUser.id };
  }

  async update(id: string, payload: Partial<AdminPayload>) {
    const admin = await this.ensureAdminById(id);
    const kc = await this.getKeycloakClient();

    const kcUser = await getUserByEmail(admin.email);
    if (!kcUser || !kcUser.id) {
      throw ApiError.notFound('Admin not found in Keycloak');
    }

    await kc.users.update(
      { id: kcUser.id },
      {
        username: payload.username ?? admin.username,
        email: payload.email ?? admin.email,
        firstName: payload.firstName ?? admin.name.split(' ')[0],
        lastName: payload.lastName ?? admin.name.split(' ').slice(1).join(' ')
      }
    );

    if (payload.pwd) {
      await kc.users.resetPassword({
        id: kcUser.id,
        credential: {
          temporary: false,
          type: 'password',
          value: payload.pwd
        }
      });
    }

    const updated = await this.repository.update(id, {
      username: payload.username,
      email: payload.email,
      name:
        payload.firstName && payload.lastName
          ? this.buildName(payload.firstName, payload.lastName)
          : undefined
    });

    const keycloakDetails = await kc.users.findOne({ id: kcUser.id });
    return { ...updated, keycloakDetails };
  }

  async delete(id: string) {
    const admin = await this.ensureAdminById(id);
    const kc = await this.getKeycloakClient();

    const kcUser = await getUserByEmail(admin.email);

    await this.repository.delete(id);

    if (kcUser?.id) {
      await kc.users.del({ id: kcUser.id });
    }
  }
}

import { ApiError } from '../../utils/apiError.js';
import { getUserByEmail, safeKeycloakConnect } from '../../utils/keycloak.js';
import { UserRepository } from '../users/user.repository.js';

interface VerifyOptions {
  redirectUri?: string;
  clientId?: string;
}

export class VerifyEmailService {
  constructor(private readonly userRepository = new UserRepository()) {}

  private async ensureDbUser(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.notFound('User not found in database');
    }
    return user;
  }

  private async getKeycloakUser(email: string) {
    const kcUser = await getUserByEmail(email);
    if (!kcUser || !kcUser.id) {
      throw ApiError.notFound('User not found in Keycloak');
    }
    return kcUser;
  }

  private async getKeycloakClient() {
    const kc = await safeKeycloakConnect();
    if (!kc) {
      throw ApiError.internal('Keycloak service unavailable');
    }
    return kc;
  }

  async sendVerification(email: string, options: VerifyOptions) {
    const dbUser = await this.ensureDbUser(email);
    const kc = await this.getKeycloakClient();
    const kcUser = await this.getKeycloakUser(email);

    if (!kcUser.id) {
        throw ApiError.internal('Keycloak user ID missing');
    }

    await kc.users.sendVerifyEmail({ id: kcUser.id, ...options });

    return {
      message: 'Email verification sent successfully',
      userId: dbUser.id,
      email,
      emailVerified: kcUser.emailVerified ?? false
    };
  }

  async getStatus(email: string) {
    const dbUser = await this.ensureDbUser(email);
    const kcUser = await this.getKeycloakUser(email);

    return {
      userId: dbUser.id,
      email,
      emailVerified: kcUser.emailVerified ?? false,
      userEnabled: kcUser.enabled ?? false
    };
  }

  async resend(email: string, options: VerifyOptions) {
    const status = await this.sendVerification(email, options);
    status.message = 'Email verification resent successfully';
    return status;
  }

  async markVerified(email: string) {
    await this.ensureDbUser(email);
    const kc = await this.getKeycloakClient();
    const kcUser = await this.getKeycloakUser(email);

    if (!kcUser.id) {
        throw ApiError.internal('Keycloak user ID missing');
    }

    await kc.users.update({ id: kcUser.id }, { emailVerified: true });

    return {
      message: 'Email marked as verified successfully',
      userId: kcUser.id,
      email,
      emailVerified: true
    };
  }
}

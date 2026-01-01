import { ApiError } from '../../utils/apiError.js';
import { getUserByEmail, safeKeycloakConnect } from '../../utils/keycloak.js';
import { UserRepository } from '../users/user.repository.js';

export class PasswordChangeService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async changePassword(email: string, newPassword: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const kc = await safeKeycloakConnect();
    if (!kc) {
      throw ApiError.internal('Keycloak service unavailable');
    }

    const kcUser = await getUserByEmail(email);
    if (!kcUser?.id) {
      throw ApiError.notFound('User not found in Keycloak');
    }

    await kc.users.resetPassword({
      id: kcUser.id,
      credential: {
        type: 'password',
        value: newPassword,
        temporary: false
      }
    });

    return { userId: user.id, email };
  }
}

import axios from 'axios';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { ApiError } from '../../utils/apiError.js';
import { UserRepository } from '../users/user.repository.js';
import { UserService } from '../users/user.service.js';
import type { LoginBody, LogoutBody, RefreshBody, SignupBody } from './auth.dto.js';

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope?: string;
}

interface KeycloakTokenPayload extends JwtPayload {
  email?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
}

export class AuthService {
  private readonly tokenEndpoint: string;
  private readonly logoutEndpoint: string;
  private readonly clientId: string;
  private readonly clientSecret?: string;

  constructor(
    private readonly userRepository = new UserRepository(),
    private readonly userService = new UserService()
  ) {
    this.tokenEndpoint = `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
    this.logoutEndpoint = `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`;
    this.clientId = process.env.KEYCLOAK_CLIENT_ID!;
    this.clientSecret = process.env.KEYCLOAK_CLIENT_SECRET ?? undefined;
  }

  async login(payload: LoginBody) {
    const tokenResponse = await this.exchangeToken({
      grant_type: 'password',
      username: payload.username,
      password: payload.password
    });

    const user = await this.buildUserContext(tokenResponse.access_token, payload.username);
    return { ...tokenResponse, user };
  }

  async refresh(payload: RefreshBody) {
    const tokenResponse = await this.exchangeToken({
      grant_type: 'refresh_token',
      refresh_token: payload.refreshToken
    });

    const user = await this.buildUserContext(tokenResponse.access_token);
    return { ...tokenResponse, user };
  }

  async logout(payload: LogoutBody) {
    const params = this.buildFormData({
      client_id: this.clientId,
      refresh_token: payload.refreshToken,
      ...(this.clientSecret ? { client_secret: this.clientSecret } : {})
    });

    try {
      await axios.post(this.logoutEndpoint, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    } catch (error) {
      throw ApiError.internal('Failed to logout from Keycloak');
    }
  }

  async signup(payload: SignupBody) {
    const user = await this.userService.create({
      username: payload.username,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      role: Role.ETUDIANT,
      pwd: payload.password
    });

    return user;
  }

  private buildFormData(values: Record<string, string>) {
    const body = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => body.append(key, value));
    return body.toString();
  }

  private async exchangeToken(values: Record<string, string>) {
    const params = this.buildFormData({
      client_id: this.clientId,
      ...(this.clientSecret ? { client_secret: this.clientSecret } : {}),
      ...values
    });

    try {
      const { data } = await axios.post<KeycloakTokenResponse>(this.tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // Propagate standard OAuth2 error messages
        const message = data?.error_description || data?.error || 'Authentication failed';

        if (status === 401) {
          throw ApiError.unauthorized('Invalid credentials');
        }

        if (status === 400) {
          // invalid_grant usually means token is expired, revoked, or used already
          throw ApiError.badRequest(message);
        }

        console.error('Keycloak token exchange error:', {
          status,
          error: data?.error,
          description: data?.error_description
        });
      }

      throw ApiError.internal('Authentication service unavailable');
    }
  }

  private async buildUserContext(accessToken: string, fallbackIdentifier?: string) {
    const decoded = jwt.decode(accessToken) as KeycloakTokenPayload | null;
    if (!decoded) {
      throw ApiError.unauthorized('Invalid token payload from identity provider');
    }

    const roleSet = new Set<string>();
    decoded.realm_access?.roles?.forEach((role) => roleSet.add(role));
    if (decoded.resource_access) {
      Object.values(decoded.resource_access).forEach((resource) => {
        resource?.roles?.forEach((role) => roleSet.add(role));
      });
    }

    const email = decoded.email ?? fallbackIdentifier ?? null;
    const username = decoded.preferred_username ?? fallbackIdentifier ?? null;

    let fallbackRole: string | null = null;
    let dbUserId: string | null = null;

    if (email) {
      const dbUser = await this.userRepository.findByEmail(email);
      if (dbUser) {
        dbUserId = dbUser.id;
        fallbackRole = dbUser.role;
        if (roleSet.size === 0) {
          roleSet.add(dbUser.role);
        }
      }
    }

    return {
      id: decoded.sub ?? dbUserId,
      email,
      username,
      roles: Array.from(roleSet),
      fallbackRole,
      keycloakId: decoded.sub ?? null
    };
  }
}

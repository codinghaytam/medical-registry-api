import axios from 'axios';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { UserRepository } from '../modules/users/user.repository.js';
dotenv.config();
const TOKEN_EXPIRY_SAFETY_WINDOW_MS = 5 * 1000;
const userRepository = new UserRepository();
export class KeycloakAdminRestClient {
    config;
    http;
    accessToken = null;
    tokenExpiresAt = 0;
    authenticating = null;
    constructor(config, timeout = 10_000) {
        this.config = config;
        this.http = axios.create({
            baseURL: this.config.baseUrl,
            timeout
        });
    }
    /**
     * Ensures we have a valid access token before issuing API calls.
     */
    async ensureAuthenticated() {
        await this.ensureToken();
    }
    users = {
        find: (params = {}) => this.findUsers(params),
        findOne: ({ id }) => this.findUserById(id),
        create: (payload) => this.createUser(payload),
        update: ({ id }, data) => this.updateUser(id, data),
        resetPassword: ({ id, credential }) => this.resetPassword(id, credential),
        del: ({ id }) => this.deleteUser(id),
        sendVerifyEmail: (options) => this.sendVerifyEmail(options)
    };
    get realmBasePath() {
        return `/admin/realms/${this.config.realm}`;
    }
    async authenticate() {
        const tokenUrl = `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/token`;
        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret
        });
        const response = await this.http.post(tokenUrl.replace(this.config.baseUrl, ''), body.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const expiresInSeconds = response.data.expires_in ?? 60;
        this.accessToken = response.data.access_token;
        this.tokenExpiresAt = Date.now() + expiresInSeconds * 1000 - TOKEN_EXPIRY_SAFETY_WINDOW_MS;
    }
    async ensureToken() {
        const tokenValid = this.accessToken && Date.now() < this.tokenExpiresAt;
        if (tokenValid) {
            return;
        }
        if (!this.authenticating) {
            this.authenticating = this.authenticate().finally(() => {
                this.authenticating = null;
            });
        }
        await this.authenticating;
    }
    async authorizedRequest(config) {
        await this.ensureToken();
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: 'application/json',
            ...config.headers
        };
        try {
            return await this.http.request({ ...config, headers });
        }
        catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                // Token likely expired unexpectedly, force refresh once.
                this.accessToken = null;
                this.tokenExpiresAt = 0;
                await this.ensureToken();
                return this.http.request({ ...config, headers: { ...headers, Authorization: `Bearer ${this.accessToken}` } });
            }
            throw error;
        }
    }
    async findUsers(params) {
        const response = await this.authorizedRequest({
            method: 'get',
            url: `${this.realmBasePath}/users`,
            params
        });
        return response.data;
    }
    async findUserById(id) {
        const response = await this.authorizedRequest({
            method: 'get',
            url: `${this.realmBasePath}/users/${id}`
        });
        return response.data;
    }
    async createUser(payload) {
        const response = await this.authorizedRequest({
            method: 'post',
            url: `${this.realmBasePath}/users`,
            data: payload,
            validateStatus: (status) => status >= 200 && status < 400
        });
        const locationHeader = response.headers?.location || response.headers?.Location;
        const idFromLocation = locationHeader ? locationHeader.split('/').pop() : undefined;
        return { id: idFromLocation };
    }
    async updateUser(id, data) {
        await this.authorizedRequest({
            method: 'put',
            url: `${this.realmBasePath}/users/${id}`,
            data
        });
    }
    async resetPassword(id, credential) {
        await this.authorizedRequest({
            method: 'put',
            url: `${this.realmBasePath}/users/${id}/reset-password`,
            data: credential
        });
    }
    async deleteUser(id) {
        await this.authorizedRequest({
            method: 'delete',
            url: `${this.realmBasePath}/users/${id}`
        });
    }
    async sendVerifyEmail({ id, clientId, redirectUri }) {
        await this.authorizedRequest({
            method: 'put',
            url: `${this.realmBasePath}/users/${id}/send-verify-email`,
            params: {
                client_id: clientId ?? this.config.clientId,
                redirect_uri: redirectUri
            }
        });
    }
}
let keycloakConnection = null;
// Validate required environment variables
const requiredEnvVars = ['KEYCLOAK_BASE_URL', 'KEYCLOAK_REALM', 'KEYCLOAK_CLIENT_ID', 'KEYCLOAK_CLIENT_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
export async function connectToKeycloak() {
    if (!keycloakConnection) {
        keycloakConnection = new KeycloakAdminRestClient({
            baseUrl: process.env.KEYCLOAK_BASE_URL,
            realm: process.env.KEYCLOAK_REALM,
            clientId: process.env.KEYCLOAK_CLIENT_ID,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET
        });
    }
    try {
        await keycloakConnection.ensureAuthenticated();
        return keycloakConnection;
    }
    catch (error) {
        console.error('Failed to connect to Keycloak:', error);
        keycloakConnection = null;
        throw error;
    }
}
// Helper function to safely connect to Keycloak and handle errors
export async function safeKeycloakConnect(res) {
    try {
        return await connectToKeycloak();
    }
    catch (error) {
        console.error('Keycloak connection error:', error);
        if (res) {
            res.status(500).send({
                error: "Keycloak service unavailable",
                message: "Unable to connect to authentication service. Please try again later."
            });
        }
        return null;
    }
}
/**
 * Get a user from Keycloak by email
 * @param email The email address to search for
 * @param res Optional Express response object for error handling
 * @returns The Keycloak user record or null if not found
 */
export async function getUserByEmail(email, res) {
    try {
        const kc = await safeKeycloakConnect(res);
        if (!kc)
            return null;
        // Find users with the specified email
        const users = await kc.users.find({ email: email });
        // Return the first user found or null if no users are found
        return users && users.length > 0 ? users[0] : null;
    }
    catch (error) {
        console.error('Error finding Keycloak user by email:', error);
        return null;
    }
}
/**
 * Get multiple users from Keycloak by email pattern
 * @param emailPattern The email pattern to search for (can use wildcards like *)
 * @param res Optional Express response object for error handling
 * @returns Array of Keycloak user records or empty array if none found
 */
export async function getUsersByEmailPattern(emailPattern, res) {
    try {
        const kc = await safeKeycloakConnect(res);
        if (!kc)
            return [];
        // Find users with the email pattern (Keycloak handles wildcards in the search)
        const users = await kc.users.find({ email: emailPattern });
        return users || [];
    }
    catch (error) {
        console.error('Error finding Keycloak users by email pattern:', error);
        return [];
    }
}
/**
 * Get user from Keycloak by exact match on username or email
 * @param usernameOrEmail The username or email to search for
 * @param res Optional Express response object for error handling
 * @returns The Keycloak user record or null if not found
 */
export async function getUserByUsernameOrEmail(usernameOrEmail, res) {
    try {
        const kc = await safeKeycloakConnect(res);
        if (!kc)
            return null;
        // Try to find by exact username match
        let users = await kc.users.find({ username: usernameOrEmail, exact: true });
        // If not found by username, try by email
        if (!users || users.length === 0) {
            users = await kc.users.find({ email: usernameOrEmail });
        }
        return users && users.length > 0 ? users[0] : null;
    }
    catch (error) {
        console.error('Error finding Keycloak user by username or email:', error);
        return null;
    }
}
/**
 * Middleware to validate Keycloak JWT tokens
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
async function enrichDecodedPayload(decoded) {
    const normalizedRoles = new Set();
    decoded.realm_access?.roles?.forEach((role) => normalizedRoles.add(role));
    if (decoded.resource_access) {
        Object.values(decoded.resource_access).forEach((resource) => {
            resource?.roles?.forEach((role) => normalizedRoles.add(role));
        });
    }
    let fallbackRole = null;
    let dbUserId = null;
    if (normalizedRoles.size === 0 && decoded.email) {
        const dbUser = await userRepository.findByEmail(decoded.email);
        if (dbUser) {
            fallbackRole = dbUser.role;
            dbUserId = dbUser.id;
            normalizedRoles.add(dbUser.role);
        }
    }
    return {
        ...decoded,
        roles: Array.from(normalizedRoles),
        fallbackRole,
        dbUserId
    };
}
export async function validateKeycloakToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authorization header with Bearer token is required'
            });
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token is required'
            });
        }
        // Verify token with Keycloak public key
        const decoded = await verifyKeycloakToken(token);
        if (!decoded) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired token'
            });
        }
        if (typeof decoded === 'string') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token payload'
            });
        }
        const enrichedPayload = await enrichDecodedPayload(decoded);
        // Add user info to request object for use in routes
        req.user = enrichedPayload;
        next();
    }
    catch (error) {
        console.error('Token validation error:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token validation failed'
        });
    }
}
/**
 * Verify Keycloak JWT token using JWKS
 * @param token The JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export async function verifyKeycloakToken(token) {
    try {
        const client = jwksClient({
            jwksUri: `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`
        });
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
            return null;
        }
        const key = await client.getSigningKey(decoded.header.kid);
        const signingKey = key.getPublicKey();
        const verified = jwt.verify(token, signingKey, {
            algorithms: ['RS256'],
            issuer: `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}`
        });
        if (typeof verified === 'string') {
            return null;
        }
        return verified;
    }
    catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

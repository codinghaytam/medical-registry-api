import KcAdminClient from '@keycloak/keycloak-admin-client';
import * as dotenv from "dotenv";
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
dotenv.config();
let keycloakConnection = null;
const TOKEN_REFRESH_INTERVAL = 58 * 1000; // 58 seconds
// Validate required environment variables
const requiredEnvVars = ['KEYCLOAK_BASE_URL', 'KEYCLOAK_REALM', 'KEYCLOAK_CLIENT_ID', 'KEYCLOAK_CLIENT_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
const kcAdminClient = new KcAdminClient();
kcAdminClient.setConfig({
    realmName: process.env.KEYCLOAK_REALM,
    baseUrl: process.env.KEYCLOAK_BASE_URL,
});
export async function connectToKeycloak() {
    if (keycloakConnection) {
        return keycloakConnection;
    }
    try { // Using client credentials instead of user password
        await kcAdminClient.auth({
            grantType: 'client_credentials',
            clientId: process.env.KEYCLOAK_CLIENT_ID,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET
        });
        const refreshInterval = setInterval(async () => {
            try {
                // Using client credentials for refresh as well
                await kcAdminClient.auth({
                    grantType: 'client_credentials',
                    clientId: process.env.KEYCLOAK_CLIENT_ID,
                    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET
                });
            }
            catch (error) {
                console.error('Failed to refresh Keycloak token:', error);
                keycloakConnection = null;
                clearInterval(refreshInterval);
            }
        }, TOKEN_REFRESH_INTERVAL);
        keycloakConnection = kcAdminClient;
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
        // Add user info to request object for use in routes
        req.user = decoded;
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
        return verified;
    }
    catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

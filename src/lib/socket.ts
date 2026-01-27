import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';
import { verifyKeycloakToken } from '../utils/keycloak.js';
import { UserRepository } from '../modules/users/user.repository.js';

let io: Server | null = null;
const userRepository = new UserRepository();

export function initializeSocketIO(httpServer: HTTPServer, corsOrigins: string[]): Server {
    io = new Server(httpServer, {
        cors: {
            origin: corsOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Authentication middleware
    io.use(async (socket: Socket, next: (err?: Error) => void) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            // Verify token with Keycloak
            const decoded = await verifyKeycloakToken(token);

            if (!decoded) {
                return next(new Error('Invalid token'));
            }

            let dbUserId = decoded.sub || '';
            // Try to look up the DB user ID using email
            if (decoded.email) {
                const dbUser = await userRepository.findByEmail(decoded.email);
                if (dbUser) {
                    dbUserId = dbUser.id;
                } else {
                    logger.warn(`Socket connected with Keycloak user ${decoded.email} but no local DB user found.`);
                }
            }

            // Attach user info to socket
            socket.data.user = {
                id: dbUserId,
                email: decoded.email,
                name: decoded.name
            };

            next();
        } catch (error) {
            logger.error('Socket authentication failed', { error });
            next(new Error('Authentication failed'));
        }
    });

    // Connection handler
    io.on('connection', (socket: Socket) => {
        const userId = socket.data.user?.id;

        if (!userId) {
            socket.disconnect();
            return;
        }

        logger.info('Client connected to WebSocket', {
            socketId: socket.id,
            userId
        });

        // Join user-specific room
        const userRoom = `user:${userId}`;
        socket.join(userRoom);

        // Handle client events
        socket.on('notifications:request', async () => {
            // Client can request notifications refresh
            logger.debug('Notifications refresh requested', { userId });
        });

        socket.on('disconnect', (reason) => {
            logger.info('Client disconnected from WebSocket', {
                socketId: socket.id,
                userId,
                reason
            });
        });

        socket.on('error', (error) => {
            logger.error('Socket error', { socketId: socket.id, userId, error });
        });
    });

    logger.info('Socket.IO initialized successfully');
    return io;
}

export function getSocketIO(): Server | null {
    return io;
}

// Helper function to emit notification to specific user
export function emitToUser(userId: string, event: string, data: any) {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
}

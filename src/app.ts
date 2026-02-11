import express, { Express } from 'express';
import { createServer } from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { initializeSocketIO } from './lib/socket.js';

// Load environment variables first
dotenv.config();

// Validate environment configuration
import { getEnvironmentConfig, logConfiguration } from './utils/config.js';
import { registerFeatureRoutes } from './modules/routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

// Fallback path resolution
const rootDir = path.resolve();

// Validate and get configuration
const config = getEnvironmentConfig();

const app: Express = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocketIO(httpServer, config.CORS_ORIGINS);

// Log configuration (with secrets masked)
if (config.NODE_ENV === 'development') {
  logConfiguration(config);
}

// CORS middleware
app.use(cors({
  origin: config.CORS_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  credentials: true
}));

// view engine setup

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Serve files from public and upload directories
// Assuming run from project root
app.use(express.static(path.join(rootDir, 'public'))); // Changed from src/public based on typical project roots
app.use('/uploads', express.static(path.join(rootDir, 'upload')));

registerFeatureRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.PORT;

export { app, httpServer };
export default app;
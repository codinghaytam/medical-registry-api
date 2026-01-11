/**
 * Environment Configuration Validation
 * 
 * This file validates that all required environment variables are present
 * and provides helpful error messages if they're missing.
 */

interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;
  
  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  
  // Keycloak
  KEYCLOAK_BASE_URL: string;
  KEYCLOAK_REALM: string;
  KEYCLOAK_CLIENT_ID: string;
  KEYCLOAK_CLIENT_SECRET: string;
  
  // Admin credentials (optional)
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  
  // CORS
  CORS_ORIGINS: string[];
  
  // JWT
  JWT_EXPIRES_IN: string;
  
  // File upload
  MAX_FILE_SIZE: string;

  // Google Cloud Storage
  GCS_BUCKET_NAME: string;
  GCS_PROJECT_ID: string;
  GCS_SA_KEY: string;
  
  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Validates and returns the environment configuration
 * Throws an error if required variables are missing
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const requiredVars = [
    'DATABASE_URL',
    'KEYCLOAK_BASE_URL',
    'KEYCLOAK_REALM',
    'KEYCLOAK_CLIENT_ID',
    'KEYCLOAK_CLIENT_SECRET',
    'GCS_BUCKET_NAME',
    'GCS_PROJECT_ID',
    'GCS_SA_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.\n' +
      'Copy .env.example to .env and fill in the values.'
    );
  }

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV as EnvironmentConfig['NODE_ENV'];
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, production, test');
  }

  // Parse CORS_ORIGINS
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['*'];

  // Validate LOG_LEVEL
  const logLevel = (process.env.LOG_LEVEL as EnvironmentConfig['LOG_LEVEL']) || 'info';
  if (!['error', 'warn', 'info', 'debug'].includes(logLevel)) {
    throw new Error('LOG_LEVEL must be one of: error, warn, info, debug');
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: parseInt(process.env.PORT || '3000'),
    NODE_ENV: nodeEnv || 'development',
    KEYCLOAK_BASE_URL: process.env.KEYCLOAK_BASE_URL!,
    KEYCLOAK_REALM: process.env.KEYCLOAK_REALM!,
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID!,
    KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET!,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    CORS_ORIGINS: corsOrigins,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10MB',
    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME!,
    GCS_PROJECT_ID: process.env.GCS_PROJECT_ID!,
    GCS_SA_KEY: process.env.GCS_SA_KEY!,
    LOG_LEVEL: logLevel
  };
}

/**
 * Logs the current configuration (with secrets masked)
 */
export function logConfiguration(config: EnvironmentConfig): void {
  console.log('🔧 Application Configuration:');
  console.log(`  Environment: ${config.NODE_ENV}`);
  console.log(`  Port: ${config.PORT}`);
  console.log(`  Database: ${config.DATABASE_URL.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`  Keycloak URL: ${config.KEYCLOAK_BASE_URL}`);
  console.log(`  Keycloak Realm: ${config.KEYCLOAK_REALM}`);
  console.log(`  Keycloak Client: ${config.KEYCLOAK_CLIENT_ID}`);
  console.log(`  CORS Origins: ${config.CORS_ORIGINS.join(', ')}`);
  console.log(`  GCS Bucket: ${config.GCS_BUCKET_NAME}`);
  console.log(`  GCS Key Length: ${config.GCS_SA_KEY ? config.GCS_SA_KEY.length : 'MISSING'}`);
  console.log(`  Max File Size: ${config.MAX_FILE_SIZE}`);
  console.log(`  Log Level: ${config.LOG_LEVEL}`);
  console.log(`  JWT Expires: ${config.JWT_EXPIRES_IN}`);
  
  if (config.NODE_ENV === 'development') {
    console.log('⚠️  Development mode - using development defaults');
  }
}

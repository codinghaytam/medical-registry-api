import { getEnvironmentConfig, logConfiguration } from '../../../src/utils/config';

describe('utils/config', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    process.env.KEYCLOAK_BASE_URL = 'https://kc.example.com';
    process.env.KEYCLOAK_REALM = 'demo';
    process.env.KEYCLOAK_CLIENT_ID = 'client-id';
    process.env.KEYCLOAK_CLIENT_SECRET = 'client-secret';
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGINS = 'http://localhost:3000, https://app.example.com';
    process.env.LOG_LEVEL = 'info';
    process.env.PORT = '4000';
    process.env.GCS_BUCKET_NAME = 'test-bucket';
    process.env.GCS_PROJECT_ID = 'test-project';
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  test('getEnvironmentConfig returns parsed configuration', () => {
    const cfg = getEnvironmentConfig();
    expect(cfg.DATABASE_URL).toContain('postgres://');
    expect(cfg.PORT).toBe(4000);
    expect(cfg.NODE_ENV).toBe('test');
    expect(cfg.CORS_ORIGINS).toEqual(['http://localhost:3000', 'https://app.example.com']);
    expect(cfg.LOG_LEVEL).toBe('info');
  });

  test('getEnvironmentConfig throws when required vars missing', () => {
    delete process.env.KEYCLOAK_BASE_URL;
    expect(() => getEnvironmentConfig()).toThrow(/Missing required environment variables/);
  });

  test('logConfiguration masks database credentials and logs key fields', () => {
    const cfg = getEnvironmentConfig();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => { });

    logConfiguration(cfg);

    // Build concatenated logs for inspection
    const logs = spy.mock.calls.map(args => args.join(' ')).join('\n');
    expect(logs).toContain('Application Configuration');
    expect(logs).toContain('Environment: test');
    expect(logs).toContain('Port: 4000');
    expect(logs).toMatch(/Database: .*\/\/\*\*\*:\*\*\*@/);
  });
});

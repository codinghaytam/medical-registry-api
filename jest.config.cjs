module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.spec.ts', '**/tests/integration/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.test.json', diagnostics: { ignoreCodes: [151002] } }]
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/utils/**/*.ts'],
  coverageDirectory: 'coverage',
  testTimeout: 20000,
  transformIgnorePatterns: ['/node_modules/']
};


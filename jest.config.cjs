module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['**/tests/**/*.spec.ts', '**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: './tsconfig.test.json',
      diagnostics: { ignoreCodes: [151002] }
    }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/utils/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  testTimeout: 20000,
  transformIgnorePatterns: ['/node_modules/']
};


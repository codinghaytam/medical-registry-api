module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.spec.ts', '**/tests/integration/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.test.json', diagnostics: { ignoreCodes: [151002] } }]
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


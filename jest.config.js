/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Phase 1 tests target the pure domain layer (calculations, date utils).
  // UI/integration tests are added as features land.
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};

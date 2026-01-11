/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(qrcode)/)',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/lib/supabase/__tests__/test-setup.ts'
  ],
  testTimeout: 30000, // 30 seconds for property-based tests
  maxWorkers: 1, // Run tests sequentially to avoid database conflicts
  // Property-based testing configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
  // Coverage configuration
  collectCoverageFrom: [
    'src/lib/supabase/**/*.ts',
    'src/lib/auth/**/*.ts',
    '!src/lib/supabase/__tests__/**',
    '!src/lib/auth/__tests__/**',
    '!**/*.d.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  // Verbose output for better debugging
  verbose: true,
};

module.exports = config;

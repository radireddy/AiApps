/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^marked$': '<rootDir>/__mocks__/marked.js',
    // Mock assets if needed, though this project uses CDN
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  // Some dependencies ship ESM builds (e.g. `marked`). Allow transforming them.
  transformIgnorePatterns: ['node_modules/(?!(marked)/)'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/types.ts',
    '!src/index.tsx',
    '!src/main.tsx',
    '!src/**/*.d.ts',
    '!src/**/constants.ts',
    // Exclude documentation files from coverage
    '!src/**/*.md',
    // Exclude test files themselves
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__mocks__/*.{ts,tsx}',
    '!src/performance.test.ts', // Exclude performance benchmark
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
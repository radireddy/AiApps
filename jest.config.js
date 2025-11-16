/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Mock assets if needed, though this project uses CDN
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
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

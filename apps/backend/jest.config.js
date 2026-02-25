module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(.pnpm/(@faker-js\\+faker|uuid))|(@faker-js|uuid)/)'],
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/index.ts',
    '!main.ts',
    '!**/*.dto.ts',
    '!**/dto/**',
    '!**/constants/**',
    '!**/constants.ts',
    '!**/interfaces.ts',
    '!**/interfaces/**',
    '!**/decorators/**',
    '!**/__tests__/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './modules/auth/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './modules/patient/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './modules/admission/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './modules/report/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = {
  __esModule: true,
  default: {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: [
      '.ts',
    ],
    globals: {
      'ts-jest': {
        useESM: true,
      },
    },
    transform: {},
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    testMatch: [
      '**/tests/*.test.ts',
    ],
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {},
    ],
  },
}

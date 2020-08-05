module.exports = {
  rootDir: './src',
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsConfig: {
        allowJs: true,
      },
    },
  },
  collectCoverageFrom: ['<rootDir>/**/*.js'],
  coveragePathIgnorePatterns: [
    'node_modules',
    'generated',
    'test-dist',
    'testproto',
  ],
  coverageReporters: ['json', 'text', 'lcov', 'cobertura'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  reporters: ['default', 'jest-junit'],
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^.+\\.(css|less|scss|md)$': 'identity-obj-proxy',
      '\\.(jpg|ogg)$': '<rootDir>/../__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  unmockedModulePathPatterns: ['react', '<rootDir>/node_modules/'],
  setupFiles: ['<rootDir>/../jest.setup.js'],
};

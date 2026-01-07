module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(expo|@expo|expo-.*|@react-native|react-native|@react-native-async-storage)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-file-system/legacy$': '<rootDir>/src/__tests__/__mocks__/expo-file-system.ts',
  },
  collectCoverageFrom: [
    'src/services/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  globals: {
    __DEV__: true,
  },
};

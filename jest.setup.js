// Jest setup file for additional configuration

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Expo winter runtime globals
global.__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
};

global.structuredClone = global.structuredClone || ((obj) => JSON.parse(JSON.stringify(obj)));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(),
    closeSync: jest.fn(),
  })),
}));

// Mock expo modules
jest.mock('expo-modules-core', () => ({
  requireNativeModule: jest.fn(),
}));

import 'reflect-metadata';

// Jest setup file
// This file runs before each test file

// Set timezone for consistent date handling
process.env.TZ = 'Asia/Seoul';

// Set test environment variables (only if not already set)
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}
if (!process.env.JWT_ACCESS_SECRET) {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
}
if (!process.env.JWT_ACCESS_EXPIRATION) {
  process.env.JWT_ACCESS_EXPIRATION = '15m';
}
if (!process.env.JWT_REFRESH_EXPIRATION) {
  process.env.JWT_REFRESH_EXPIRATION = '1h';
}
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = 'test-32-byte-hex-key-for-aes-256';
}

// Increase test timeout for async operations
jest.setTimeout(30000);

// Mock console.error to keep test output clean (but still track errors)
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Only log actual errors, not expected validation errors
    if (
      args[0]?.includes?.('Expected') ||
      args[0]?.includes?.('Validation') ||
      args[0]?.message?.includes?.('Expected')
    ) {
      return;
    }
    originalError(...args);
  });
});

afterAll(() => {
  console.error = originalError;
});

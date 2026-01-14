import 'reflect-metadata';

// Jest setup file
// This file runs before each test file

// Set timezone for consistent date handling
process.env.TZ = 'Asia/Seoul';

// Increase test timeout for async operations
jest.setTimeout(10000);

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

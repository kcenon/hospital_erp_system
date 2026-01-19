// ***********************************************************
// This file is processed and loaded automatically before test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
// ***********************************************************

import './commands';

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err) => {
  // Returning false prevents Cypress from failing the test
  // when hydration errors occur (common with Next.js)
  if (err.message.includes('Hydration') || err.message.includes('hydrating')) {
    return false;
  }
  // Allow other errors to fail the test
  return true;
});

// Log the test name before each test for debugging
beforeEach(() => {
  cy.log(`Running: ${Cypress.currentTest.title}`);
});

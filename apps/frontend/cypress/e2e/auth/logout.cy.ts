/// <reference types="cypress" />

describe('Logout Flow', () => {
  beforeEach(function () {
    cy.fixture('users').as('users');
  });

  describe('Logout Functionality', () => {
    it('should logout and redirect to login page', function () {
      // Login first using the API command
      cy.login(this.users.admin.username, this.users.admin.password);
      cy.visit('/');

      // Verify we're logged in
      cy.url().should('not.include', '/login');

      // Perform logout - this depends on how logout is implemented in the UI
      // Common patterns: clicking user avatar, menu item, or logout button
      cy.logout();

      // Should be on login page
      cy.url().should('include', '/login');

      // Auth storage should be cleared
      cy.window().its('localStorage').invoke('getItem', 'auth-storage').should('be.null');
    });

    it('should clear auth state on logout', function () {
      cy.login(this.users.admin.username, this.users.admin.password);
      cy.visit('/');

      // Verify auth state exists
      cy.window().its('localStorage').invoke('getItem', 'auth-storage').should('not.be.null');

      // Logout
      cy.logout();

      // Verify auth state is cleared
      cy.window().its('localStorage').invoke('getItem', 'auth-storage').should('be.null');
    });

    it('should not be able to access protected routes after logout', function () {
      cy.login(this.users.admin.username, this.users.admin.password);
      cy.visit('/patients');

      // Should be on patients page
      cy.url().should('include', '/patients');

      // Logout
      cy.logout();

      // Try to access protected route
      cy.visit('/patients');

      // Should be redirected to login
      cy.url().should('include', '/login');
    });
  });

  describe('Session Expiry Handling', () => {
    it('should handle API 401 response gracefully', function () {
      cy.login(this.users.admin.username, this.users.admin.password);
      cy.visit('/');

      // Simulate session expiry by clearing the token
      cy.window().then((win) => {
        const storage = win.localStorage.getItem('auth-storage');
        if (storage) {
          const parsed = JSON.parse(storage);
          parsed.state.accessToken = 'invalid_token';
          win.localStorage.setItem('auth-storage', JSON.stringify(parsed));
        }
      });

      // Intercept any API call and return 401
      cy.intercept('GET', '**/api/v1/**', {
        statusCode: 401,
        body: { message: 'Unauthorized' },
      });

      // Trigger an API call by visiting a page that fetches data
      cy.visit('/patients');

      // Application should handle this gracefully
      // Either redirect to login or show appropriate message
      cy.url({ timeout: 10000 }).should('include', '/login');
    });
  });
});

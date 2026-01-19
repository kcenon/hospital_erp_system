/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in via the API and set the auth state.
       * @param username - The username to log in with
       * @param password - The password to log in with
       * @example cy.login('test_admin', 'TestAdmin123!')
       */
      login(username: string, password: string): Chainable<void>;

      /**
       * Custom command to log in via the UI.
       * @param username - The username to log in with
       * @param password - The password to log in with
       * @example cy.loginViaUI('test_admin', 'TestAdmin123!')
       */
      loginViaUI(username: string, password: string): Chainable<void>;

      /**
       * Custom command to log out and clear auth state.
       * @example cy.logout()
       */
      logout(): Chainable<void>;

      /**
       * Custom command to get an element by data-testid attribute.
       * @param testId - The data-testid value to find
       * @example cy.getByTestId('login-button')
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to check if user is on a specific path.
       * @param path - The expected path
       * @example cy.shouldBeOnPath('/dashboard')
       */
      shouldBeOnPath(path: string): Chainable<void>;
    }
  }
}

// Login via API to set auth state directly (faster than UI login)
Cypress.Commands.add('login', (username: string, password: string) => {
  const apiUrl = Cypress.env('apiUrl');

  cy.request({
    method: 'POST',
    url: `${apiUrl}/api/v1/auth/login`,
    body: { username, password },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      const { user, accessToken } = response.body;

      // Set the auth state in localStorage (mimicking zustand persist)
      const authStorage = {
        state: {
          user,
          accessToken,
          isAuthenticated: true,
        },
        version: 0,
      };

      window.localStorage.setItem('auth-storage', JSON.stringify(authStorage));
    } else {
      throw new Error(`Login failed with status ${response.status}: ${response.body.message}`);
    }
  });
});

// Login via UI (useful for testing the login form itself)
Cypress.Commands.add('loginViaUI', (username: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="username"]').clear().type(username);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
});

// Logout and clear auth state
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('auth-storage');
  cy.visit('/login');
});

// Get element by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Check current path
Cypress.Commands.add('shouldBeOnPath', (path: string) => {
  cy.url().should('include', path);
});

export {};

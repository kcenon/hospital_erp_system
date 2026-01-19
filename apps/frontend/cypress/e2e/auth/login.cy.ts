/// <reference types="cypress" />

describe('Login Flow', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  describe('Login Page UI', () => {
    it('should display login form with all required elements', () => {
      // Check page title
      cy.contains('Hospital ERP System').should('be.visible');
      cy.contains('Sign in to your account').should('be.visible');

      // Check form elements
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible').contains('Sign In');
    });

    it('should have password field with correct type', () => {
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Successful Login', () => {
    it('should login and redirect to dashboard with valid credentials', function () {
      cy.fixture('users').then((users) => {
        const { username, password } = users.admin;

        // Fill in login form
        cy.get('input[name="username"]').type(username);
        cy.get('input[name="password"]').type(password);
        cy.get('button[type="submit"]').click();

        // Should redirect to home/dashboard
        cy.url().should('not.include', '/login');

        // Verify auth state is set in localStorage
        cy.window().its('localStorage').invoke('getItem', 'auth-storage').then((storage) => {
          expect(storage).to.not.be.null;
          const parsed = JSON.parse(storage as string);
          expect(parsed.state.isAuthenticated).to.be.true;
          expect(parsed.state.user).to.not.be.null;
        });
      });
    });

    it('should login with different user roles', function () {
      cy.fixture('users').then((users) => {
        // Test doctor login
        const { username, password } = users.doctor;

        cy.get('input[name="username"]').type(username);
        cy.get('input[name="password"]').type(password);
        cy.get('button[type="submit"]').click();

        cy.url().should('not.include', '/login');
      });
    });
  });

  describe('Failed Login', () => {
    it('should show error on invalid credentials', function () {
      cy.fixture('users').then((users) => {
        const { username, password } = users.invalid;

        cy.get('input[name="username"]').type(username);
        cy.get('input[name="password"]').type(password);
        cy.get('button[type="submit"]').click();

        // Should stay on login page
        cy.url().should('include', '/login');

        // Should show error message
        cy.get('.text-red-500').should('be.visible');
      });
    });

    it('should show validation error for empty username', () => {
      cy.get('input[name="password"]').type('somepassword');
      cy.get('button[type="submit"]').click();

      // Should show validation message
      cy.contains('Username is required').should('be.visible');
    });

    it('should show validation error for empty password', () => {
      cy.get('input[name="username"]').type('someuser');
      cy.get('button[type="submit"]').click();

      // Should show validation message
      cy.contains('Password is required').should('be.visible');
    });

    it('should show error for locked account', function () {
      cy.fixture('users').then((users) => {
        const { username, password } = users.locked;

        cy.get('input[name="username"]').type(username);
        cy.get('input[name="password"]').type(password);
        cy.get('button[type="submit"]').click();

        // Should stay on login page and show locked message
        cy.url().should('include', '/login');
        // The exact error message depends on backend implementation
        cy.get('.text-red-500').should('be.visible');
      });
    });
  });

  describe('Form Behavior', () => {
    it('should disable form during submission', function () {
      cy.fixture('users').then((users) => {
        const { username, password } = users.admin;

        cy.get('input[name="username"]').type(username);
        cy.get('input[name="password"]').type(password);

        // Intercept the API call to add delay
        cy.intercept('POST', '**/api/v1/auth/login', (req) => {
          req.on('response', (res) => {
            res.setDelay(1000);
          });
        }).as('loginRequest');

        cy.get('button[type="submit"]').click();

        // Button should be disabled and show loading state
        cy.get('button[type="submit"]').should('be.disabled');
        cy.contains('Signing in...').should('be.visible');
      });
    });

    it('should clear error message when form is resubmitted', function () {
      cy.fixture('users').then((users) => {
        // First, trigger an error
        cy.get('input[name="username"]').type(users.invalid.username);
        cy.get('input[name="password"]').type(users.invalid.password);
        cy.get('button[type="submit"]').click();

        // Wait for error to appear
        cy.get('.text-red-500').should('be.visible');

        // Clear and enter valid credentials
        cy.get('input[name="username"]').clear().type(users.admin.username);
        cy.get('input[name="password"]').clear().type(users.admin.password);
        cy.get('button[type="submit"]').click();

        // Error should be cleared (form resubmit clears error)
        // And should redirect on success
        cy.url().should('not.include', '/login');
      });
    });
  });

  describe('Session Persistence', () => {
    it('should persist session across page reload', function () {
      cy.fixture('users').then((users) => {
        const { username, password } = users.admin;

        // Login first
        cy.get('input[name="username"]').type(username);
        cy.get('input[name="password"]').type(password);
        cy.get('button[type="submit"]').click();

        // Wait for redirect
        cy.url().should('not.include', '/login');

        // Reload the page
        cy.reload();

        // Should still be authenticated (not redirected to login)
        cy.url().should('not.include', '/login');
      });
    });

    it('should redirect to login when session is cleared', function () {
      cy.fixture('users').then((users) => {
        const { username, password } = users.admin;

        // Login first
        cy.get('input[name="username"]').type(username);
        cy.get('input[name="password"]').type(password);
        cy.get('button[type="submit"]').click();

        cy.url().should('not.include', '/login');

        // Clear localStorage (simulate logout/session expiry)
        cy.clearLocalStorage('auth-storage');

        // Visit a protected route
        cy.visit('/patients');

        // Should be redirected to login
        cy.url().should('include', '/login');
      });
    });
  });

  describe('Navigation', () => {
    it('should redirect authenticated user away from login page', function () {
      cy.fixture('users').then((users) => {
        const { username, password } = users.admin;

        // Login first
        cy.login(username, password);

        // Try to visit login page
        cy.visit('/login');

        // Should be redirected away from login
        cy.url().should('not.include', '/login');
      });
    });
  });
});

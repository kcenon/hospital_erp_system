/// <reference types="cypress" />

describe('Room Status', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.login(users.admin.username, users.admin.password);
    });
    cy.visit('/rooms');
  });

  describe('Page Load', () => {
    it('should display room status page', () => {
      // Page should load without errors
      cy.url().should('include', '/rooms');

      // Wait for content to load
      cy.wait(500);

      // Page should have some content
      cy.get('body').should('not.be.empty');
    });

    it('should require authentication', () => {
      cy.clearLocalStorage('auth-storage');
      cy.visit('/rooms');
      cy.url().should('include', '/login');
    });
  });

  describe('Available Rooms', () => {
    it('should navigate to available rooms page', () => {
      cy.visit('/rooms/available');

      // Should load available rooms page
      cy.url().should('include', '/rooms/available');
    });
  });
});

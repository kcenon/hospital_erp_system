/// <reference types="cypress" />

/**
 * Role-Based Access Control E2E Tests
 *
 * Tests that different user roles have appropriate access to various
 * parts of the application.
 */
describe('Role-Based Access Control', () => {
  describe('Admin Access', () => {
    beforeEach(() => {
      cy.fixture('users').then((users) => {
        cy.login(users.admin.username, users.admin.password);
      });
    });

    it('should access patient list', () => {
      cy.visit('/patients');
      cy.url().should('include', '/patients');
      cy.contains('Patient List').should('be.visible');
    });

    it('should access room status', () => {
      cy.visit('/rooms');
      cy.url().should('include', '/rooms');
    });

    it('should access rounding sessions', () => {
      cy.visit('/rounding');
      cy.url().should('include', '/rounding');
      cy.contains('Rounding Sessions').should('be.visible');
    });
  });

  describe('Doctor Access', () => {
    beforeEach(() => {
      cy.fixture('users').then((users) => {
        cy.login(users.doctor.username, users.doctor.password);
      });
    });

    it('should access patient list', () => {
      cy.visit('/patients');
      cy.url().should('include', '/patients');
      cy.contains('Patient List').should('be.visible');
    });

    it('should access rounding sessions', () => {
      cy.visit('/rounding');
      cy.url().should('include', '/rounding');
      cy.contains('Rounding Sessions').should('be.visible');
    });

    it('should be able to view patient details', () => {
      cy.visit('/patients');
      cy.get('table tbody tr', { timeout: 10000 }).first().should('exist');
      cy.get('table tbody tr').first().contains('View').click();
      cy.contains('Patient Details').should('be.visible');
    });
  });

  describe('Nurse Access', () => {
    beforeEach(() => {
      cy.fixture('users').then((users) => {
        cy.login(users.nurse.username, users.nurse.password);
      });
    });

    it('should access patient list', () => {
      cy.visit('/patients');
      cy.url().should('include', '/patients');
      cy.contains('Patient List').should('be.visible');
    });

    it('should access room status', () => {
      cy.visit('/rooms');
      cy.url().should('include', '/rooms');
    });

    it('should be able to view patient details', () => {
      cy.visit('/patients');
      cy.get('table tbody tr', { timeout: 10000 }).should('exist');
      cy.get('table tbody tr').first().contains('View').click();
      cy.contains('Patient Details').should('be.visible');
    });
  });

  describe('Unauthenticated Access', () => {
    beforeEach(() => {
      cy.clearLocalStorage('auth-storage');
    });

    it('should redirect to login when accessing patients page', () => {
      cy.visit('/patients');
      cy.url().should('include', '/login');
    });

    it('should redirect to login when accessing rooms page', () => {
      cy.visit('/rooms');
      cy.url().should('include', '/login');
    });

    it('should redirect to login when accessing rounding page', () => {
      cy.visit('/rounding');
      cy.url().should('include', '/login');
    });
  });
});

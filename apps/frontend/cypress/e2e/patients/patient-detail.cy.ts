/// <reference types="cypress" />

describe('Patient Detail', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.login(users.admin.username, users.admin.password);
    });
  });

  describe('Patient Information Display', () => {
    it('should display patient details when navigating from list', () => {
      cy.visit('/patients');

      // Wait for patient list to load
      cy.get('table tbody tr', { timeout: 10000 }).first().should('be.visible');

      // Click view button on first patient
      cy.get('table tbody tr').first().contains('View').click();

      // Wait for detail page to load
      cy.contains('Patient Details', { timeout: 10000 }).should('be.visible');

      // Verify patient information is displayed
      cy.contains('Birth Date').should('be.visible');
      cy.contains('Gender').should('be.visible');
      cy.contains('Blood Type').should('be.visible');
      cy.contains('Phone').should('be.visible');
      cy.contains('Address').should('be.visible');
    });

    it('should display emergency contact information', () => {
      cy.visit('/patients');
      cy.get('table tbody tr', { timeout: 10000 }).first().contains('View').click();

      cy.contains('Emergency Contact').should('be.visible');
    });

    it('should display admission history', () => {
      cy.visit('/patients');
      cy.get('table tbody tr', { timeout: 10000 }).first().contains('View').click();

      cy.contains('Admission History').should('be.visible');
    });

    it('should have back button that returns to patient list', () => {
      cy.visit('/patients');
      cy.get('table tbody tr', { timeout: 10000 }).first().contains('View').click();

      cy.contains('Back').click();
      cy.url().should('include', '/patients');
      cy.url().should('not.include', '/patients/');
    });
  });

  describe('Quick Actions', () => {
    it('should display quick actions card', () => {
      cy.visit('/patients');
      cy.get('table tbody tr', { timeout: 10000 }).first().contains('View').click();

      cy.contains('Quick Actions').should('be.visible');
      cy.contains('New Admission').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent patient gracefully', () => {
      cy.visit('/patients/00000000-0000-0000-0000-000000000000');

      // Should show error message
      cy.contains('Failed to load patient information', { timeout: 10000 }).should('be.visible');
      cy.contains('Back to Patient List').should('be.visible');
    });

    it('should navigate back from error page', () => {
      cy.visit('/patients/00000000-0000-0000-0000-000000000000');

      cy.contains('Back to Patient List', { timeout: 10000 }).click();
      cy.url().should('eq', Cypress.config().baseUrl + '/patients');
    });
  });
});

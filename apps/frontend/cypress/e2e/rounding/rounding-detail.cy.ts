/// <reference types="cypress" />

describe('Rounding Detail', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.login(users.doctor.username, users.doctor.password);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent round gracefully', () => {
      cy.visit('/rounding/00000000-0000-0000-0000-000000000000');

      // Should show error message
      cy.contains('Failed to load round', { timeout: 10000 }).should('be.visible');
      cy.contains('Back to Sessions').should('be.visible');
    });

    it('should navigate back from error page', () => {
      cy.visit('/rounding/00000000-0000-0000-0000-000000000000');

      cy.contains('Back to Sessions', { timeout: 10000 }).click();
      cy.url().should('include', '/rounding');
      cy.url().should('not.include', '/rounding/00000000');
    });
  });

  describe('Round Information Display', () => {
    it('should display round detail page elements when accessed from list', () => {
      cy.visit('/rounding');

      // Wait for page to load
      cy.wait(1000);

      // Check if any session cards exist to click
      cy.get('body').then(($body) => {
        // Look for any clickable card or link that might navigate to detail
        const cards = $body.find('a[href*="/rounding/"]');
        if (cards.length > 0) {
          cy.wrap(cards.first()).click();

          // Verify detail page elements
          cy.contains('Scheduled Date').should('be.visible');
          cy.contains('Scheduled Time').should('be.visible');
          cy.contains('Patients').should('be.visible');
        } else {
          cy.log('No rounding sessions available to test detail view');
        }
      });
    });
  });

  describe('Patient List in Round', () => {
    it('should display patient list section', () => {
      cy.visit('/rounding');

      cy.wait(1000);

      cy.get('body').then(($body) => {
        const cards = $body.find('a[href*="/rounding/"]');
        if (cards.length > 0) {
          cy.wrap(cards.first()).click();

          cy.contains('Patient List').should('be.visible');
        } else {
          cy.log('No rounding sessions available to test patient list');
        }
      });
    });
  });
});

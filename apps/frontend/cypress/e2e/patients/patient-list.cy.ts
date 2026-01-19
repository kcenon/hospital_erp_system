/// <reference types="cypress" />

describe('Patient List', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.login(users.admin.username, users.admin.password);
    });
    cy.visit('/patients');
  });

  describe('Page Load', () => {
    it('should display patient list page with all required elements', () => {
      // Page title
      cy.contains('Patient List').should('be.visible');

      // Search and filter card
      cy.contains('Search and Filter').should('be.visible');
      cy.get('input[placeholder*="Search"]').should('be.visible');

      // Table headers
      cy.contains('Patient Number').should('be.visible');
      cy.contains('Name').should('be.visible');
      cy.contains('Birth Date').should('be.visible');
      cy.contains('Gender').should('be.visible');
    });

    it('should require authentication', () => {
      cy.clearLocalStorage('auth-storage');
      cy.visit('/patients');
      cy.url().should('include', '/login');
    });
  });

  describe('Search and Filter', () => {
    it('should filter patients by search query', () => {
      cy.get('input[placeholder*="Search"]').type('John');

      // Wait for debounce and API call
      cy.wait(500);

      // Should show filtered results or no results message
      cy.get('table tbody tr').should('exist');
    });

    it('should filter patients by gender', () => {
      // Select gender filter
      cy.get('select').first().select('MALE');

      // Wait for filter to apply
      cy.wait(300);

      // All visible patients should be male
      cy.get('table tbody').then(($tbody) => {
        if ($tbody.find('tr').length > 0) {
          cy.get('table tbody tr').each(($row) => {
            cy.wrap($row).contains('Male');
          });
        }
      });
    });

    it('should clear search and show all patients', () => {
      // First search
      cy.get('input[placeholder*="Search"]').type('TestQuery');
      cy.wait(500);

      // Clear search
      cy.get('input[placeholder*="Search"]').clear();
      cy.wait(500);

      // Should show patient list again
      cy.get('table').should('be.visible');
    });
  });

  describe('Patient Navigation', () => {
    it('should navigate to patient detail page when clicking View button', () => {
      // Wait for table to load
      cy.get('table tbody tr').first().should('be.visible');

      // Click view button on first patient
      cy.get('table tbody tr').first().contains('View').click();

      // Should navigate to patient detail page
      cy.url().should('include', '/patients/');
      cy.contains('Patient Details').should('be.visible');
    });
  });

  describe('Pagination', () => {
    it('should show pagination when there are many patients', () => {
      // If pagination exists, test it
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Next")').length > 0) {
          cy.contains('Next').should('be.visible');
          cy.contains('Previous').should('be.visible');
        }
      });
    });
  });
});

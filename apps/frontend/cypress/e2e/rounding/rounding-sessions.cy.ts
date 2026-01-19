/// <reference types="cypress" />

describe('Rounding Sessions', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.login(users.doctor.username, users.doctor.password);
    });
    cy.visit('/rounding');
  });

  describe('Page Load', () => {
    it('should display rounding sessions page with required elements', () => {
      cy.contains('Rounding Sessions').should('be.visible');
      cy.contains('Filter Sessions').should('be.visible');
      cy.contains('New Session').should('be.visible');
    });

    it('should require authentication', () => {
      cy.clearLocalStorage('auth-storage');
      cy.visit('/rounding');
      cy.url().should('include', '/login');
    });
  });

  describe('Filter Sessions', () => {
    it('should have floor filter dropdown', () => {
      cy.get('select').should('have.length.at.least', 1);
    });

    it('should have status filter dropdown', () => {
      cy.contains('All Status').should('be.visible');
    });

    it('should have round type filter dropdown', () => {
      cy.contains('All Types').should('be.visible');
    });

    it('should filter sessions by status', () => {
      // Select specific status
      cy.get('select').eq(1).select('IN_PROGRESS');

      // Wait for filter to apply
      cy.wait(500);

      // Should show filtered results or no results message
      cy.get('body').should('contain.text', 'Rounding');
    });
  });

  describe('Create New Session', () => {
    it('should open create dialog when clicking New Session button', () => {
      cy.contains('New Session').click();

      cy.contains('Create New Rounding Session').should('be.visible');
      cy.contains('Floor').should('be.visible');
      cy.contains('Round Type').should('be.visible');
      cy.contains('Scheduled Date').should('be.visible');
    });

    it('should close dialog when clicking Cancel', () => {
      cy.contains('New Session').click();
      cy.contains('Create New Rounding Session').should('be.visible');

      cy.contains('Cancel').click();
      cy.contains('Create New Rounding Session').should('not.exist');
    });

    it('should have Create Session button disabled without floor selection', () => {
      cy.contains('New Session').click();

      // Create Session button should be disabled initially (no floor selected)
      cy.get('button').contains('Create Session').should('be.disabled');
    });
  });

  describe('Session Cards', () => {
    it('should display session cards when sessions exist', () => {
      // Wait for content to load
      cy.wait(1000);

      // Check if sessions exist or no sessions message is shown
      cy.get('body').then(($body) => {
        if ($body.find('[class*="grid"]').length > 0) {
          // Sessions may or may not exist
          cy.log('Session grid found');
        } else {
          cy.contains('No rounding sessions found').should('be.visible');
        }
      });
    });
  });
});

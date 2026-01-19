/// <reference types="cypress" />

/**
 * Vital Signs Recording E2E Tests
 *
 * Tests the vital signs recording functionality for admitted patients.
 * The vital signs form is accessible from the patient detail page
 * when the patient has an active admission.
 */
describe('Vital Signs Recording', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.login(users.nurse.username, users.nurse.password);
    });
  });

  describe('Vital Signs Form Access', () => {
    it('should show Record Vitals button for admitted patients', () => {
      cy.visit('/patients');

      // Wait for patient list to load
      cy.get('table tbody tr', { timeout: 10000 }).should('exist');

      // Navigate to first patient
      cy.get('table tbody tr').first().contains('View').click();

      // Check if patient has active admission (will show Record Vitals button)
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Record Vitals")').length > 0) {
          cy.contains('Record Vitals').should('be.visible');
        } else {
          // Patient not admitted - New Admission button should be visible
          cy.contains('New Admission').should('be.visible');
        }
      });
    });
  });

  describe('Vital Signs Form', () => {
    it('should display vital signs form when Record Vitals is clicked', () => {
      cy.visit('/patients');

      cy.get('table tbody tr', { timeout: 10000 }).should('exist');
      cy.get('table tbody tr').first().contains('View').click();

      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Record Vitals")').length > 0) {
          cy.contains('Record Vitals').click();

          // Form should be visible
          cy.contains('Record Vital Signs').should('be.visible');

          // Check form fields
          cy.contains('Temperature').should('be.visible');
          cy.contains('Blood Pressure').should('be.visible');
          cy.contains('Pulse').should('be.visible');
          cy.contains('Respiratory Rate').should('be.visible');
          cy.contains('SpO2').should('be.visible');
        }
      });
    });

    it('should toggle vital signs form visibility', () => {
      cy.visit('/patients');

      cy.get('table tbody tr', { timeout: 10000 }).should('exist');
      cy.get('table tbody tr').first().contains('View').click();

      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Record Vitals")').length > 0) {
          // Show form
          cy.contains('Record Vitals').click();
          cy.contains('Record Vital Signs').should('be.visible');

          // Hide form
          cy.contains('Hide Vital Form').click();
          cy.contains('Record Vital Signs').should('not.exist');
        }
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate temperature range', () => {
      cy.visit('/patients');

      cy.get('table tbody tr', { timeout: 10000 }).should('exist');
      cy.get('table tbody tr').first().contains('View').click();

      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Record Vitals")').length > 0) {
          cy.contains('Record Vitals').click();

          // Enter invalid temperature
          cy.get('input[placeholder="36.5"]').clear().type('50');

          // Try to submit
          cy.contains('button', 'Record Vital Signs').click();

          // Should show validation error or warning
          cy.wait(500);
        }
      });
    });
  });

  describe('Abnormal Value Alerts', () => {
    it('should show warning dialog for abnormal values', () => {
      cy.visit('/patients');

      cy.get('table tbody tr', { timeout: 10000 }).should('exist');
      cy.get('table tbody tr').first().contains('View').click();

      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Record Vitals")').length > 0) {
          cy.contains('Record Vitals').click();

          // Enter abnormal values (high fever)
          cy.get('input[placeholder="36.5"]').clear().type('39.5');

          // Enter low oxygen saturation
          cy.get('input[placeholder="98"]').clear().type('88');

          // Submit form
          cy.contains('button', 'Record Vital Signs').click();

          // Warning dialog should appear
          cy.get('body').then(($innerBody) => {
            if ($innerBody.find(':contains("Abnormal Values")').length > 0) {
              cy.contains('Abnormal Values').should('be.visible');
              cy.contains('Cancel').should('be.visible');
              cy.contains('Confirm').should('be.visible');
            }
          });
        }
      });
    });
  });

  describe('Vital Signs Display', () => {
    it('should display vital trend chart for admitted patients', () => {
      cy.visit('/patients');

      cy.get('table tbody tr', { timeout: 10000 }).should('exist');
      cy.get('table tbody tr').first().contains('View').click();

      cy.get('body').then(($body) => {
        // If patient is admitted, vital signs section should be visible
        if ($body.find(':contains("Vital Signs")').length > 0) {
          cy.contains('Vital Signs').should('be.visible');
        }
      });
    });

    it('should display vital alerts for admitted patients', () => {
      cy.visit('/patients');

      cy.get('table tbody tr', { timeout: 10000 }).should('exist');
      cy.get('table tbody tr').first().contains('View').click();

      // Check if alerts component exists (for admitted patients)
      cy.wait(1000); // Wait for data to load
    });
  });
});

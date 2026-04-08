/**
 * Viewer Role — UI Tests
 *
 * Verifies what a viewer sees and cannot access in the UI.
 *
 * @smoke — nav visibility, route guard, session behaviour
 */

describe('Viewer Role — UI Access Control', { tags: ['@smoke'] }, () => {
  beforeEach(() => {
    cy.loginViaSession('viewer', 'viewer123');
    cy.visit('/');
  });

  it('logs in as viewer and lands on the dashboard', () => {
    cy.get('[data-test-id="dashboard-page"]').should('be.visible');
    cy.get('[data-test-id="current-user"]').should('contain', 'viewer');
  });

  it('does not show the Alert Config link in the navbar', () => {
    cy.get('[data-test-id="nav-alert-config"]').should('not.exist');
  });

  it('shows the Dashboard nav link', () => {
    cy.get('[data-test-id="nav-dashboard"]').should('be.visible');
  });

  it('redirects to dashboard when navigating directly to /alerts/config', () => {
    cy.visit('/alerts/config');
    cy.get('[data-test-id="dashboard-page"]').should('be.visible');
    cy.get('[data-test-id="alert-config-page"]').should('not.exist');
  });

  it('can log out and return to the login page', () => {
    cy.get('[data-test-id="logout-button"]').click();
    cy.get('[data-test-id="login-page"]').should('be.visible');
  });
});

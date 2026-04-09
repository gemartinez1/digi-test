/**
 * Alerts UI Tests
 *
 * Covers UI rendering and user interactions for alert configuration
 * and the full alert lifecycle on the dashboard.
 *
 * @smoke — alert config page renders and saves correctly
 * @regression — full breach → alert → acknowledge flow in the UI
 */

describe('Alert Configuration Page', { tags: ['@smoke'] }, () => {
  beforeEach(() => {
    cy.loginViaSession();
    cy.visit('/alerts/config');
  });

  it('renders the alert config page', () => {
    cy.get('[data-test-id="alert-config-page"]', {timeout: 10}).should('be.visible');
    cy.get('[data-test-id="alert-config-form"]').should('exist');
    cy.get('[data-test-id="config-device-id"]').should('be.visible');
    cy.get('[data-test-id="config-temperature-threshold"]').should('be.visible');
  });

  it('shows existing configurations in the table', () => {
    cy.get('[data-test-id="configs-table"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-test-id="config-row-sensor-001"]').should('exist');
  });

  it('saves a new alert threshold configuration', () => {
    cy.intercept('POST', '/api/graphql').as('saveConfig');

    cy.get('[data-test-id="config-device-id"]').clear().type('sensor-001');
    cy.get('[data-test-id="config-temperature-threshold"]').clear().type('25');
    cy.get('[data-test-id="config-submit"]').click();

    cy.wait('@saveConfig').its('response.statusCode').should('eq', 200);
    cy.get('[data-test-id="config-success"]').should('be.visible');
  });

  it('shows error when form is submitted without required fields', () => {
    cy.get('[data-test-id="config-submit"]').click();
    cy.get('[data-test-id="config-error"]').should('be.visible');
  });

  it('updates existing config row after save', () => {
    cy.get('[data-test-id="config-device-id"]').clear().type('sensor-002');
    cy.get('[data-test-id="config-temperature-threshold"]').clear().type('40');
    cy.get('[data-test-id="config-submit"]').click();
    cy.get('[data-test-id="config-success"]').should('be.visible');
    cy.get('[data-test-id="config-max-sensor-002"]').should('contain', '40°C');
  });
});

describe('Alert Lifecycle — Full Flow', { tags: ['@regression'] }, () => {
  const DEVICE_ID = 'sensor-001';
  const THRESHOLD = 30;
  const BREACH_TEMP = 99;

  before(() => {
    cy.loginViaSession();
    cy.setAlertThreshold(DEVICE_ID, THRESHOLD);
  });

  beforeEach(() => {
    cy.loginViaSession();
    cy.clearAlerts();
  });

  it('no alerts exist before telemetry breach', () => {
    cy.visit('/');
    cy.get('[data-test-id="no-alerts"]').should('be.visible');
  });

  it('alert appears in dashboard after breach', () => {
    cy.postTelemetry({ deviceId: DEVICE_ID, temperature: BREACH_TEMP });
    cy.visit('/');
    cy.get('[data-test-id="refresh-button"]').click();
    cy.get('[data-test-id="alert-list"]').should('be.visible');
    cy.get('[data-test-id="alert-list"]').within(() => {
      cy.contains('High Temp').should('be.visible');
    });
    cy.get('[data-test-id="stat-active-alerts"]').invoke('text').should('match', /[1-9]/);
    cy.get('[data-test-id="alert-badge"]').should('be.visible');
    cy.get(`[data-test-id="device-card-${DEVICE_ID}"]`).should('be.visible')
  });

  it('device shows CRITICAL status after breach', () => {
    cy.postTelemetry({ deviceId: DEVICE_ID, temperature: BREACH_TEMP });
    cy.visit('/');
    cy.get('[data-test-id="refresh-button"]').click();
    cy.get(`[data-test-id="device-status-${DEVICE_ID}"]`).should('contain', 'CRITICAL');
    cy.get(`[data-test-id="device-temp-${DEVICE_ID}"]`).should('contain', `${BREACH_TEMP}°C`);
  });

  it('acknowledging an alert removes it from the list', () => {
    cy.postTelemetry({ deviceId: DEVICE_ID, temperature: BREACH_TEMP });
    cy.visit('/');
    cy.get('[data-test-id="refresh-button"]').click();

    cy.get('[data-test-id="alert-list"] [data-test-id^="alert-item-"]')
      .first()
      .invoke('attr', 'data-test-id')
      .then((testId) => {
        const alertId = (testId as string).replace('alert-item-', '');
        cy.get(`[data-test-id="alert-acknowledge-${alertId}"]`).click();
        cy.get(`[data-test-id="alert-item-${alertId}"]`).should('not.exist');
      });
  });
});

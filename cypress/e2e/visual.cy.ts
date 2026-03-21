/**
 * Visual Regression Tests
 *
 * Uses cypress-image-snapshot to capture and compare screenshots.
 *
 * First run:  snapshots are created as baselines in cypress/snapshots/
 * Later runs: new screenshot is compared pixel-by-pixel against baseline.
 *             Diff images land in cypress/snapshots/__diff_output__/
 *
 * To update baselines after intentional UI changes:
 *   npx cypress run --spec cypress/e2e/visual.cy.ts --env updateSnapshots=true
 *
 * @visual
 */

const SNAPSHOT_OPTIONS = {
  failureThreshold: 0.03,
  failureThresholdType: 'percent',
};

describe('Visual Regression — Login Page', { tags: ['@visual'] }, () => {
  it('login page matches baseline', () => {
    cy.visit('/');
    cy.get('[data-test-id="login-form"]').should('be.visible');
    cy.matchImageSnapshot('login-page', SNAPSHOT_OPTIONS);
  });

  it('login error state matches baseline', () => {
    cy.visit('/');
    cy.get('[data-test-id="login-username"]').type('wrong');
    cy.get('[data-test-id="login-password"]').type('wrong');
    cy.get('[data-test-id="login-submit"]').click();
    cy.get('[data-test-id="login-error"]').should('be.visible');
    cy.matchImageSnapshot('login-page-error', SNAPSHOT_OPTIONS);
  });
});

describe('Visual Regression — Dashboard', { tags: ['@visual'] }, () => {
  beforeEach(() => {
    // Stub both endpoints so snapshots are deterministic regardless of backend state
    cy.intercept('GET', '/api/devices', { fixture: 'devices.json' }).as('getDevices');
    cy.intercept('GET', '/api/alerts', []).as('getAlerts');
    cy.loginViaSession();
    cy.visit('/');
    cy.wait('@getDevices');
    cy.wait('@getAlerts');
    // Wait for any CSS transitions to settle
    cy.get('[data-test-id="device-list"]').should('be.visible');
  });

  it('dashboard — no alerts state matches baseline', () => {
    cy.get('[data-test-id="no-alerts"]').should('be.visible');
    cy.matchImageSnapshot('dashboard-no-alerts', SNAPSHOT_OPTIONS);
  });

  it('stats bar matches baseline', () => {
    cy.get('[data-test-id="stats-bar"]')
      .matchImageSnapshot('stats-bar', SNAPSHOT_OPTIONS);
  });

  it('device list matches baseline', () => {
    cy.get('[data-test-id="device-list"]')
      .matchImageSnapshot('device-list', SNAPSHOT_OPTIONS);
  });

  it('dashboard — with active alerts matches baseline', () => {
    cy.intercept('GET', '/api/alerts', [
      {
        id: 'alert-visual-001',
        deviceId: 'sensor-001',
        deviceName: 'Fridge Sensor A',
        type: 'temperature_high',
        message: 'Temperature 99°C exceeds threshold of 8°C',
        temperature: 99,
        threshold: 8,
        timestamp: '2026-01-01T12:00:00Z',
        acknowledged: false,
      },
    ]).as('getAlertsWithData');

    cy.visit('/');
    cy.wait('@getAlertsWithData');
    cy.get('[data-test-id="alert-badge"]').should('be.visible');
    cy.matchImageSnapshot('dashboard-with-alerts', SNAPSHOT_OPTIONS);
  });

  it('alert list item matches baseline', () => {
    cy.intercept('GET', '/api/alerts', [
      {
        id: 'alert-visual-001',
        deviceId: 'sensor-001',
        deviceName: 'Fridge Sensor A',
        type: 'temperature_high',
        message: 'Temperature 99°C exceeds threshold of 8°C',
        temperature: 99,
        threshold: 8,
        timestamp: '2026-01-01T12:00:00Z',
        acknowledged: false,
      },
    ]).as('getAlertsSnap');

    cy.visit('/');
    cy.wait('@getAlertsSnap');
    cy.get('[data-test-id="alert-list"]')
      .matchImageSnapshot('alert-list-item', SNAPSHOT_OPTIONS);
  });
});

describe('Visual Regression — Device Card States', { tags: ['@visual'] }, () => {
  it('online device card matches baseline', () => {
    cy.intercept('GET', '/api/devices', [
      {
        id: 'sensor-001',
        name: 'Fridge Sensor A',
        location: 'Kitchen Unit 1',
        type: 'fridge',
        lastSeen: '2026-01-01T12:00:00Z',
        lastTemperature: 5,
        status: 'online',
      },
    ]).as('getOnline');
    cy.intercept('GET', '/api/alerts', []).as('getAlerts');
    cy.loginViaSession();
    cy.visit('/');
    cy.wait('@getOnline');
    cy.get('[data-test-id="device-card-sensor-001"]')
      .matchImageSnapshot('device-card-online', SNAPSHOT_OPTIONS);
  });

  it('critical device card matches baseline', () => {
    cy.intercept('GET', '/api/devices', [
      {
        id: 'sensor-001',
        name: 'Fridge Sensor A',
        location: 'Kitchen Unit 1',
        type: 'fridge',
        lastSeen: '2026-01-01T12:00:00Z',
        lastTemperature: 99,
        status: 'critical',
      },
    ]).as('getCritical');
    cy.intercept('GET', '/api/alerts', []).as('getAlerts');
    cy.loginViaSession();
    cy.visit('/');
    cy.wait('@getCritical');
    cy.get('[data-test-id="device-card-sensor-001"]')
      .matchImageSnapshot('device-card-critical', SNAPSHOT_OPTIONS);
  });

  it('warning device card matches baseline', () => {
    cy.intercept('GET', '/api/devices', [
      {
        id: 'sensor-001',
        name: 'Fridge Sensor A',
        location: 'Kitchen Unit 1',
        type: 'fridge',
        lastSeen: '2026-01-01T12:00:00Z',
        lastTemperature: -5,
        status: 'warning',
      },
    ]).as('getWarning');
    cy.intercept('GET', '/api/alerts', []).as('getAlerts');
    cy.loginViaSession();
    cy.visit('/');
    cy.wait('@getWarning');
    cy.get('[data-test-id="device-card-sensor-001"]')
      .matchImageSnapshot('device-card-warning', SNAPSHOT_OPTIONS);
  });
});

describe('Visual Regression — Alert Config Page', { tags: ['@visual'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/alerts/config', { fixture: 'alert-configs.json' }).as('getConfigs');
    cy.loginViaSession();
    cy.visit('/alerts/config');
    cy.wait('@getConfigs');
    cy.get('[data-test-id="configs-table"]').should('be.visible');
  });

  it('alert config page matches baseline', () => {
    cy.matchImageSnapshot('alert-config-page', SNAPSHOT_OPTIONS);
  });

  it('alert config table matches baseline', () => {
    cy.get('[data-test-id="configs-table"]')
      .matchImageSnapshot('alert-config-table', SNAPSHOT_OPTIONS);
  });
});

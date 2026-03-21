/**
 * Visual Regression Tests
 *
 * Uses cypress-image-diff-js to capture and compare screenshots.
 *
 * First run:  snapshots are created as baselines in cypress/snapshots/baseline/
 * Later runs: new screenshot is compared pixel-by-pixel against baseline.
 *             Diff images land in cypress/snapshots/diff/
 *
 * To regenerate baselines after intentional UI changes, delete the baseline
 * folder and re-run — or set env.visualRegression.type = 'base' in cypress.config.ts
 *
 * @visual
 */

// Error threshold: 0.03 = allow up to 3% pixel difference (antialiasing, fonts)
const THRESHOLD = 0.03;

describe('Visual Regression — Login Page', { tags: ['@visual'] }, () => {
  it('login page matches baseline', () => {
    cy.visit('/');
    cy.get('[data-test-id="login-form"]').should('be.visible');
    cy.compareSnapshot('login-page', THRESHOLD);
  });

  it('login error state matches baseline', () => {
    cy.visit('/');
    cy.get('[data-test-id="login-username"]').type('wrong');
    cy.get('[data-test-id="login-password"]').type('wrong');
    cy.get('[data-test-id="login-submit"]').click();
    cy.get('[data-test-id="login-error"]').should('be.visible');
    cy.compareSnapshot('login-page-error', THRESHOLD);
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
    cy.get('[data-test-id="device-list"]').should('be.visible');
  });

  it('dashboard — no alerts state matches baseline', () => {
    cy.get('[data-test-id="no-alerts"]').should('be.visible');
    cy.compareSnapshot('dashboard-no-alerts', THRESHOLD);
  });

  it('stats bar matches baseline', () => {
    cy.get('[data-test-id="stats-bar"]').compareSnapshot('stats-bar', THRESHOLD);
  });

  it('device list matches baseline', () => {
    cy.get('[data-test-id="device-list"]').compareSnapshot('device-list', THRESHOLD);
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
    cy.compareSnapshot('dashboard-with-alerts', THRESHOLD);
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
    cy.get('[data-test-id="alert-list"]').compareSnapshot('alert-list-item', THRESHOLD);
  });
});

describe('Visual Regression — Device Card States', { tags: ['@visual'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/alerts', []).as('getAlerts');
    cy.loginViaSession();
  });

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
    cy.visit('/');
    cy.wait('@getOnline');
    cy.get('[data-test-id="device-card-sensor-001"]').compareSnapshot('device-card-online', THRESHOLD);
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
    cy.visit('/');
    cy.wait('@getCritical');
    cy.get('[data-test-id="device-card-sensor-001"]').compareSnapshot('device-card-critical', THRESHOLD);
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
    cy.visit('/');
    cy.wait('@getWarning');
    cy.get('[data-test-id="device-card-sensor-001"]').compareSnapshot('device-card-warning', THRESHOLD);
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
    cy.compareSnapshot('alert-config-page', THRESHOLD);
  });

  it('alert config table matches baseline', () => {
    cy.get('[data-test-id="configs-table"]').compareSnapshot('alert-config-table', THRESHOLD);
  });
});

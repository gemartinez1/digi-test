/**
 * Dashboard E2E Tests
 *
 * @smoke — core user journey tests run on every CI commit
 * @regression — deeper coverage run before releases
 */

describe('Login', { tags: ['@smoke'] }, () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('renders the login page', () => {
    cy.get('[data-test-id="login-page"]').should('be.visible');
    cy.get('[data-test-id="login-form"]').should('exist');
    cy.get('[data-test-id="login-username"]').should('be.visible');
    cy.get('[data-test-id="login-password"]').should('be.visible');
    cy.get('[data-test-id="login-submit"]').should('be.visible');
  });

  it('shows error for invalid credentials', () => {
    cy.get('[data-test-id="login-username"]').type('wronguser');
    cy.get('[data-test-id="login-password"]').type('wrongpass');
    cy.get('[data-test-id="login-submit"]').click();
    cy.get('[data-test-id="login-error"]').should('be.visible');
    cy.get('[data-test-id="dashboard-page"]').should('not.exist');
  });

  it('logs in successfully with valid credentials', () => {
    cy.get('[data-test-id="login-username"]').type('admin');
    cy.get('[data-test-id="login-password"]').type('admin123');
    cy.get('[data-test-id="login-submit"]').click();
    cy.get('[data-test-id="dashboard-page"]').should('be.visible');
    cy.get('[data-test-id="current-user"]').should('contain', 'admin');
  });

  it('logs out and returns to login page', () => {
    cy.login();
    cy.get('[data-test-id="logout-button"]').click();
    cy.get('[data-test-id="login-page"]').should('be.visible');
  });
});

describe('Dashboard — Device List', { tags: ['@smoke'] }, () => {
  beforeEach(() => {
    cy.loginViaSession();
    cy.visit('/');
  });

  it('renders the dashboard page', () => {
    cy.get('[data-test-id="dashboard-page"]').should('be.visible');
    cy.get('[data-test-id="devices-heading"]').should('contain', 'Devices');
    cy.get('[data-test-id="alerts-heading"]').should('contain', 'Active Alerts');
  });

  it('intercepts and renders device list from API', () => {
    cy.intercept('POST', 'api/graphql', { fixture: 'devices.json' }).as('getDevices');
    cy.visit('/');
    cy.wait('@getDevices');
    cy.get('[data-test-id="device-list"]').should('be.visible');
  });

  it('shows stats bar with device and alert counts', () => {
    cy.get('[data-test-id="stats-bar"]').should('be.visible');
    cy.get('[data-test-id="stat-total-devices"]').should('be.visible');
    cy.get('[data-test-id="stat-active-alerts"]').should('be.visible');
  });

  it('loads devices from the real API', () => {
    cy.request('GET', `${Cypress.env('API_URL') as string}/devices`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });
});

describe('Dashboard — Real-time via API', { tags: ['@regression'] }, () => {
  beforeEach(() => {
    cy.loginViaSession();
    cy.clearAlerts();
    cy.visit('/');
  });

  it('shows device card when telemetry is received', () => {
    cy.postTelemetry({ deviceId: 'sensor-001', temperature: 5 });
    cy.get('[data-test-id="refresh-button"]').click();
    cy.get('[data-test-id="device-card-sensor-001"]').should('be.visible');
    cy.get('[data-test-id="device-temp-sensor-001"]').should('contain', '5°C');
  });

  it('shows "No active alerts" when no breach exists', () => {
    cy.setAlertThreshold('sensor-001', 100);
    cy.postTelemetry({ deviceId: 'sensor-001', temperature: 5 });
    cy.get('[data-test-id="refresh-button"]').click();
    cy.get('[data-test-id="no-alerts"]').should('be.visible');
  });

  it('shows alert after temperature breach', () => {
    cy.setAlertThreshold('sensor-001', 10);
    cy.postTelemetry({ deviceId: 'sensor-001', temperature: 99 });
    cy.get('[data-test-id="refresh-button"]').click();
    cy.get('[data-test-id="alert-list"]').should('be.visible');
    cy.get('[data-test-id="alert-list"]').within(() => {
      cy.contains('High Temp').should('exist');
    });
  });

  it('shows critical status on device card after breach', () => {
    cy.setAlertThreshold('sensor-001', 10);
    cy.postTelemetry({ deviceId: 'sensor-001', temperature: 99 });
    cy.get('[data-test-id="refresh-button"]').click();
    cy.get('[data-test-id="device-status-sensor-001"]').should('contain', 'CRITICAL');
  });

  it('navigation bar links work', () => {
    cy.get('[data-test-id="nav-alert-config"]').click();
    cy.get('[data-test-id="alert-config-page"]').should('be.visible');
    cy.get('[data-test-id="nav-dashboard"]').click();
    cy.get('[data-test-id="dashboard-page"]').should('be.visible');
  });
});

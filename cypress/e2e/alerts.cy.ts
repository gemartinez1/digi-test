/**
 * Alerts E2E Tests
 *
 * Covers the full alert lifecycle:
 *   Configure threshold → Send breach telemetry → Verify alert → Acknowledge
 *
 * @smoke — threshold config saves correctly
 * @regression — full breach → alert → acknowledge flow
 */

const API_URL = () => Cypress.env('API_URL') as string;

describe('Alert Configuration Page', { tags: ['@smoke'] }, () => {
  beforeEach(() => {
    cy.loginViaSession();
    cy.visit('/alerts/config');
  });

  it('renders the alert config page', () => {
    cy.get('[data-test-id="alert-config-page"]').should('be.visible');
    cy.get('[data-test-id="alert-config-form"]').should('exist');
    cy.get('[data-test-id="config-device-id"]').should('be.visible');
    cy.get('[data-test-id="config-temperature-threshold"]').should('be.visible');
  });

  it('shows existing configurations in the table', () => {
    cy.get('[data-test-id="configs-table"]').should('be.visible');
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
    // Set known threshold via GraphQL before the suite
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation {
          setAlertConfig(deviceId: "${DEVICE_ID}", temperatureThreshold: ${THRESHOLD}, enabled: true) {
            success
          }
        }`,
      },
    });
  });

  beforeEach(() => {
    cy.loginViaSession();
    cy.clearAlerts();
  });

  it('no alerts exist before telemetry breach', () => {
    cy.getActiveAlerts().then((res) => {
      expect(res.body.data.alerts).to.have.length(0);
    });
    cy.visit('/');
    cy.get('[data-test-id="no-alerts"]').should('be.visible');
  });

  it('telemetry breach creates an alert via GraphQL', () => {
    cy.postTelemetry({ deviceId: DEVICE_ID, temperature: BREACH_TEMP }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.data.postTelemetry.alertTriggered).to.be.true;
      expect(res.body.data.postTelemetry.alert.type).to.eq('temperature_high');
    });
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
  });

  it('device shows CRITICAL status after breach', () => {
    cy.postTelemetry({ deviceId: DEVICE_ID, temperature: BREACH_TEMP });
    cy.visit('/');
    cy.get('[data-test-id="refresh-button"]').click();
    cy.get(`[data-test-id="device-status-${DEVICE_ID}"]`).should('contain', 'CRITICAL');
    cy.get(`[data-test-id="device-temp-${DEVICE_ID}"]`).should('contain', `${BREACH_TEMP}°C`);
  });

  it('alert badge appears when active alerts exist', () => {
    cy.postTelemetry({ deviceId: DEVICE_ID, temperature: BREACH_TEMP });
    cy.visit('/');
    cy.get('[data-test-id="refresh-button"]').click();
    cy.get('[data-test-id="alert-badge"]').should('be.visible');
  });

  it('acknowledging an alert removes it from the list', () => {
    cy.postTelemetry({ deviceId: DEVICE_ID, temperature: BREACH_TEMP });
    cy.visit('/');
    cy.get('[data-test-id="refresh-button"]').click();

    // Wait for alert to appear and grab its ID from the DOM
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

describe('GraphQL Contract Tests', { tags: ['@regression'] }, () => {
  it('postTelemetry returns error for missing deviceId', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation { postTelemetry(temperature: 5, timestamp: "2026-01-01T00:00:00Z") { success } }`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      // GraphQL always returns 200; errors are in res.body.errors
      expect(res.status).to.eq(400); // Apollo returns 400 for query-level syntax errors
    });
  });

  it('postTelemetry returns error for invalid timestamp', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation {
          postTelemetry(deviceId: "sensor-001", temperature: 5, timestamp: "not-a-date") {
            success
          }
        }`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.errors).to.exist;
      expect(res.body.errors[0].message).to.include('timestamp');
    });
  });

  it('devices query returns array with expected shape', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: { query: '{ devices { id name location type lastSeen lastTemperature status } }' },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.data.devices).to.be.an('array');
      expect(res.body.data.devices[0]).to.have.keys(
        ['id', 'name', 'location', 'type', 'lastSeen', 'lastTemperature', 'status']
      );
    });
  });

  it('alerts query returns array', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: { query: '{ alerts { id deviceId type acknowledged } }' },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.data.alerts).to.be.an('array');
    });
  });

  it('GET /health returns ok (REST health check stays)', () => {
    cy.request(`${API_URL()}/health`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.status).to.eq('ok');
    });
  });

  it('setAlertConfig returns error for missing deviceId', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation { setAlertConfig(temperatureThreshold: 30) { success } }`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      // Missing required arg is a GraphQL syntax/validation error → 400
      expect(res.status).to.eq(400);
    });
  });
});

describe('Alert Threshold — Edge Cases', { tags: ['@regression'] }, () => {
  beforeEach(() => {
    cy.clearAlerts();
  });

  it('does not trigger alert when temperature equals threshold exactly', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation {
          setAlertConfig(deviceId: "sensor-002", temperatureThreshold: 50, enabled: true) { success }
        }`,
      },
    });
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation {
          postTelemetry(deviceId: "sensor-002", temperature: 50, timestamp: "${new Date().toISOString()}") {
            alertTriggered
          }
        }`,
      },
    }).then((res) => {
      // At threshold = OK, only > threshold triggers
      expect(res.body.data.postTelemetry.alertTriggered).to.be.false;
    });
  });

  it('triggers alert when temperature is 1 above threshold', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation {
          setAlertConfig(deviceId: "sensor-002", temperatureThreshold: 50, enabled: true) { success }
        }`,
      },
    });
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation {
          postTelemetry(deviceId: "sensor-002", temperature: 51, timestamp: "${new Date().toISOString()}") {
            alertTriggered
          }
        }`,
      },
    }).then((res) => {
      expect(res.body.data.postTelemetry.alertTriggered).to.be.true;
    });
  });

  it('respects enabled=false config — no alert even on breach', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation {
          setAlertConfig(deviceId: "sensor-003", temperatureThreshold: 5, enabled: false) { success }
        }`,
      },
    });
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation {
          postTelemetry(deviceId: "sensor-003", temperature: 99, timestamp: "${new Date().toISOString()}") {
            alertTriggered
          }
        }`,
      },
    }).then((res) => {
      expect(res.body.data.postTelemetry.alertTriggered).to.be.false;
    });
  });
});

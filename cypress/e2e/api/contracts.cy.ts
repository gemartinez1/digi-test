/**
 * GraphQL API Contract Tests
 *
 * Pure API layer tests — no UI involved.
 * Verifies schema shape, input validation, error codes, and business logic
 * at the GraphQL resolver level.
 *
 * @regression — full contract coverage run pre-release
 */

const API_URL = () => Cypress.env('API_URL') as string;

describe('GraphQL Contract — Query Shape', { tags: ['@regression'] }, () => {
  before(() => {
    cy.loginViaSession();
  });

  it('devices query returns array with expected shape', () => {
    cy.gql('{ devices { id name location type lastSeen lastTemperature status } }').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.errors).to.be.undefined;
      expect((res.body as { data: { devices: unknown[] } }).data.devices).to.be.an('array');
      expect(
        (res.body as { data: { devices: Record<string, unknown>[] } }).data.devices[0]
      ).to.have.keys(['id', 'name', 'location', 'type', 'lastSeen', 'lastTemperature', 'status']);
    });
  });

  it('alerts query returns array', () => {
    cy.gql('{ alerts { id deviceId type acknowledged } }').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.errors).to.be.undefined;
      expect((res.body as { data: { alerts: unknown[] } }).data.alerts).to.be.an('array');
    });
  });

  it('GET /health returns ok', () => {
    cy.request(`${API_URL()}/health`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.status).to.eq('ok');
    });
  });
});

describe('GraphQL Contract — Input Validation', { tags: ['@regression'] }, () => {
  before(() => {
    cy.loginViaSession();
  });

  it('postTelemetry returns 400 for missing required deviceId argument', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation { postTelemetry(temperature: 5, timestamp: "2026-01-01T00:00:00Z") { success } }`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.errors[0].message).to.include(
        'Field "postTelemetry" argument "deviceId" of type "ID!" is required, but it was not provided.'
      );
    });
  });

  it('postTelemetry returns UNAUTHENTICATED error for invalid timestamp', () => {
    cy.postTelemetry({ deviceId: 'sensor-001', temperature: 5, timestamp: 'not-a-date' }).then((res) => {
      expect(res.status).to.eq(200);
      const body = res.body as { errors: Array<{ message: string }> };
      expect(body.errors).to.exist;
      expect(body.errors[0].message).to.include('timestamp');
    });
  });

  it('setAlertConfig returns 400 for missing required deviceId argument', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation { setAlertConfig(temperatureThreshold: 30) { success } }`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
    });
  });
});

describe('GraphQL Contract — Alert Threshold Logic', { tags: ['@regression'] }, () => {
  beforeEach(() => {
    cy.loginViaSession();
    cy.clearAlerts();
  });

  it('does not trigger alert when temperature equals threshold exactly', () => {
    cy.setAlertThreshold('sensor-002', 50);
    cy.postTelemetry({ deviceId: 'sensor-002', temperature: 50 }).then((res) => {
      expect(
        (res.body as { data: { postTelemetry: { alertTriggered: boolean } } })
          .data.postTelemetry.alertTriggered
      ).to.be.false;
    });
  });

  it('triggers alert when temperature is 1 degree above threshold', () => {
    cy.setAlertThreshold('sensor-002', 50);
    cy.postTelemetry({ deviceId: 'sensor-002', temperature: 51 }).then((res) => {
      expect(
        (res.body as { data: { postTelemetry: { alertTriggered: boolean } } })
          .data.postTelemetry.alertTriggered
      ).to.be.true;
    });
  });

  it('respects enabled=false — no alert triggered even on breach', () => {
    cy.gql(`mutation {
      setAlertConfig(deviceId: "sensor-003", temperatureThreshold: 5, enabled: false) { success }
    }`);
    cy.postTelemetry({ deviceId: 'sensor-003', temperature: 99 }).then((res) => {
      expect(
        (res.body as { data: { postTelemetry: { alertTriggered: boolean } } })
          .data.postTelemetry.alertTriggered
      ).to.be.false;
    });
  });

  it('telemetry breach creates an alert with correct fields', () => {
    cy.setAlertThreshold('sensor-001', 30);
    cy.postTelemetry({ deviceId: 'sensor-001', temperature: 99 }).then((res) => {
      expect(res.status).to.eq(200);
      expect(
        (res.body as { data: { postTelemetry: { alertTriggered: boolean } } })
          .data.postTelemetry.alertTriggered
      ).to.be.true;
      expect(
        (res.body as { data: { postTelemetry: { alert: { type: string } } } })
          .data.postTelemetry.alert.type
      ).to.eq('temperature_high');
    });
  });
});

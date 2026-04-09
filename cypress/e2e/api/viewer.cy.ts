/**
 * Viewer Role — API Permission Tests
 *
 * Pure API layer tests — no UI involved.
 * Verifies that the viewer role can call permitted operations
 * and is blocked from admin-only operations at the resolver level.
 *
 * @regression — RBAC enforcement run pre-release
 */

import { apiUrl as API_URL } from '../../support/utils';

// ─── Helper: fetch an admin token without affecting session state ──────────────
function fetchAdminToken() {
  return cy.request({
    method: 'POST',
    url: `${API_URL()}/auth/login`,
    body: { username: 'admin', password: 'admin123' },
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => (res.body as { token: string }).token);
}

function adminGql(token: string, query: string) {
  return cy.request({
    method: 'POST',
    url: `${API_URL()}/graphql`,
    body: { query },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

// ─── Suite 1: Operations a viewer is permitted to call ────────────────────────

describe('Viewer Role — Permitted API Operations', { tags: ['@regression'] }, () => {
  const DEVICE_ID = 'sensor-viewer-01';

  before(() => {
    // Admin sets a low threshold so viewer-posted telemetry can trigger alerts
    fetchAdminToken().then((token) => {
      adminGql(token, `mutation {
        setAlertConfig(deviceId: "${DEVICE_ID}", temperatureThreshold: 10, enabled: true) { success }
      }`);
    });
  });

  beforeEach(() => {
    cy.loginViaSession('viewer', 'viewer123');
    cy.clearAlerts();
  });

  it('can query devices', () => {
    cy.gql('{ devices { id name status } }').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.errors).to.be.undefined;
      expect((res.body as { data: { devices: unknown[] } }).data.devices).to.be.an('array');
    });
  });

  it('can query alerts', () => {
    cy.gql('{ alerts { id deviceId type acknowledged } }').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.errors).to.be.undefined;
      expect((res.body as { data: { alerts: unknown[] } }).data.alerts).to.be.an('array');
    });
  });

  it('can post telemetry', () => {
    cy.postTelemetry({ deviceId: DEVICE_ID, temperature: 5 }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.errors).to.be.undefined;
      expect(
        (res.body as { data: { postTelemetry: { success: boolean } } }).data.postTelemetry.success
      ).to.be.true;
    });
  });

  it('can acknowledge an alert', () => {
    cy.postTelemetry({ deviceId: DEVICE_ID, temperature: 99 });

    cy.gql('{ alerts { id } }').then((res) => {
      const alerts = (res.body as { data: { alerts: Array<{ id: string }> } }).data.alerts;
      expect(alerts.length).to.be.greaterThan(0);

      cy.gql(
        `mutation AcknowledgeAlert($id: ID!) {
          acknowledgeAlert(id: $id) { success message }
        }`,
        { id: alerts[0].id }
      ).then((ackRes) => {
        expect(ackRes.status).to.eq(200);
        expect(ackRes.body.errors).to.be.undefined;
        expect(
          (ackRes.body as { data: { acknowledgeAlert: { success: boolean } } })
            .data.acknowledgeAlert.success
        ).to.be.true;
      });
    });
  });
});

// ─── Suite 2: Operations a viewer is forbidden from calling ───────────────────

describe('Viewer Role — Forbidden API Operations', { tags: ['@regression'] }, () => {
  before(() => {
    cy.loginViaSession('viewer', 'viewer123');
  });

  it('setAlertConfig with viewer token returns FORBIDDEN', () => {
    cy.gql(
      `mutation SetAlertConfig($deviceId: ID!, $temperatureThreshold: Float!) {
        setAlertConfig(deviceId: $deviceId, temperatureThreshold: $temperatureThreshold, enabled: true) {
          success
        }
      }`,
      { deviceId: 'sensor-001', temperatureThreshold: 30 }
    ).then((res) => {
      expect(res.status).to.eq(200);
      const body = res.body as { errors: Array<{ extensions: { code: string } }> };
      expect(body.errors).to.exist;
      expect(body.errors[0].extensions.code).to.eq('FORBIDDEN');
    });
  });

  it('setAlertConfig with no token returns UNAUTHENTICATED', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: {
        query: `mutation {
          setAlertConfig(deviceId: "sensor-001", temperatureThreshold: 30, enabled: true) { success }
        }`,
      },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      const body = res.body as { errors: Array<{ extensions: { code: string } }> };
      expect(body.errors).to.exist;
      expect(body.errors[0].extensions.code).to.eq('UNAUTHENTICATED');
    });
  });
});

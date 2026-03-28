/// <reference types="cypress" />
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compareSnapshotCommand = require('cypress-image-diff-js/command');
compareSnapshotCommand();

const API_URL = Cypress.env('API_URL') as string;

// ─── GraphQL helper ───────────────────────────────────────────────────────────

function gql(query: string, variables?: Record<string, unknown>) {
  return cy.request({
    method: 'POST',
    url: `${API_URL}/graphql`,
    body: { query, variables },
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Authentication ──────────────────────────────────────────────────────────

Cypress.Commands.add('login', (username = 'admin', password = 'admin123') => {
  cy.visit('/');
  cy.get('[data-test-id="login-username"]').clear().type(username);
  cy.get('[data-test-id="login-password"]').clear().type(password);
  cy.get('[data-test-id="login-submit"]').click();
  cy.get('[data-test-id="dashboard-page"]').should('be.visible');
});

Cypress.Commands.add('loginViaSession', (username = 'admin', password = 'admin123') => {
  cy.session([username, password], () => {
    cy.visit('/');
    cy.get('[data-test-id="login-username"]').type(username);
    cy.get('[data-test-id="login-password"]').type(password);
    cy.get('[data-test-id="login-submit"]').click();
    cy.get('[data-test-id="dashboard-page"]').should('be.visible');
  });
});

// ─── API Helpers (GraphQL) ────────────────────────────────────────────────────

Cypress.Commands.add('postTelemetry', (payload: {
  deviceId: string;
  temperature: number;
  timestamp?: string;
}) => {
  return gql(
    `mutation PostTelemetry($deviceId: ID!, $temperature: Float!, $timestamp: String) {
      postTelemetry(deviceId: $deviceId, temperature: $temperature, timestamp: $timestamp) {
        success
        alertTriggered
        alert { id deviceName type message }
      }
    }`,
    {
      deviceId: payload.deviceId,
      temperature: payload.temperature,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    }
  );
});

Cypress.Commands.add('setAlertThreshold', (deviceId: string, threshold: number) => {
  return gql(
    `mutation SetAlertConfig($deviceId: ID!, $temperatureThreshold: Float!) {
      setAlertConfig(deviceId: $deviceId, temperatureThreshold: $temperatureThreshold, enabled: true) {
        success
        config { deviceId temperatureThreshold }
      }
    }`,
    { deviceId, temperatureThreshold: threshold }
  );
});

Cypress.Commands.add('getActiveAlerts', () => {
  return gql(
    `query GetAlerts {
      alerts { id deviceId deviceName type message temperature threshold timestamp acknowledged }
    }`
  );
});

Cypress.Commands.add('clearAlerts', () => {
  gql(`query { alerts { id } }`).then((res) => {
    const alerts = (res.body.data.alerts as Array<{ id: string }>);
    alerts.forEach((alert) => {
      gql(
        `mutation AcknowledgeAlert($id: ID!) {
          acknowledgeAlert(id: $id) { success }
        }`,
        { id: alert.id }
      );
    });
  });
});

// ─── Type declarations ────────────────────────────────────────────────────────

declare global {
  namespace Cypress {
    interface Chainable {
      login(username?: string, password?: string): Chainable<void>;
      loginViaSession(username?: string, password?: string): Chainable<void>;
      postTelemetry(payload: { deviceId: string; temperature: number; timestamp?: string }): Chainable<Cypress.Response<unknown>>;
      setAlertThreshold(deviceId: string, threshold: number): Chainable<Cypress.Response<unknown>>;
      clearAlerts(): Chainable<void>;
      getActiveAlerts(): Chainable<Cypress.Response<unknown>>;
      compareSnapshot(name: string, errorThreshold?: number): Chainable<void>;
    }
  }
}

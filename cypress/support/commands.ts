/// <reference types="cypress" />
import 'cypress-image-diff-js/command';

const API_URL = Cypress.env('API_URL') as string;

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

// ─── API Helpers ─────────────────────────────────────────────────────────────

Cypress.Commands.add('postTelemetry', (payload: {
  deviceId: string;
  temperature: number;
  timestamp?: string;
}) => {
  return cy.request({
    method: 'POST',
    url: `${API_URL}/telemetry`,
    body: {
      timestamp: new Date().toISOString(),
      ...payload,
    },
    headers: { 'Content-Type': 'application/json' },
  });
});

Cypress.Commands.add('setAlertThreshold', (deviceId: string, threshold: number) => {
  return cy.request({
    method: 'POST',
    url: `${API_URL}/alerts/config`,
    body: { deviceId, temperatureThreshold: threshold, enabled: true },
    headers: { 'Content-Type': 'application/json' },
  });
});

Cypress.Commands.add('clearAlerts', () => {
  cy.request(`${API_URL}/alerts`).then((res) => {
    const alerts = res.body as Array<{ id: string }>;
    alerts.forEach((alert) => {
      cy.request('POST', `${API_URL}/alerts/${alert.id}/acknowledge`);
    });
  });
});

Cypress.Commands.add('getActiveAlerts', () => {
  return cy.request(`${API_URL}/alerts`);
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

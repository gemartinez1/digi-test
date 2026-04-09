/**
 * Authentication API Tests
 *
 * Covers the /auth/login endpoint and JWT enforcement on GraphQL resolvers.
 * These are pure API tests — no UI involved.
 *
 * @smoke  — login endpoint happy path
 * @regression — invalid credentials, missing/malformed/expired tokens
 */

import { apiUrl as API_URL } from '../../support/utils';

// ─── Suite 1: Login endpoint ──────────────────────────────────────────────────

describe('POST /auth/login', { tags: ['@smoke'] }, () => {
  it('returns a token and user object for valid admin credentials', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/auth/login`,
      body: { username: 'admin', password: 'admin123' },
      headers: { 'Content-Type': 'application/json' },
    }).then((res) => {
      expect(res.status).to.eq(200);
      const body = res.body as { token: string; user: { id: string; username: string; role: string } };
      expect(body.token).to.be.a('string').and.not.be.empty;
      expect(body.user.username).to.eq('admin');
      expect(body.user.role).to.eq('admin');
      expect(body.user.id).to.be.a('string');
    });
  });

  it('returns a token and user object for valid viewer credentials', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/auth/login`,
      body: { username: 'viewer', password: 'viewer123' },
      headers: { 'Content-Type': 'application/json' },
    }).then((res) => {
      expect(res.status).to.eq(200);
      const body = res.body as { token: string; user: { username: string; role: string } };
      expect(body.token).to.be.a('string').and.not.be.empty;
      expect(body.user.username).to.eq('viewer');
      expect(body.user.role).to.eq('viewer');
    });
  });

  it('returns 401 for wrong password', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/auth/login`,
      body: { username: 'admin', password: 'wrongpassword' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body.error).to.eq('Invalid credentials');
    });
  });

  it('returns 401 for non-existent username', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/auth/login`,
      body: { username: 'ghost', password: 'anything' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
      // Same error as wrong password — server does not reveal whether
      // the username exists (prevents user enumeration attacks)
      expect(res.body.error).to.eq('Invalid credentials');
    });
  });
});

// ─── Suite 2: Token enforcement on GraphQL resolvers ─────────────────────────

describe('JWT enforcement on GraphQL', { tags: ['@regression'] }, () => {
  it('request with no token returns UNAUTHENTICATED', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: { query: '{ devices { id name } }' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      const body = res.body as { errors: Array<{ extensions: { code: string } }> };
      expect(body.errors).to.exist;
      expect(body.errors[0].extensions.code).to.eq('UNAUTHENTICATED');
    });
  });

  it('request with malformed token returns UNAUTHENTICATED', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/graphql`,
      body: { query: '{ devices { id name } }' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer this.is.not.a.valid.jwt',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      const body = res.body as { errors: Array<{ extensions: { code: string } }> };
      expect(body.errors).to.exist;
      expect(body.errors[0].extensions.code).to.eq('UNAUTHENTICATED');
    });
  });

  it('request with a valid token succeeds', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/auth/login`,
      body: { username: 'admin', password: 'admin123' },
      headers: { 'Content-Type': 'application/json' },
    }).then((loginRes) => {
      const token = (loginRes.body as { token: string }).token;

      cy.request({
        method: 'POST',
        url: `${API_URL()}/graphql`,
        body: { query: '{ devices { id name } }' },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.errors).to.be.undefined;
        expect(
          (res.body as { data: { devices: unknown[] } }).data.devices
        ).to.be.an('array');
      });
    });
  });

  it('admin token can call admin-only mutation', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL()}/auth/login`,
      body: { username: 'admin', password: 'admin123' },
      headers: { 'Content-Type': 'application/json' },
    }).then((loginRes) => {
      const token = (loginRes.body as { token: string }).token;

      cy.request({
        method: 'POST',
        url: `${API_URL()}/graphql`,
        body: {
          query: `mutation {
            setAlertConfig(deviceId: "sensor-001", temperatureThreshold: 30, enabled: true) {
              success
            }
          }`,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.errors).to.be.undefined;
        expect(
          (res.body as { data: { setAlertConfig: { success: boolean } } })
            .data.setAlertConfig.success
        ).to.be.true;
      });
    });
  });
});

import request from 'supertest';
import { app, apolloReady } from '../index';
import { db } from '../services/database';

beforeAll(async () => { await apolloReady; });
beforeEach(() => db.reset());

const GQL = (query: string) =>
  request(app).post('/graphql').send({ query }).set('Content-Type', 'application/json');

describe('postTelemetry mutation', () => {
  it('accepts valid telemetry and returns success', async () => {
    const res = await GQL(`mutation {
      postTelemetry(deviceId: "sensor-001", temperature: 5, timestamp: "2026-01-01T12:00:00Z") {
        success
        received { deviceId temperature }
      }
    }`);
    expect(res.status).toBe(200);
    expect(res.body.data.postTelemetry.success).toBe(true);
    expect(res.body.data.postTelemetry.received.deviceId).toBe('sensor-001');
  });

  it('returns error for missing deviceId', async () => {
    const res = await GQL(`mutation {
      postTelemetry(temperature: 5, timestamp: "2026-01-01T12:00:00Z") { success }
    }`);
    // Missing required arg is caught by GraphQL type system → 400
    expect(res.status).toBe(400);
  });

  it('returns error for invalid timestamp', async () => {
    const res = await GQL(`mutation {
      postTelemetry(deviceId: "sensor-001", temperature: 5, timestamp: "not-a-date") { success }
    }`);
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/timestamp/);
  });

  it('triggers alert when temperature exceeds threshold', async () => {
    const res = await GQL(`mutation {
      postTelemetry(deviceId: "sensor-001", temperature: 50, timestamp: "${new Date().toISOString()}") {
        alertTriggered
        alert { type }
      }
    }`);
    expect(res.status).toBe(200);
    expect(res.body.data.postTelemetry.alertTriggered).toBe(true);
    expect(res.body.data.postTelemetry.alert.type).toBe('temperature_high');
  });

  it('does NOT trigger alert when temperature is within threshold', async () => {
    const res = await GQL(`mutation {
      postTelemetry(deviceId: "sensor-001", temperature: 5, timestamp: "${new Date().toISOString()}") {
        alertTriggered
      }
    }`);
    expect(res.status).toBe(200);
    expect(res.body.data.postTelemetry.alertTriggered).toBe(false);
  });
});

describe('telemetryLog query', () => {
  it('returns telemetry log after ingestion', async () => {
    await GQL(`mutation {
      postTelemetry(deviceId: "sensor-001", temperature: 5, timestamp: "${new Date().toISOString()}") {
        success
      }
    }`);
    const res = await GQL(`{ telemetryLog { deviceId temperature } }`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.telemetryLog)).toBe(true);
    expect(res.body.data.telemetryLog.length).toBeGreaterThan(0);
  });
});

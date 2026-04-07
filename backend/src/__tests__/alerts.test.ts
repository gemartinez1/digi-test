import request from 'supertest';
import { app, apolloReady } from '../index';
import { db } from '../services/database';
import { signToken } from '../services/auth';

const ADMIN_TOKEN = signToken({ id: '1', username: 'admin', role: 'admin' });

beforeAll(async () => { await apolloReady; });
beforeEach(() => db.reset());

const GQL = (query: string) =>
  request(app)
    .post('/graphql')
    .send({ query })
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

describe('alerts query', () => {
  it('returns empty array when no alerts exist', async () => {
    const res = await GQL(`{ alerts { id deviceId } }`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.alerts)).toBe(true);
    expect(res.body.data.alerts).toHaveLength(0);
  });

  it('returns active alerts after telemetry breach', async () => {
    await GQL(`mutation {
      postTelemetry(deviceId: "sensor-001", temperature: 99, timestamp: "${new Date().toISOString()}") {
        success
      }
    }`);
    const res = await GQL(`{ alerts { id deviceId acknowledged } }`);
    expect(res.status).toBe(200);
    expect(res.body.data.alerts.length).toBeGreaterThan(0);
    expect(res.body.data.alerts[0].deviceId).toBe('sensor-001');
  });
});

describe('setAlertConfig mutation', () => {
  it('saves alert config and returns success', async () => {
    const res = await GQL(`mutation {
      setAlertConfig(deviceId: "sensor-001", temperatureThreshold: 25) {
        success
        config { temperatureThreshold }
      }
    }`);
    expect(res.status).toBe(200);
    expect(res.body.data.setAlertConfig.success).toBe(true);
    expect(res.body.data.setAlertConfig.config.temperatureThreshold).toBe(25);
  });

  it('returns error when deviceId is missing', async () => {
    const res = await GQL(`mutation {
      setAlertConfig(temperatureThreshold: 25) { success }
    }`);
    expect(res.status).toBe(400);
  });

  it('returns error when temperatureThreshold is missing', async () => {
    const res = await GQL(`mutation {
      setAlertConfig(deviceId: "sensor-001") { success }
    }`);
    expect(res.status).toBe(400);
  });

  it('updated config affects subsequent telemetry processing', async () => {
    await GQL(`mutation {
      setAlertConfig(deviceId: "sensor-001", temperatureThreshold: 1) { success }
    }`);
    const res = await GQL(`mutation {
      postTelemetry(deviceId: "sensor-001", temperature: 2, timestamp: "${new Date().toISOString()}") {
        alertTriggered
      }
    }`);
    expect(res.body.data.postTelemetry.alertTriggered).toBe(true);
  });
});

describe('acknowledgeAlert mutation', () => {
  it('acknowledges an existing alert', async () => {
    await GQL(`mutation {
      postTelemetry(deviceId: "sensor-001", temperature: 99, timestamp: "${new Date().toISOString()}") {
        success
      }
    }`);
    const alertsRes = await GQL(`{ alerts { id } }`);
    const alertId = alertsRes.body.data.alerts[0].id as string;

    const ackRes = await GQL(`mutation {
      acknowledgeAlert(id: "${alertId}") { success message }
    }`);
    expect(ackRes.status).toBe(200);
    expect(ackRes.body.data.acknowledgeAlert.success).toBe(true);

    // Should no longer appear in active alerts
    const activeRes = await GQL(`{ alerts { id } }`);
    const stillPresent = activeRes.body.data.alerts.find((a: { id: string }) => a.id === alertId);
    expect(stillPresent).toBeUndefined();
  });

  it('returns error for unknown alert id', async () => {
    const res = await GQL(`mutation {
      acknowledgeAlert(id: "nonexistent") { success }
    }`);
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND');
  });
});

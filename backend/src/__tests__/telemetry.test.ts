import request from 'supertest';
import { app } from '../index';
import { db } from '../services/database';

beforeEach(() => db.reset());

describe('POST /telemetry', () => {
  const validPayload = {
    deviceId: 'sensor-001',
    temperature: 5,
    timestamp: '2026-01-01T12:00:00Z',
  };

  it('accepts valid telemetry and returns 201', async () => {
    const res = await request(app).post('/telemetry').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.received.deviceId).toBe('sensor-001');
  });

  it('rejects missing deviceId', async () => {
    const res = await request(app)
      .post('/telemetry')
      .send({ temperature: 5, timestamp: '2026-01-01T12:00:00Z' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/deviceId/);
  });

  it('rejects non-numeric temperature', async () => {
    const res = await request(app)
      .post('/telemetry')
      .send({ deviceId: 'sensor-001', temperature: 'hot', timestamp: '2026-01-01T12:00:00Z' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/temperature/);
  });

  it('rejects invalid timestamp', async () => {
    const res = await request(app)
      .post('/telemetry')
      .send({ deviceId: 'sensor-001', temperature: 5, timestamp: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/timestamp/);
  });

  it('triggers alert when temperature exceeds threshold', async () => {
    const res = await request(app)
      .post('/telemetry')
      .send({ deviceId: 'sensor-001', temperature: 50, timestamp: new Date().toISOString() });
    expect(res.status).toBe(201);
    expect(res.body.alertTriggered).toBe(true);
    expect(res.body.alert).toBeDefined();
    expect(res.body.alert.type).toBe('temperature_high');
  });

  it('does NOT trigger alert when temperature is within threshold', async () => {
    const res = await request(app)
      .post('/telemetry')
      .send({ deviceId: 'sensor-001', temperature: 5, timestamp: new Date().toISOString() });
    expect(res.status).toBe(201);
    expect(res.body.alertTriggered).toBe(false);
  });
});

describe('GET /telemetry', () => {
  it('returns telemetry log', async () => {
    await request(app).post('/telemetry').send({
      deviceId: 'sensor-001',
      temperature: 5,
      timestamp: new Date().toISOString(),
    });
    const res = await request(app).get('/telemetry');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

import request from 'supertest';
import { app } from '../index';
import { db } from '../services/database';

beforeEach(() => db.reset());

describe('GET /alerts', () => {
  it('returns empty array when no alerts exist', async () => {
    const res = await request(app).get('/alerts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('returns active alerts after telemetry breach', async () => {
    await request(app).post('/telemetry').send({
      deviceId: 'sensor-001',
      temperature: 99,
      timestamp: new Date().toISOString(),
    });
    const res = await request(app).get('/alerts');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].deviceId).toBe('sensor-001');
  });
});

describe('POST /alerts/config', () => {
  it('saves alert config and returns 201', async () => {
    const res = await request(app).post('/alerts/config').send({
      deviceId: 'sensor-001',
      temperatureThreshold: 25,
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.config.temperatureThreshold).toBe(25);
  });

  it('rejects config without deviceId', async () => {
    const res = await request(app).post('/alerts/config').send({
      temperatureThreshold: 25,
    });
    expect(res.status).toBe(400);
  });

  it('rejects config without threshold', async () => {
    const res = await request(app).post('/alerts/config').send({
      deviceId: 'sensor-001',
    });
    expect(res.status).toBe(400);
  });

  it('updated config affects subsequent telemetry processing', async () => {
    // Lower threshold to 1°C
    await request(app).post('/alerts/config').send({
      deviceId: 'sensor-001',
      temperatureThreshold: 1,
    });
    // Send temperature of 2°C — should now breach
    const res = await request(app).post('/telemetry').send({
      deviceId: 'sensor-001',
      temperature: 2,
      timestamp: new Date().toISOString(),
    });
    expect(res.body.alertTriggered).toBe(true);
  });
});

describe('POST /alerts/:id/acknowledge', () => {
  it('acknowledges an existing alert', async () => {
    await request(app).post('/telemetry').send({
      deviceId: 'sensor-001',
      temperature: 99,
      timestamp: new Date().toISOString(),
    });
    const alertsRes = await request(app).get('/alerts');
    const alertId = alertsRes.body[0].id;

    const ackRes = await request(app).post(`/alerts/${alertId}/acknowledge`);
    expect(ackRes.status).toBe(200);
    expect(ackRes.body.success).toBe(true);

    // Should no longer appear in active alerts
    const activeRes = await request(app).get('/alerts');
    expect(activeRes.body.find((a: { id: string }) => a.id === alertId)).toBeUndefined();
  });

  it('returns 404 for unknown alert id', async () => {
    const res = await request(app).post('/alerts/nonexistent/acknowledge');
    expect(res.status).toBe(404);
  });
});

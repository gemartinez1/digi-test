import { Router, Request, Response } from 'express';
import { validateTelemetry } from '../middleware/validate';
import { processTelemetry } from '../services/alertProcessor';
import { db } from '../services/database';

const router = Router();

// POST /telemetry — ingest sensor data
router.post('/', validateTelemetry, (req: Request, res: Response) => {
  const payload = req.body;
  const alert = processTelemetry(payload);

  res.status(201).json({
    success: true,
    received: payload,
    alertTriggered: alert !== null,
    alert: alert ?? undefined,
  });
});

// GET /telemetry — retrieve recent telemetry log
router.get('/', (_req: Request, res: Response) => {
  res.json(db.getTelemetryLog());
});

export default router;

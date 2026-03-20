import { Router, Request, Response } from 'express';
import { validateAlertConfig } from '../middleware/validate';
import { db } from '../services/database';

const router = Router();

// GET /alerts — return active (unacknowledged) alerts
router.get('/', (req: Request, res: Response) => {
  const includeAll = req.query.all === 'true';
  res.json(db.getAlerts(includeAll));
});

// POST /alerts/:id/acknowledge — mark alert as acknowledged
router.post('/:id/acknowledge', (req: Request, res: Response) => {
  const success = db.acknowledgeAlert(req.params.id);
  if (!success) {
    res.status(404).json({ error: `Alert '${req.params.id}' not found` });
    return;
  }
  res.json({ success: true, message: 'Alert acknowledged' });
});

// POST /alerts/config — create or update alert threshold config
router.post('/config', validateAlertConfig, (req: Request, res: Response) => {
  const { deviceId, temperatureThreshold, minTemperatureThreshold, enabled = true } = req.body;

  const config = {
    deviceId,
    temperatureThreshold,
    minTemperatureThreshold,
    enabled,
  };

  db.setAlertConfig(config);
  res.status(201).json({ success: true, config });
});

// GET /alerts/config — list all alert configurations
router.get('/config', (_req: Request, res: Response) => {
  res.json(db.getAllAlertConfigs());
});

// GET /alerts/config/:deviceId — get config for a specific device
router.get('/config/:deviceId', (req: Request, res: Response) => {
  const config = db.getAlertConfig(req.params.deviceId);
  if (!config) {
    res.status(404).json({ error: `No config found for device '${req.params.deviceId}'` });
    return;
  }
  res.json(config);
});

export default router;

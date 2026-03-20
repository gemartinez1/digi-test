import { Router, Request, Response } from 'express';
import { db } from '../services/database';

const router = Router();

// GET /devices — list all registered devices
router.get('/', (_req: Request, res: Response) => {
  res.json(db.getDevices());
});

// GET /devices/:id — get a single device
router.get('/:id', (req: Request, res: Response) => {
  const device = db.getDevice(req.params.id);
  if (!device) {
    res.status(404).json({ error: `Device '${req.params.id}' not found` });
    return;
  }
  res.json(device);
});

export default router;

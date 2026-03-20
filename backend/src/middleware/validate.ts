import { Request, Response, NextFunction } from 'express';

export function validateTelemetry(req: Request, res: Response, next: NextFunction): void {
  const { deviceId, temperature, timestamp } = req.body;

  if (!deviceId || typeof deviceId !== 'string') {
    res.status(400).json({ error: 'deviceId is required and must be a string' });
    return;
  }
  if (temperature === undefined || typeof temperature !== 'number') {
    res.status(400).json({ error: 'temperature is required and must be a number' });
    return;
  }
  if (!timestamp || isNaN(Date.parse(timestamp))) {
    res.status(400).json({ error: 'timestamp is required and must be a valid ISO 8601 date' });
    return;
  }

  next();
}

export function validateAlertConfig(req: Request, res: Response, next: NextFunction): void {
  const { deviceId, temperatureThreshold } = req.body;

  if (!deviceId || typeof deviceId !== 'string') {
    res.status(400).json({ error: 'deviceId is required and must be a string' });
    return;
  }
  if (temperatureThreshold === undefined || typeof temperatureThreshold !== 'number') {
    res.status(400).json({ error: 'temperatureThreshold is required and must be a number' });
    return;
  }

  next();
}

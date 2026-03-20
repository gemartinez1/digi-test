import { v4 as uuidv4 } from 'uuid';
import { TelemetryPayload, Alert, Device } from '../types';
import { db } from './database';
import { broadcastWebSocket } from './websocket';

function resolveDeviceStatus(
  temperature: number,
  config: { temperatureThreshold: number; minTemperatureThreshold?: number }
): Device['status'] {
  if (temperature > config.temperatureThreshold) return 'critical';
  const min = config.minTemperatureThreshold ?? -Infinity;
  if (temperature < min) return 'warning';
  return 'online';
}

export function processTelemetry(payload: TelemetryPayload): Alert | null {
  const { deviceId, temperature, timestamp } = payload;

  db.logTelemetry(payload);

  // Update or auto-create device entry
  let device = db.getDevice(deviceId);
  if (!device) {
    device = {
      id: deviceId,
      name: deviceId,
      location: 'Unknown',
      type: 'generic',
      lastSeen: timestamp,
      lastTemperature: temperature,
      status: 'online',
    };
  } else {
    device = { ...device, lastSeen: timestamp, lastTemperature: temperature };
  }

  const config = db.getAlertConfig(deviceId);

  if (config && config.enabled) {
    const status = resolveDeviceStatus(temperature, config);
    device.status = status;
    db.upsertDevice(device);

    broadcastWebSocket({ type: 'device_updated', payload: device });

    if (status === 'critical') {
      const alert: Alert = {
        id: uuidv4(),
        deviceId,
        deviceName: device.name,
        type: 'temperature_high',
        message: `Temperature ${temperature}°C exceeds threshold of ${config.temperatureThreshold}°C`,
        temperature,
        threshold: config.temperatureThreshold,
        timestamp,
        acknowledged: false,
      };
      db.addAlert(alert);
      broadcastWebSocket({ type: 'alert_created', payload: alert });
      return alert;
    }

    if (status === 'warning' && config.minTemperatureThreshold !== undefined) {
      const alert: Alert = {
        id: uuidv4(),
        deviceId,
        deviceName: device.name,
        type: 'temperature_low',
        message: `Temperature ${temperature}°C is below minimum threshold of ${config.minTemperatureThreshold}°C`,
        temperature,
        threshold: config.minTemperatureThreshold,
        timestamp,
        acknowledged: false,
      };
      db.addAlert(alert);
      broadcastWebSocket({ type: 'alert_created', payload: alert });
      return alert;
    }
  } else {
    device.status = 'online';
    db.upsertDevice(device);
    broadcastWebSocket({ type: 'device_updated', payload: device });
  }

  return null;
}

import { Device, Alert, AlertConfig, TelemetryPayload } from '../types';

// In-memory database — simulates a real DB for demo purposes
class InMemoryDatabase {
  private devices: Map<string, Device> = new Map();
  private alerts: Alert[] = [];
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private telemetryLog: TelemetryPayload[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    const seedDevices: Device[] = [
      {
        id: 'sensor-001',
        name: 'Fridge Sensor A',
        location: 'Kitchen Unit 1',
        type: 'fridge',
        lastSeen: new Date().toISOString(),
        lastTemperature: null,
        status: 'offline',
      },
      {
        id: 'sensor-002',
        name: 'Warehouse Sensor',
        location: 'Warehouse Floor B',
        type: 'warehouse',
        lastSeen: new Date().toISOString(),
        lastTemperature: null,
        status: 'offline',
      },
      {
        id: 'sensor-003',
        name: 'Server Room Monitor',
        location: 'Data Center Rack 3',
        type: 'server-room',
        lastSeen: new Date().toISOString(),
        lastTemperature: null,
        status: 'offline',
      },
    ];

    const seedConfigs: AlertConfig[] = [
      { deviceId: 'sensor-001', temperatureThreshold: 8, minTemperatureThreshold: -2, enabled: true },
      { deviceId: 'sensor-002', temperatureThreshold: 35, minTemperatureThreshold: 5, enabled: true },
      { deviceId: 'sensor-003', temperatureThreshold: 28, minTemperatureThreshold: 15, enabled: true },
    ];

    seedDevices.forEach(d => this.devices.set(d.id, d));
    seedConfigs.forEach(c => this.alertConfigs.set(c.deviceId, c));
  }

  // Devices
  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  getDevice(id: string): Device | undefined {
    return this.devices.get(id);
  }

  upsertDevice(device: Device): void {
    this.devices.set(device.id, device);
  }

  // Alerts
  getAlerts(includeAcknowledged = false): Alert[] {
    return this.alerts.filter(a => includeAcknowledged || !a.acknowledged);
  }

  addAlert(alert: Alert): void {
    this.alerts.push(alert);
  }

  acknowledgeAlert(id: string): boolean {
    const alert = this.alerts.find(a => a.id === id);
    if (!alert) return false;
    alert.acknowledged = true;
    return true;
  }

  // Alert Configs
  getAlertConfig(deviceId: string): AlertConfig | undefined {
    return this.alertConfigs.get(deviceId);
  }

  getAllAlertConfigs(): AlertConfig[] {
    return Array.from(this.alertConfigs.values());
  }

  setAlertConfig(config: AlertConfig): void {
    this.alertConfigs.set(config.deviceId, config);
  }

  // Telemetry log (last 500 entries)
  logTelemetry(payload: TelemetryPayload): void {
    this.telemetryLog.push(payload);
    if (this.telemetryLog.length > 500) {
      this.telemetryLog.shift();
    }
  }

  getTelemetryLog(): TelemetryPayload[] {
    return [...this.telemetryLog];
  }

  // Reset for testing
  reset(): void {
    this.devices.clear();
    this.alerts = [];
    this.alertConfigs.clear();
    this.telemetryLog = [];
    this.seed();
  }
}

export const db = new InMemoryDatabase();

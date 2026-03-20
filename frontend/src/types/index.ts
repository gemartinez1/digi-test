export interface Device {
  id: string;
  name: string;
  location: string;
  type: 'fridge' | 'warehouse' | 'server-room' | 'generic';
  lastSeen: string;
  lastTemperature: number | null;
  status: 'online' | 'offline' | 'warning' | 'critical';
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  type: 'temperature_high' | 'temperature_low' | 'offline';
  message: string;
  temperature: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface AlertConfig {
  deviceId: string;
  temperatureThreshold: number;
  minTemperatureThreshold?: number;
  enabled: boolean;
}

export interface WebSocketMessage {
  type: 'alert_created' | 'device_updated' | 'telemetry_received' | 'connected';
  payload?: Alert | Device;
  message?: string;
}

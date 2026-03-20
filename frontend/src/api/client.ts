import { Device, Alert, AlertConfig } from '../types';

const BASE_URL = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  getDevices: () => get<Device[]>('/devices'),
  getAlerts: () => get<Alert[]>('/alerts'),
  getAlertConfigs: () => get<AlertConfig[]>('/alerts/config'),
  setAlertConfig: (config: Omit<AlertConfig, 'enabled'> & { enabled?: boolean }) =>
    post<{ success: boolean; config: AlertConfig }>('/alerts/config', config),
  acknowledgeAlert: (id: string) =>
    post<{ success: boolean }>(`/alerts/${id}/acknowledge`, {}),
  postTelemetry: (payload: { deviceId: string; temperature: number; timestamp: string }) =>
    post('/telemetry', payload),
};

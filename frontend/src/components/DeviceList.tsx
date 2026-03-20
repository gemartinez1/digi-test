import React from 'react';
import { Device } from '../types';

interface Props {
  devices: Device[];
  loading: boolean;
}

const STATUS_COLORS: Record<Device['status'], string> = {
  online: '#22c55e',
  offline: '#94a3b8',
  warning: '#f59e0b',
  critical: '#ef4444',
};

const DEVICE_ICONS: Record<Device['type'], string> = {
  fridge: '🧊',
  warehouse: '🏭',
  'server-room': '🖥️',
  generic: '📡',
};

export function DeviceList({ devices, loading }: Props) {
  if (loading) {
    return (
      <div data-test-id="device-list-loading" style={styles.loading}>
        Loading devices...
      </div>
    );
  }

  return (
    <div data-test-id="device-list" style={styles.container}>
      {devices.length === 0 ? (
        <p data-test-id="no-devices" style={styles.empty}>
          No devices registered. Start the sensor simulator.
        </p>
      ) : (
        devices.map((device) => (
          <div
            key={device.id}
            data-test-id={`device-card-${device.id}`}
            style={{ ...styles.card, borderLeft: `4px solid ${STATUS_COLORS[device.status]}` }}
          >
            <div style={styles.cardHeader}>
              <span style={styles.icon}>{DEVICE_ICONS[device.type]}</span>
              <div>
                <p data-test-id={`device-name-${device.id}`} style={styles.name}>
                  {device.name}
                </p>
                <p style={styles.location}>{device.location}</p>
              </div>
            </div>
            <div style={styles.cardBody}>
              <div>
                <span style={styles.label}>Temperature</span>
                <span
                  data-test-id={`device-temp-${device.id}`}
                  style={{ ...styles.temp, color: STATUS_COLORS[device.status] }}
                >
                  {device.lastTemperature !== null ? `${device.lastTemperature}°C` : '—'}
                </span>
              </div>
              <div>
                <span style={styles.label}>Status</span>
                <span
                  data-test-id={`device-status-${device.id}`}
                  style={{ ...styles.status, color: STATUS_COLORS[device.status] }}
                >
                  {device.status.toUpperCase()}
                </span>
              </div>
              <div>
                <span style={styles.label}>Last seen</span>
                <span style={styles.lastSeen}>
                  {new Date(device.lastSeen).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  loading: { color: '#94a3b8', padding: 16 },
  empty: { color: '#64748b', gridColumn: '1/-1' },
  card: { background: '#1e293b', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  cardHeader: { display: 'flex', gap: 12, alignItems: 'center' },
  icon: { fontSize: 32 },
  name: { margin: 0, fontWeight: 600, color: '#f1f5f9', fontSize: 15 },
  location: { margin: 0, color: '#94a3b8', fontSize: 12 },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: '#64748b', fontSize: 12, marginRight: 8 },
  temp: { fontSize: 22, fontWeight: 700 },
  status: { fontSize: 12, fontWeight: 600 },
  lastSeen: { color: '#94a3b8', fontSize: 12 },
};

import React, { useEffect, useState, useCallback } from 'react';
import { Device, Alert, WebSocketMessage } from '../types';
import { api } from '../api/client';
import { DeviceList } from '../components/DeviceList';
import { AlertList } from '../components/AlertList';
import { useWebSocket } from '../hooks/useWebSocket';

interface Props {
  onWsStatusChange: (connected: boolean) => void;
}

export function Dashboard({ onWsStatusChange }: Props) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const data = await api.getDevices();
      setDevices(data);
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    void fetchDevices();
    void fetchAlerts();
  }, [fetchDevices, fetchAlerts]);

  const handleWebSocketMessage = useCallback(
    (msg: WebSocketMessage) => {
      if (msg.type === 'connected') {
        onWsStatusChange(true);
        return;
      }
      if (msg.type === 'device_updated' && msg.payload) {
        const updated = msg.payload as Device;
        setDevices((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d))
        );
        setLastUpdated(new Date());
      }
      if (msg.type === 'alert_created' && msg.payload) {
        const newAlert = msg.payload as Alert;
        setAlerts((prev) => [newAlert, ...prev]);
        setLastUpdated(new Date());
      }
    },
    [onWsStatusChange]
  );

  useWebSocket(handleWebSocketMessage);

  const handleAcknowledge = async (id: string) => {
    await api.acknowledgeAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const activeCount = alerts.length;
  const criticalCount = devices.filter((d) => d.status === 'critical').length;

  return (
    <div data-test-id="dashboard-page" style={styles.page}>
      {/* Stats Bar */}
      <div data-test-id="stats-bar" style={styles.statsBar}>
        <div data-test-id="stat-total-devices" style={styles.stat}>
          <span style={styles.statNumber}>{devices.length}</span>
          <span style={styles.statLabel}>Devices</span>
        </div>
        <div data-test-id="stat-active-alerts" style={styles.stat}>
          <span style={{ ...styles.statNumber, color: activeCount > 0 ? '#ef4444' : '#22c55e' }}>
            {activeCount}
          </span>
          <span style={styles.statLabel}>Active Alerts</span>
        </div>
        <div data-test-id="stat-critical-devices" style={styles.stat}>
          <span style={{ ...styles.statNumber, color: criticalCount > 0 ? '#ef4444' : '#f1f5f9' }}>
            {criticalCount}
          </span>
          <span style={styles.statLabel}>Critical</span>
        </div>
        {lastUpdated && (
          <div style={styles.stat}>
            <span style={{ ...styles.statLabel, color: '#22c55e' }}>
              Live update: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        )}
        <button
          data-test-id="refresh-button"
          onClick={() => { void fetchDevices(); void fetchAlerts(); }}
          style={styles.refreshBtn}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Devices Section */}
      <section style={styles.section}>
        <h2 data-test-id="devices-heading" style={styles.sectionTitle}>
          Devices
        </h2>
        <DeviceList devices={devices} loading={loadingDevices} />
      </section>

      {/* Alerts Section */}
      <section style={styles.section}>
        <h2 data-test-id="alerts-heading" style={styles.sectionTitle}>
          Active Alerts
          {activeCount > 0 && (
            <span data-test-id="alert-badge" style={styles.badge}>
              {activeCount}
            </span>
          )}
        </h2>
        <AlertList alerts={alerts} loading={loadingAlerts} onAcknowledge={handleAcknowledge} />
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px 32px', background: '#0f172a', minHeight: 'calc(100vh - 60px)' },
  statsBar: {
    display: 'flex',
    gap: 32,
    alignItems: 'center',
    background: '#1e293b',
    borderRadius: 8,
    padding: '16px 24px',
    marginBottom: 28,
  },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 700, color: '#f1f5f9' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  section: { marginBottom: 36 },
  sectionTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 },
  badge: {
    background: '#ef4444',
    color: '#fff',
    borderRadius: 12,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 700,
  },
  refreshBtn: {
    marginLeft: 'auto',
    background: '#1e3a5f',
    color: '#93c5fd',
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: 13,
  },
};

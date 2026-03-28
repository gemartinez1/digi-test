import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Device, Alert, WebSocketMessage } from '../types';
import { GET_DEVICES, GET_ALERTS, ACKNOWLEDGE_ALERT } from '../graphql/queries';
import { DeviceList } from '../components/DeviceList';
import { AlertList } from '../components/AlertList';
import { useWebSocket } from '../hooks/useWebSocket';

interface Props {
  onWsStatusChange: (connected: boolean) => void;
}

export function Dashboard({ onWsStatusChange }: Props) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    data: devicesData,
    loading: loadingDevices,
    refetch: refetchDevices,
  } = useQuery<{ devices: Device[] }>(GET_DEVICES);

  const {
    data: alertsData,
    loading: loadingAlerts,
    refetch: refetchAlerts,
  } = useQuery<{ alerts: Alert[] }>(GET_ALERTS);

  const [acknowledgeAlert] = useMutation(ACKNOWLEDGE_ALERT, {
    refetchQueries: [{ query: GET_ALERTS }],
  });

  const devices = devicesData?.devices ?? [];
  const alerts = alertsData?.alerts ?? [];

  const handleWebSocketMessage = useCallback(
    (msg: WebSocketMessage) => {
      if (msg.type === 'connected') {
        onWsStatusChange(true);
        return;
      }
      if (msg.type === 'device_updated') {
        void refetchDevices();
        setLastUpdated(new Date());
      }
      if (msg.type === 'alert_created') {
        void refetchAlerts();
        setLastUpdated(new Date());
      }
    },
    [onWsStatusChange, refetchDevices, refetchAlerts]
  );

  useWebSocket(handleWebSocketMessage);

  const handleAcknowledge = (id: string) => {
    void acknowledgeAlert({ variables: { id } });
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
          onClick={() => { void refetchDevices(); void refetchAlerts(); }}
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

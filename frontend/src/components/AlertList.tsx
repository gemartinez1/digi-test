import React from 'react';
import { Alert } from '../types';

interface Props {
  alerts: Alert[];
  loading: boolean;
  onAcknowledge: (id: string) => void;
}

const TYPE_LABELS: Record<Alert['type'], string> = {
  temperature_high: '🔥 High Temp',
  temperature_low: '🧊 Low Temp',
  offline: '📴 Offline',
};

export function AlertList({ alerts, loading, onAcknowledge }: Props) {
  if (loading) {
    return <div data-test-id="alert-list-loading" style={styles.loading}>Loading alerts...</div>;
  }

  return (
    <div data-test-id="alert-list">
      {alerts.length === 0 ? (
        <p data-test-id="no-alerts" style={styles.empty}>
          ✅ No active alerts
        </p>
      ) : (
        alerts.map((alert) => (
          <div key={alert.id} data-test-id={`alert-item-${alert.id}`} style={styles.alert}>
            <div style={styles.alertHeader}>
              <span style={styles.alertType}>{TYPE_LABELS[alert.type]}</span>
              <span data-test-id={`alert-device-${alert.id}`} style={styles.alertDevice}>
                {alert.deviceName}
              </span>
            </div>
            <p data-test-id={`alert-message-${alert.id}`} style={styles.alertMessage}>
              {alert.message}
            </p>
            <div style={styles.alertFooter}>
              <span style={styles.alertTime}>
                {new Date(alert.timestamp).toLocaleString()}
              </span>
              <button
                data-test-id={`alert-acknowledge-${alert.id}`}
                onClick={() => onAcknowledge(alert.id)}
                style={styles.ackButton}
              >
                Acknowledge
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: { color: '#94a3b8', padding: 16 },
  empty: { color: '#22c55e', padding: 16 },
  alert: {
    background: '#2d1a1a',
    border: '1px solid #7f1d1d',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  alertHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  alertType: { color: '#fca5a5', fontWeight: 600, fontSize: 13 },
  alertDevice: { color: '#94a3b8', fontSize: 13 },
  alertMessage: { margin: '4px 0 10px', color: '#f1f5f9', fontSize: 14 },
  alertFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  alertTime: { color: '#64748b', fontSize: 12 },
  ackButton: {
    background: '#1e3a5f',
    color: '#93c5fd',
    border: 'none',
    borderRadius: 4,
    padding: '4px 12px',
    cursor: 'pointer',
    fontSize: 12,
  },
};

import React, { useState, FormEvent } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { AlertConfig } from '../types';
import { GET_ALERT_CONFIGS, SET_ALERT_CONFIG } from '../graphql/queries';

export function AlertConfigPage() {
  const [form, setForm] = useState({
    deviceId: '',
    temperatureThreshold: '',
    minTemperatureThreshold: '',
    enabled: true,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data, loading } = useQuery<{ alertConfigs: AlertConfig[] }>(GET_ALERT_CONFIGS);
  const configs = data?.alertConfigs ?? [];

  const [setAlertConfig, { loading: saving }] = useMutation(SET_ALERT_CONFIG, {
    refetchQueries: [{ query: GET_ALERT_CONFIGS }],
    onCompleted: () => {
      setSaved(true);
      setForm({ deviceId: '', temperatureThreshold: '', minTemperatureThreshold: '', enabled: true });
    },
    onError: () => {
      setError('Failed to save config. Is the backend running?');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (!form.deviceId || !form.temperatureThreshold) {
      setError('Device ID and threshold are required');
      return;
    }

    void setAlertConfig({
      variables: {
        deviceId: form.deviceId,
        temperatureThreshold: Number(form.temperatureThreshold),
        minTemperatureThreshold: form.minTemperatureThreshold
          ? Number(form.minTemperatureThreshold)
          : undefined,
        enabled: form.enabled,
      },
    });
  };

  return (
    <div data-test-id="alert-config-page" style={styles.page}>
      <h1 style={styles.title}>Alert Configuration</h1>

      {/* Config Form */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Set Threshold</h2>
        <form data-test-id="alert-config-form" onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.label}>Device ID</label>
              <input
                data-test-id="config-device-id"
                style={styles.input}
                value={form.deviceId}
                onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
                placeholder="sensor-001"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Max Temp (°C)</label>
              <input
                data-test-id="config-temperature-threshold"
                style={styles.input}
                type="number"
                value={form.temperatureThreshold}
                onChange={(e) => setForm({ ...form, temperatureThreshold: e.target.value })}
                placeholder="35"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Min Temp (°C)</label>
              <input
                data-test-id="config-min-temperature-threshold"
                style={styles.input}
                type="number"
                value={form.minTemperatureThreshold}
                onChange={(e) => setForm({ ...form, minTemperatureThreshold: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Enabled</label>
              <input
                data-test-id="config-enabled"
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                style={{ width: 20, height: 20, marginTop: 10 }}
              />
            </div>
          </div>

          {error && <p data-test-id="config-error" style={styles.error}>{error}</p>}
          {saved && <p data-test-id="config-success" style={styles.success}>✅ Configuration saved!</p>}

          <button data-test-id="config-submit" type="submit" style={styles.button} disabled={saving}>
            {saving ? 'Saving…' : 'Save Configuration'}
          </button>
        </form>
      </section>

      {/* Existing Configs */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Current Configurations</h2>
        {loading ? (
          <p data-test-id="configs-loading" style={{ color: '#94a3b8' }}>Loading...</p>
        ) : (
          <table data-test-id="configs-table" style={styles.table}>
            <thead>
              <tr>
                {['Device ID', 'Max Temp', 'Min Temp', 'Enabled'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.deviceId} data-test-id={`config-row-${c.deviceId}`}>
                  <td style={styles.td}>{c.deviceId}</td>
                  <td data-test-id={`config-max-${c.deviceId}`} style={styles.td}>{c.temperatureThreshold}°C</td>
                  <td style={styles.td}>{c.minTemperatureThreshold !== undefined ? `${c.minTemperatureThreshold}°C` : '—'}</td>
                  <td style={styles.td}>{c.enabled ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px 32px', background: '#0f172a', minHeight: 'calc(100vh - 60px)' },
  title: { color: '#f1f5f9', marginBottom: 24, fontSize: 22 },
  card: { background: '#1e293b', borderRadius: 8, padding: 24, marginBottom: 24 },
  cardTitle: { color: '#94a3b8', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 },
  label: { color: '#94a3b8', fontSize: 13 },
  input: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: '9px 12px',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
  },
  error: { color: '#fca5a5', fontSize: 13 },
  success: { color: '#4ade80', fontSize: 13 },
  button: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { color: '#64748b', fontSize: 12, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #334155' },
  td: { color: '#f1f5f9', fontSize: 14, padding: '10px 12px', borderBottom: '1px solid #1e293b' },
};

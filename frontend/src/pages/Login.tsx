import React, { useState, FormEvent } from 'react';

interface Props {
  onLogin: (username: string, role: string) => void;
}

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError('Invalid credentials');
        return;
      }
      const data = await res.json() as { token: string; user: { role: string } };
      sessionStorage.setItem('iot-token', data.token);
      onLogin(username, data.user.role);
    } catch {
      setError('Unable to connect to server');
    }
  };

  return (
    <div data-test-id="login-page" style={styles.page}>
      <div data-test-id="login-form-container" style={styles.card}>
        <h1 style={styles.title}>📡 IoT Monitor</h1>
        <p style={styles.subtitle}>Sign in to your account</p>
        <form data-test-id="login-form" onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Username</label>
          <input
            data-test-id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            style={styles.input}
            autoComplete="username"
          />
          <label style={styles.label}>Password</label>
          <input
            data-test-id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={styles.input}
            autoComplete="current-password"
          />
          {error && (
            <p data-test-id="login-error" style={styles.error}>
              {error}
            </p>
          )}
          <button data-test-id="login-submit" type="submit" style={styles.button}>
            Sign In
          </button>
        </form>
        <p style={styles.hint}>Demo: admin / admin123</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#0f172a',
  },
  card: {
    background: '#1e293b',
    borderRadius: 12,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  title: { color: '#f1f5f9', margin: '0 0 4px', fontSize: 26, textAlign: 'center' },
  subtitle: { color: '#64748b', textAlign: 'center', marginBottom: 28, fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: 500 },
  input: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: '10px 14px',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
  },
  error: { color: '#fca5a5', fontSize: 13, margin: '4px 0' },
  button: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '11px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  hint: { color: '#334155', fontSize: 12, textAlign: 'center', marginTop: 20 },
};

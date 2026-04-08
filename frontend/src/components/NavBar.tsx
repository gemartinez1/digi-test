import React from 'react';
import { NavLink } from 'react-router-dom';

interface Props {
  user: string;
  onLogout: () => void;
  wsConnected: boolean;
  isAdmin: boolean;
}

export function NavBar({ user, onLogout, wsConnected, isAdmin }: Props) {
  return (
    <nav data-test-id="navbar" style={styles.nav}>
      <div style={styles.brand}>
        <span style={styles.logo}>📡</span>
        <span style={styles.title}>IoT Monitor</span>
      </div>
      <div style={styles.links}>
        <NavLink
          to="/"
          data-test-id="nav-dashboard"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
        >
          Dashboard
        </NavLink>
        {isAdmin && (
          <NavLink
            to="/alerts/config"
            data-test-id="nav-alert-config"
            style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
          >
            Alert Config
          </NavLink>
        )}
      </div>
      <div style={styles.right}>
        <span
          data-test-id="ws-status"
          style={{ ...styles.wsIndicator, color: wsConnected ? '#22c55e' : '#ef4444' }}
        >
          {wsConnected ? '● Live' : '○ Offline'}
        </span>
        <span data-test-id="current-user" style={styles.user}>{user}</span>
        <button data-test-id="logout-button" onClick={onLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#0f172a',
    padding: '0 24px',
    height: 60,
    borderBottom: '1px solid #1e293b',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8 },
  logo: { fontSize: 22 },
  title: { color: '#f1f5f9', fontWeight: 700, fontSize: 18 },
  links: { display: 'flex', gap: 24 },
  link: { color: '#94a3b8', textDecoration: 'none', fontSize: 14 },
  activeLink: { color: '#60a5fa', fontWeight: 600 },
  right: { display: 'flex', alignItems: 'center', gap: 16 },
  wsIndicator: { fontSize: 12 },
  user: { color: '#94a3b8', fontSize: 13 },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #334155',
    color: '#94a3b8',
    padding: '4px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
  },
};

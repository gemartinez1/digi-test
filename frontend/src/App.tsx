import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AlertConfigPage } from './pages/AlertConfig';
import { NavBar } from './components/NavBar';

export function App() {
  const [user, setUser] = useState<string | null>(
    sessionStorage.getItem('iot-user')
  );
  const [role, setRole] = useState<string | null>(
    sessionStorage.getItem('iot-role')
  );
  const [wsConnected, setWsConnected] = useState(false);

  const handleLogin = (username: string, userRole: string) => {
    sessionStorage.setItem('iot-user', username);
    sessionStorage.setItem('iot-role', userRole);
    setUser(username);
    setRole(userRole);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('iot-user');
    sessionStorage.removeItem('iot-role');
    setUser(null);
    setRole(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = role === 'admin';

  return (
    <BrowserRouter>
      <NavBar user={user} onLogout={handleLogout} wsConnected={wsConnected} isAdmin={isAdmin} />
      <Routes>
        <Route path="/" element={<Dashboard onWsStatusChange={setWsConnected} />} />
        <Route
          path="/alerts/config"
          element={isAdmin ? <AlertConfigPage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

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
  const [wsConnected, setWsConnected] = useState(false);

  const handleLogin = (username: string) => {
    sessionStorage.setItem('iot-user', username);
    setUser(username);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('iot-user');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <NavBar user={user} onLogout={handleLogout} wsConnected={wsConnected} />
      <Routes>
        <Route path="/" element={<Dashboard onWsStatusChange={setWsConnected} />} />
        <Route path="/alerts/config" element={<AlertConfigPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

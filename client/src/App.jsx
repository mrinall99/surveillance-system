import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Cameras from './pages/Cameras';
import Events from './pages/Events';
import Playback from './pages/Playback';
import Settings from './pages/Settings';
import { useSocket } from './hooks/useSocket';

const AuthenticatedApp = () => {
  const { isConnected } = useSocket();

  return (
    <Layout isConnected={isConnected}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cameras" element={<Cameras />} />
        <Route path="/events" element={<Events />} />
        <Route path="/playback" element={<Playback />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Navigate to="/login" replace />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AuthenticatedApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

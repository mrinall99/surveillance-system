import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check system auth status on initial load
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/status', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setIsInitialized(data.initialized);
    } catch (err) {
      console.error('Failed to check auth status:', err);
      setError('Connection to backend server failed. Ensure Node backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Server response was not valid JSON');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser({ username: data.username });
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const setup = async (username, password) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Server response was not valid JSON');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      setIsInitialized(true);
      setUser({ username: data.username });
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isInitialized, user, loading, error, login, setup, logout, checkStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

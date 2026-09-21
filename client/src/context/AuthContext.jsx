import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockout, setLockout] = useState({ locked: false, remainingAttempts: 5 });
  const [error, setError] = useState(null);

  // Check current session on initial load
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify active cookie session
      const verifyRes = await fetch('/api/auth/verify', { credentials: 'include' });
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        if (verifyData.authenticated) {
          setUser(verifyData.user || { role: 'owner', username: 'OWNER' });
          return;
        }
      }

      // If no active session, fetch lockout status
      const statusRes = await fetch('/api/auth/status', { credentials: 'include' });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.lockout) {
          setLockout(statusData.lockout);
        }
      }
      setUser(null);
    } catch (err) {
      console.warn('Auth verification:', err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (secretKey) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ secretKey: secretKey.trim() })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.lockout) {
          setLockout(data.lockout);
        }
        throw new Error(data.error || 'Invalid Secret Key');
      }

      setUser(data.user || { role: 'owner', username: 'OWNER' });
      setLockout({ locked: false, remainingAttempts: 5 });
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
    <AuthContext.Provider value={{ user, loading, error, lockout, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

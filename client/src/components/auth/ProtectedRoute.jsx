import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, isInitialized, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center font-mono text-cyan-400">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
        <p className="tracking-widest uppercase text-sm">VERIFYING SECURITY CREDENTIALS...</p>
      </div>
    );
  }

  if (isInitialized === false) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

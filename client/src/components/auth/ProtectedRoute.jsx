import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b18] flex flex-col items-center justify-center font-mono text-cyan-400 p-4">
        <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(0,212,255,0.2)]"></div>
        <p className="tracking-widest uppercase text-xs text-slate-400">VERIFYING OWNER SECURITY TOKEN...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

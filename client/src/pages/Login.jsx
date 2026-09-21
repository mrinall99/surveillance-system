import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, AlertTriangle, Terminal, Key, UserPlus } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isInitialized, loading } = useAuth();
  const navigate = useNavigate();

  // If system has no admin account configured, redirect to setup wizard
  useEffect(() => {
    if (!loading && isInitialized === false) {
      navigate('/setup');
    }
  }, [isInitialized, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] relative flex items-center justify-center p-4 scanlines overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Terminal Header Warning Banner */}
        <div className="bg-red-950/40 border border-red-500/40 rounded-t-xl p-3 flex items-center justify-center gap-2 text-red-400 font-mono text-xs tracking-wider text-center">
          <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse flex-shrink-0" />
          <span>RESTRICTED SYSTEM — AUTHORIZED ACCESS ONLY</span>
        </div>

        {/* Main Login Glass Card */}
        <div className="glass-panel rounded-b-xl border-t-0 p-8 shadow-2xl relative overflow-hidden">
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500"></div>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              SURVEILLANCE COMMAND
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-500" />
              AUTHENTICATION TERMINAL v3.1
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <div>{errorMsg}</div>
                {isInitialized === false && (
                  <div className="mt-2 text-cyan-300 underline font-bold cursor-pointer" onClick={() => navigate('/setup')}>
                    Click here to run first-time setup wizard
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                Administrator Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin ID"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs uppercase tracking-widest py-3.5 rounded-lg font-bold shadow-lg shadow-cyan-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>VERIFYING CREDENTIALS...</span>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>AUTHENTICATE TERMINAL</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => navigate('/setup')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 mx-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              First time setting up? Run Provisioning Wizard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

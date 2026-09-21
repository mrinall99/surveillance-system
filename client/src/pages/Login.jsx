import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertTriangle, Terminal, Key, UserPlus, Eye, EyeOff, Lock } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass]  = useState(false);
  const [errorMsg, setErrorMsg]  = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeKey, setShakeKey]  = useState(0);
  const { login, isInitialized, loading } = useAuth();
  const navigate = useNavigate();

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
      setShakeKey(k => k + 1); // Trigger shake animation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen hex-bg relative flex items-center justify-center p-4 overflow-hidden">
      {/* Cyber grid overlay */}
      <div className="absolute inset-0 cyber-grid-overlay opacity-40 pointer-events-none" />

      {/* Decorative glowing orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full pointer-events-none opacity-20"
           style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full pointer-events-none opacity-20"
           style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="w-full max-w-md relative z-10 animate-slide-in-up">
        {/* Restricted Banner */}
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 mb-0 rounded-t-2xl text-red-400 font-mono text-[11px] tracking-widest border border-b-0 border-red-500/30"
             style={{ background: 'rgba(127,29,29,0.25)', backdropFilter: 'blur(12px)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse flex-shrink-0" />
          <span>RESTRICTED SYSTEM — AUTHORIZED ACCESS ONLY</span>
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse flex-shrink-0" />
        </div>

        {/* Main Card — shake on error */}
        <div
          key={shakeKey}
          className="glass-card rounded-b-2xl rounded-t-none p-5 sm:p-8 relative overflow-hidden"
          style={{
            border: '1px solid var(--border-base)',
            boxShadow: errorMsg
              ? '0 0 30px rgba(255,58,58,0.2), 0 8px 32px rgba(0,0,0,0.5)'
              : '0 0 30px rgba(0,212,255,0.08), 0 8px 32px rgba(0,0,0,0.5)',
            animation: shakeKey > 0 ? 'shake 0.4s ease-out' : 'none',
          }}
        >
          {/* Top accent gradient line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Logo & Title */}
          <div className="flex flex-col items-center text-center mb-8">
            {/* Animated shield with rotating ring */}
            <div className="relative mb-5 animate-float">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '1px solid rgba(0,212,255,0.3)', boxShadow: 'var(--glow-cyan)' }}>
                <Shield className="w-10 h-10 text-cyan-400" />
              </div>
              {/* Rotating ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-cyan-400 border-r-violet-500 animate-spin-slow" style={{ opacity: 0.7 }} />
              {/* Outer pulse ring */}
              <div className="absolute inset-[-4px] rounded-[18px] border border-cyan-400/20 animate-ping" style={{ animationDuration: '3s' }} />
            </div>

            <h1 className="text-2xl font-display font-bold tracking-[0.15em] text-white uppercase">
              HAWKEYE SYSTEM
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1.5 flex items-center gap-1.5 tracking-widest">
              <Terminal className="w-3 h-3 text-cyan-500" />
              AUTHENTICATION TERMINAL v3.1 — PHASE II
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl border border-red-500/40 text-red-400 text-xs font-mono flex items-start gap-2.5 animate-slide-in-up"
                 style={{ background: 'rgba(127,29,29,0.3)' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <div>{errorMsg}</div>
                {isInitialized === false && (
                  <div className="mt-2 text-cyan-300 underline font-bold cursor-pointer" onClick={() => navigate('/setup')}>
                    Click here to run first-time setup wizard →
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="group">
              <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] mb-2 group-focus-within:text-cyan-400 transition-colors duration-200">
                <Lock className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                Administrator ID
              </label>
              <div className="relative">
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="cyber-input pr-10"
                  autoComplete="username"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200" />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] mb-2 group-focus-within:text-cyan-400 transition-colors duration-200">
                <Key className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                Security Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="cyber-input pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-cyan-400 transition-colors duration-200"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="relative w-full mt-2 py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-widest text-white overflow-hidden transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              style={{
                background: isSubmitting
                  ? 'linear-gradient(135deg, #0095b3, #6d28d9)'
                  : 'linear-gradient(135deg, #00b8d9, #7c3aed)',
                boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
              }}
            >
              {/* Shimmer overlay */}
              {!isSubmitting && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              )}

              <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>VERIFYING CREDENTIALS...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>AUTHENTICATE TERMINAL</span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-center">
            <button
              type="button"
              onClick={() => navigate('/setup')}
              className="text-[10px] font-mono text-[var(--text-muted)] hover:text-cyan-400 flex items-center justify-center gap-1.5 mx-auto transition-colors duration-200 tracking-wider"
            >
              <UserPlus className="w-3 h-3" />
              First time? Run Provisioning Wizard
            </button>
          </div>

          {/* Bottom watermark */}
          <p className="text-center text-[9px] font-mono text-[var(--text-muted)] mt-3 opacity-40 tracking-widest">
            HAWKEYE v3.1 · PHASE II · MOG2+YOLOv8s · CUDA RTX 2050
          </p>
        </div>
      </div>

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-8px); }
          30%       { transform: translateX(8px); }
          45%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
};

export default Login;

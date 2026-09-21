import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldCheck, Lock, AlertTriangle, Key, CheckCircle2, Eye, EyeOff, Terminal } from 'lucide-react';

const Setup = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Master security password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Confirmation password does not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await setup(username, password);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Initialization failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden" style={{ background: '#060b18' }}>
      {/* Background Cyber Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0,212,255,0.08) 0%, transparent 60%),
                            linear-gradient(to right, rgba(0,212,255,0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0,212,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 3rem 3rem, 3rem 3rem'
        }}
      />

      <div className="w-full max-w-md relative z-10 page-enter">
        {/* Top Banner */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-t-2xl p-3 flex items-center justify-center gap-2 text-emerald-400 font-mono text-xs tracking-widest text-center shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
          <span>PROVISIONING WIZARD • INITIAL SETUP</span>
        </div>

        {/* Card Body */}
        <div className="glass-panel rounded-b-2xl border-t-0 p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-slate-950/80 border-slate-800">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 animate-pulse"></div>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
              <Key className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold tracking-wider text-white font-mono uppercase">
              CREATE OWNER CREDENTIALS
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Initialize the local SQLite database &amp; configure root authority.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                Master Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                Confirm Master Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-5 bg-gradient-to-r from-emerald-600 via-cyan-600 to-emerald-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs uppercase tracking-widest py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              {isSubmitting ? (
                <span>INITIALIZING SYSTEM...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>INITIALIZE &amp; SECURE SYSTEM</span>
                </>
              )}
            </button>
          </form>

          {/* Watermark */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-cyan-500/70" />
              PROVISIONING_AGENT
            </span>
            <span>v2.4.0-SECURE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setup;

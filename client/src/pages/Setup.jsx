import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, AlertTriangle, Key, CheckCircle2 } from 'lucide-react';

const Setup = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
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
    <div className="min-h-screen bg-[#080c14] relative flex items-center justify-center p-4 scanlines overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-t-xl p-3 flex items-center justify-center gap-2 text-cyan-400 font-mono text-xs tracking-wider text-center">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>INITIAL SYSTEM PROVISIONING WIZARD</span>
        </div>

        <div className="glass-panel rounded-b-xl border-t-0 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500"></div>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-600/20 border border-emerald-500/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Key className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              CREATE OWNER CREDENTIALS
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Set the primary administrator account for this system.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Master Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Confirm Master Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono text-xs uppercase tracking-widest py-3.5 rounded-lg font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>INITIALIZING SYSTEM...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>INITIALIZE & LOCK SYSTEM</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Setup;

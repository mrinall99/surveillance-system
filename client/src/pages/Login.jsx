import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Key, ShieldAlert, Terminal, Eye, EyeOff, Lock, Unlock, ShieldCheck, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [secretKey, setSecretKey] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeKey, setShakeKey]   = useState(0);

  const { login, lockout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      setErrorMsg('Please enter the Owner Secret Key');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await login(secretKey);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Authorization rejected: Invalid Secret Key');
      setShakeKey(k => k + 1); // Trigger card shake animation
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = lockout?.locked;

  return (
    <div className="min-h-screen hex-bg relative flex items-center justify-center p-3 sm:p-4 overflow-hidden" style={{ background: '#060b18' }}>
      {/* Cyber grid overlay */}
      <div className="absolute inset-0 cyber-grid-overlay opacity-30 pointer-events-none" />

      {/* Glowing atmospheric orbs */}
      <div className="absolute top-1/4 -left-32 w-72 h-72 rounded-full pointer-events-none opacity-20"
           style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      <div className="absolute bottom-1/4 -right-32 w-72 h-72 rounded-full pointer-events-none opacity-20"
           style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="w-full max-w-md relative z-10 animate-slide-in-up">
        {/* Top Warning Banner */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-t-2xl text-red-400 font-mono text-[10px] sm:text-[11px] tracking-widest border border-b-0 border-red-500/30"
             style={{ background: 'rgba(127,29,29,0.25)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse flex-shrink-0" />
            <span className="font-bold">PROPRIETARY TERMINAL</span>
          </div>
          <span className="text-red-400/80 uppercase text-[9px]">SINGLE-OWNER AUTH</span>
        </div>

        {/* Main Glass Card */}
        <div
          key={shakeKey}
          className="glass-card rounded-b-2xl rounded-t-none p-5 sm:p-8 relative overflow-hidden"
          style={{
            border: '1px solid var(--border-base)',
            boxShadow: errorMsg
              ? '0 0 35px rgba(255,58,58,0.25), 0 8px 32px rgba(0,0,0,0.6)'
              : '0 0 35px rgba(0,212,255,0.1), 0 8px 32px rgba(0,0,0,0.6)',
            animation: shakeKey > 0 ? 'shake 0.4s ease-out' : 'none',
          }}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Logo & Title */}
          <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            {/* Animated Key Crest with rotating ring */}
            <div className="relative mb-4 sm:mb-5 animate-float">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '1px solid rgba(0,212,255,0.35)', boxShadow: 'var(--glow-cyan)' }}>
                <Key className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
              </div>
              {/* Rotating cyber ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-cyan-400 border-r-violet-500 animate-spin-slow" style={{ opacity: 0.8 }} />
              {/* Outer pulse */}
              <div className="absolute inset-[-4px] rounded-[18px] border border-cyan-400/20 animate-ping" style={{ animationDuration: '3s' }} />
            </div>

            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-[0.15em] text-white uppercase">
              HAWKEYE COMMAND
            </h1>
            <p className="text-[10px] sm:text-[11px] text-cyan-400 font-mono mt-1 tracking-widest flex items-center gap-1.5 uppercase">
              <Terminal className="w-3 h-3 text-cyan-400" />
              MASTER SECRET KEY GATEWAY
            </p>
          </div>

          {/* Error / Lockout Alert Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl border border-red-500/40 text-red-400 text-xs font-mono flex items-start gap-2.5 animate-slide-in-up"
                 style={{ background: 'rgba(127,29,29,0.3)' }}>
              <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold">{errorMsg}</div>
              </div>
            </div>
          )}

          {/* Lockout Warning */}
          {isLocked ? (
            <div className="p-5 rounded-xl border border-red-500/50 bg-red-950/40 text-center font-mono space-y-3">
              <Lock className="w-8 h-8 text-red-400 mx-auto animate-pulse" />
              <div className="text-sm font-bold text-red-300 uppercase tracking-wider">
                TERMINAL TEMPORARILY LOCKED
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Excessive unauthorized attempts detected. Lockout active for {lockout.remainingMinutes || 15} minute(s).
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-mono">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>Owner Secret Key</span>
                  </label>
                  {lockout?.remainingAttempts < 5 && (
                    <span className="text-[10px] text-amber-400 font-bold">
                      {lockout.remainingAttempts} attempts remaining
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter Master Passkey..."
                    autoFocus
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,212,255,0.25)] transition-all pr-10 tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                  Only the authorized owner key grants terminal access.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !secretKey.trim()}
                className="w-full mt-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white text-xs uppercase tracking-widest py-3.5 sm:py-4 rounded-xl font-bold shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-40"
              >
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>VERIFYING SECRET KEY...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>AUTHORIZE &amp; UNLOCK TERMINAL</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Watermark & Security Notice */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
              TIMING-SAFE PROTOCOL
            </span>
            <span>AES-256 / SHA-256</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

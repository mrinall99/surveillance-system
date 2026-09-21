import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, Wifi, WifiOff } from 'lucide-react';

const Header = ({ isConnected, onToggleMobileNav }) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  // Live ticking clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d) => {
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });

  // Get user initials for avatar
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header
      className="h-14 px-3 sm:px-5 flex items-center justify-between z-30 border-b border-[var(--border-subtle)] flex-shrink-0"
      style={{ background: 'linear-gradient(90deg, #07101f 0%, #0b1225 100%)' }}
    >
      {/* Left: Hamburger (Mobile) + Connection status + Clock */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label="Open Navigation Menu"
          className="md:hidden p-2 rounded-lg border border-[var(--border-base)] text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-500/50 transition-colors flex items-center justify-center"
          style={{ background: 'rgba(15,26,48,0.7)' }}
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Connection pill */}
        <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full border text-[11px] sm:text-xs font-mono transition-all duration-300 flex-shrink-0
          ${isConnected
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
            : 'bg-red-950/60 border-red-500/40 text-red-400'
          }`}
        >
          {/* Animated wave dots */}
          <span className="flex items-center gap-0.5">
            {[0, 0.15, 0.3].map((delay, i) => (
              <span
                key={i}
                className={`w-0.5 rounded-full animate-pulse ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}
                style={{
                  height: `${5 + i * 2}px`,
                  animationDelay: `${delay}s`,
                  animationDuration: '1.2s'
                }}
              />
            ))}
          </span>
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 flex-shrink-0" />
              <span className="font-semibold tracking-wider">
                <span className="hidden sm:inline">SYSTEM </span>LIVE
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 flex-shrink-0" />
              <span className="font-semibold tracking-wider">
                <span className="hidden sm:inline">ENGINE </span>OFFLINE
              </span>
            </>
          )}
        </div>

        {/* Live military clock */}
        <div className="hidden sm:flex flex-col items-start min-w-0 pl-1">
          <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-[var(--cyan-400)] leading-tight">
            {formatTime(time)}
          </span>
          <span className="font-mono text-[9px] text-[var(--text-muted)] tracking-wider uppercase leading-none">
            {formatDate(time)}
          </span>
        </div>
      </div>

      {/* Right: User Badge + Logout */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* User badge with avatar */}
        <div
          className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[var(--border-base)] text-xs font-mono"
          style={{ background: 'rgba(15,26,48,0.7)' }}
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold flex-shrink-0">
            {initials}
          </div>
          <span className="text-[var(--text-primary)] hidden sm:block font-semibold tracking-wider text-xs">
            {user?.username?.toUpperCase() || 'ADMIN'}
          </span>
          <span className="hidden lg:block text-[9px] text-[var(--text-muted)] uppercase tracking-widest border-l border-[var(--border-subtle)] pl-2">
            SecOps
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out of terminal"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-red-800/40 text-red-400 hover:bg-red-900/30 hover:border-red-500/60 hover:text-red-300 transition-all duration-200 text-xs font-mono font-bold"
          style={{ background: 'rgba(127, 29, 29, 0.15)' }}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden sm:inline tracking-wider">EXIT</span>
        </button>
      </div>
    </header>
  );
};

export default Header;

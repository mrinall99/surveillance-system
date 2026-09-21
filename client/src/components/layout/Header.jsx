import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, Radio, Clock, UserCheck } from 'lucide-react';

const Header = ({ isConnected }) => {
  const { user, logout } = useAuth();
  const currentTime = new Date().toLocaleTimeString();

  return (
    <header className="h-16 bg-[#0b1329]/90 border-b border-slate-800/80 px-6 flex items-center justify-between z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-red-500'}`} />
          <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
            {isConnected ? 'SYSTEM LIVE' : 'ENGINE OFFLINE'}
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentTime}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono text-slate-200">{user?.username || 'ADMIN'}</span>
        </div>

        <button
          onClick={logout}
          title="Sign out of terminal"
          className="p-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 text-red-400 transition-all flex items-center gap-1.5 text-xs font-mono"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">EXIT</span>
        </button>
      </div>
    </header>
  );
};

export default Header;

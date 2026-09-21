import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Camera, AlertOctagon, Video, Settings, ShieldAlert, Cpu } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/', label: 'COMMAND DASHBOARD', icon: LayoutDashboard },
    { path: '/cameras', label: 'CAMERAS', icon: Camera },
    { path: '/events', label: 'EVENT LOGS', icon: AlertOctagon },
    { path: '/playback', label: 'PLAYBACK', icon: Video },
    { path: '/settings', label: 'SETTINGS', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#090f1f] border-r border-slate-800/80 flex flex-col justify-between p-4 z-40">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white font-mono">AEGIS DEFENSE</h2>
            <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">YOLOv8 ARCHITECTURE</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 font-mono text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-l-4 border-cyan-400 text-cyan-300 font-semibold shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer Box */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-500">ACCELERATION</span>
          <span className="text-cyan-400 font-bold">NVIDIA RTX 2050</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">PIPELINE</span>
          <span className="text-emerald-400 font-bold">MOG2 + YOLOv8s</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

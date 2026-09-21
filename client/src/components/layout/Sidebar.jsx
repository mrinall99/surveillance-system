import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Camera, ShieldAlert, Settings, Shield, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: '/',         label: 'COMMAND DASHBOARD', icon: LayoutDashboard, color: 'cyan' },
    { path: '/cameras',  label: 'CAMERAS & ZONES',   icon: Camera,          color: 'violet' },
    { path: '/events',   label: 'THREAT AUDIT LOGS', icon: ShieldAlert,     color: 'red'    },
    { path: '/settings', label: 'SYSTEM SETTINGS',   icon: Settings,        color: 'amber'  },
  ];

  const colorMap = {
    cyan:   { active: 'text-cyan-400   border-cyan-400   bg-cyan-950/60',   glow: 'shadow-neon-cyan-sm',  dot: 'bg-cyan-400'   },
    violet: { active: 'text-violet-400 border-violet-400 bg-violet-950/60', glow: 'shadow-neon-violet',   dot: 'bg-violet-400' },
    red:    { active: 'text-red-400    border-red-400    bg-red-950/60',    glow: 'shadow-neon-red-sm',   dot: 'bg-red-400'    },
    amber:  { active: 'text-amber-400  border-amber-400  bg-amber-950/60',  glow: '',                     dot: 'bg-amber-400'  },
  };

  return (
    <aside
      className={`relative flex flex-col justify-between z-40 transition-all duration-300 ease-in-out border-r border-[var(--border-subtle)]
        ${collapsed ? 'w-[68px]' : 'w-64'}
      `}
      style={{ background: 'linear-gradient(180deg, #07101f 0%, #060b18 100%)' }}
    >
      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-50 w-6 h-6 rounded-full bg-[#0f1a30] border border-[var(--border-base)] text-[var(--text-secondary)] hover:text-[var(--cyan-400)] hover:border-[var(--cyan-400)] flex items-center justify-center transition-all duration-200 shadow-lg"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-[var(--border-subtle)] ${collapsed ? 'justify-center' : ''}`}>
          {/* Animated shield logo */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-neon-cyan-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {/* Rotating ring */}
            <div className="absolute inset-0 rounded-xl border-2 border-transparent border-t-cyan-400 border-r-violet-400 animate-spin-slow opacity-60" />
          </div>

          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h2 className="text-sm font-display font-bold tracking-widest text-white uppercase leading-none">
                HAWKEYE
              </h2>
              <p className="text-[9px] text-cyan-400 font-mono tracking-[0.2em] uppercase mt-0.5 opacity-80">
                YOLOv8 · CUDA
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 p-3 space-y-1 font-mono text-xs ${collapsed ? 'items-center' : ''}`}>
          {!collapsed && (
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)] px-3 mb-3 font-mono">Navigation</p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const colors = colorMap[item.color];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group
                  ${collapsed ? 'justify-center' : ''}
                  ${isActive
                    ? `${colors.active} border-l-2 ${colors.glow} font-semibold`
                    : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface)] border-l-2 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? '' : ''}`} />
                    {!collapsed && (
                      <span className="truncate tracking-wider text-[11px]">{item.label}</span>
                    )}
                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-base)] text-white text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 shadow-lg">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom System Status */}
        {!collapsed ? (
          <div className="m-3 p-3 rounded-xl border border-[var(--border-subtle)] text-[10px] font-mono"
               style={{ background: 'rgba(15,26,48,0.8)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="text-[var(--text-muted)] uppercase tracking-wider text-[9px]">System Status</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">GPU</span>
                <span className="text-cyan-400 font-bold">RTX 2050</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Pipeline</span>
                <span className="text-emerald-400 font-bold">MOG2+YOLO</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Status</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400">ONLINE</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="m-3 flex justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Online" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Camera, ShieldAlert, Settings, Shield, ChevronLeft, ChevronRight, Zap, X } from 'lucide-react';

const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: '/',         label: 'COMMAND DASHBOARD', icon: LayoutDashboard, color: 'cyan' },
    { path: '/cameras',  label: 'CAMERAS & ZONES',   icon: Camera,          color: 'violet' },
    { path: '/events',   label: 'THREAT AUDIT LOGS', icon: ShieldAlert,     color: 'red'    },
    { path: '/settings', label: 'SYSTEM SETTINGS',   icon: Settings,        color: 'amber'  },
  ];

  const colorMap = {
    cyan:   { active: 'text-cyan-400   border-cyan-400   bg-cyan-950/60',   glow: 'shadow-neon-cyan-sm' },
    violet: { active: 'text-violet-400 border-violet-400 bg-violet-950/60', glow: 'shadow-neon-violet'  },
    red:    { active: 'text-red-400    border-red-400    bg-red-950/60',    glow: 'shadow-neon-red-sm'  },
    amber:  { active: 'text-amber-400  border-amber-400  bg-amber-950/60',  glow: ''                    },
  };

  const renderNav = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className={`flex items-center justify-between px-4 py-5 border-b border-[var(--border-subtle)] ${!isMobile && collapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          {/* Animated shield logo */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-neon-cyan-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="absolute inset-0 rounded-xl border-2 border-transparent border-t-cyan-400 border-r-violet-400 animate-spin-slow opacity-60" />
          </div>

          {(isMobile || !collapsed) && (
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

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-secondary)] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 p-3 space-y-1.5 font-mono text-xs overflow-y-auto ${!isMobile && collapsed ? 'items-center' : ''}`}>
        {(isMobile || !collapsed) && (
          <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)] px-3 mb-2 font-mono">Navigation</p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const colors = colorMap[item.color];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={isMobile ? onCloseMobile : undefined}
              title={!isMobile && collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group
                ${!isMobile && collapsed ? 'justify-center' : ''}
                ${isActive
                  ? `${colors.active} border-l-2 ${colors.glow} font-semibold`
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface)] border-l-2 border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  {(isMobile || !collapsed) && (
                    <span className="truncate tracking-wider text-[11px]">{item.label}</span>
                  )}
                  {/* Tooltip when collapsed on desktop */}
                  {!isMobile && collapsed && (
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

      {/* Bottom System Status Widget */}
      {(isMobile || !collapsed) && (
        <div
          className="m-3 p-3 rounded-xl border border-[var(--border-subtle)] text-[10px] font-mono"
          style={{ background: 'rgba(15,26,48,0.8)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="text-[var(--text-muted)] uppercase tracking-wider text-[9px]">Engine Status</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">GPU</span>
              <span className="text-cyan-400 font-bold">RTX 2050 (CUDA)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Model</span>
              <span className="text-emerald-400 font-bold">YOLOv8 + MOG2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Aside */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-300 ease-in-out border-r border-[var(--border-subtle)] flex flex-col justify-between
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg, #07101f 0%, #060b18 100%)' }}
      >
        {renderNav(true)}
      </aside>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside
        className={`relative hidden md:flex flex-col justify-between z-30 transition-all duration-300 ease-in-out border-r border-[var(--border-subtle)] flex-shrink-0
          ${collapsed ? 'w-[68px]' : 'w-60 lg:w-64'}
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

        {renderNav(false)}
      </aside>
    </>
  );
};

export default Sidebar;

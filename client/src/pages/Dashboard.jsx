import React, { useEffect, useRef } from 'react';
import LiveFeed from '../components/dashboard/LiveFeed';
import ThreatPanel from '../components/dashboard/ThreatPanel';
import { useSocket } from '../hooks/useSocket';
import { Shield, Eye, Cpu, Activity, ShieldAlert } from 'lucide-react';

/* ---- Animated stat card ---- */
const StatCard = ({ label, value, sub, icon: Icon, accent, animatedValue }) => {
  const accentMap = {
    cyan:   { border: 'border-l-cyan-400',   text: 'text-cyan-400',   bg: 'rgba(0,212,255,0.06)',  glow: '0 0 20px rgba(0,212,255,0.12)' },
    emerald:{ border: 'border-l-emerald-400', text: 'text-emerald-400', bg: 'rgba(0,230,118,0.06)', glow: '0 0 20px rgba(0,230,118,0.12)' },
    red:    { border: 'border-l-red-400',     text: 'text-red-400',     bg: 'rgba(255,58,58,0.06)',  glow: '0 0 20px rgba(255,58,58,0.12)'  },
    violet: { border: 'border-l-violet-400',  text: 'text-violet-400',  bg: 'rgba(124,58,237,0.06)', glow: '0 0 20px rgba(124,58,237,0.12)' },
  };
  const a = accentMap[accent] || accentMap.cyan;

  return (
    <div
      className={`neon-card rounded-xl p-4 border-l-4 ${a.border} relative card-shine overflow-hidden animate-slide-in-up`}
      style={{ background: a.bg, boxShadow: a.glow }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)]">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.text}`}
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className={`text-2xl font-display font-bold ${a.text} leading-none mb-1`}>
        {animatedValue ?? value}
      </div>
      <div className="text-[10px] font-mono text-[var(--text-muted)]">{sub}</div>
    </div>
  );
};

/* ---- DEFCON Gauge ---- */
const defconLevels = [
  { level: 1, label: 'CRITICAL', color: '#ff3a3a', condition: (t) => t === 'CRITICAL' },
  { level: 2, label: 'HIGH',     color: '#ff9500', condition: (t) => t === 'HIGH' },
  { level: 3, label: 'MEDIUM',   color: '#ffd60a', condition: (t) => t === 'MEDIUM' },
  { level: 4, label: 'ELEVATED', color: '#00d4ff', condition: (t) => t === 'LOW' },
  { level: 5, label: 'NORMAL',   color: '#00e676', condition: (t) => !t || t === 'NONE' },
];

const DefconGauge = ({ highestThreat }) => {
  const activeIdx = defconLevels.findIndex(d => d.condition(highestThreat));
  const active = defconLevels[activeIdx] ?? defconLevels[4];

  return (
    <div className="neon-card rounded-xl p-4 card-shine overflow-hidden" style={{ borderLeft: `4px solid ${active.color}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)]">SECURITY SYSTEM</span>
        <Shield className="w-3.5 h-3.5" style={{ color: active.color }} />
      </div>
      <div className="text-2xl font-display font-bold leading-none mb-2" style={{ color: active.color }}>
        DEFCON {active.level}
      </div>
      {/* Mini bar gauge */}
      <div className="flex items-end gap-1 h-5 mb-2">
        {defconLevels.slice().reverse().map((d, i) => {
          const isActive = d.level === active.level;
          const height = `${40 + i * 15}%`;
          return (
            <div
              key={d.level}
              className="flex-1 rounded-sm transition-all duration-500"
              style={{
                height,
                background: isActive ? active.color : 'rgba(255,255,255,0.06)',
                boxShadow: isActive ? `0 0 8px ${active.color}80` : 'none',
              }}
            />
          );
        })}
      </div>
      <div className="text-[10px] font-mono text-[var(--text-muted)]">{active.label} — Admin Session</div>
    </div>
  );
};

/* ---- Dashboard Page ---- */
const Dashboard = () => {
  const { isConnected, frameData } = useSocket();
  const payload       = frameData?.payload;
  const detections    = payload?.detections || [];
  const threats       = payload?.threats    || [];
  const highestThreat = payload?.highest_threat || 'NONE';
  const latency       = payload?.inference_time_ms;

  const getThreatTextColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-400 animate-pulse font-bold';
      case 'HIGH':     return 'text-amber-400 font-bold';
      case 'MEDIUM':   return 'text-yellow-400 font-bold';
      default:         return 'text-emerald-400 font-bold';
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pipeline Latency"
          value={latency ? `${latency} ms` : '--'}
          sub="CUDA Acceleration Active"
          icon={Cpu}
          accent="cyan"
        />
        <StatCard
          label="Active Detections"
          value={detections.length}
          sub="YOLOv8 Objects Tracked"
          icon={Eye}
          accent="emerald"
        />
        <StatCard
          label="Highest Threat Level"
          value={<span className={getThreatTextColor(highestThreat)}>{highestThreat || 'NONE'}</span>}
          sub="Phase 2 Spatial Intelligence"
          icon={ShieldAlert}
          accent={highestThreat === 'CRITICAL' ? 'red' : 'violet'}
        />
        <DefconGauge highestThreat={highestThreat} />
      </div>

      {/* Main Grid: Feed + Threat Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Live Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <h2 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em]">
              Live Surveillance Feed — Primary Webcam
            </h2>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>
          <LiveFeed frameData={frameData} isConnected={isConnected} />
        </div>

        {/* Threat Panel (1 col) */}
        <ThreatPanel threats={threats} />
      </div>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, Clock, MapPin, Zap } from 'lucide-react';

const threatConfig = {
  CRITICAL: {
    badge:     'threat-badge threat-badge-critical',
    cardStyle: { borderLeft: '3px solid #ff3a3a', boxShadow: '0 0 20px rgba(255,58,58,0.15), inset 0 0 0 1px rgba(255,58,58,0.05)' },
    icon:      ShieldAlert,
    animation: 'animate-alert-pulse',
  },
  HIGH: {
    badge:     'threat-badge threat-badge-high',
    cardStyle: { borderLeft: '3px solid #ff9500', boxShadow: '0 0 12px rgba(255,149,0,0.1)' },
    icon:      AlertTriangle,
    animation: '',
  },
  MEDIUM: {
    badge:     'threat-badge threat-badge-medium',
    cardStyle: { borderLeft: '3px solid #ffd60a', boxShadow: '0 0 8px rgba(255,214,10,0.08)' },
    icon:      AlertCircle,
    animation: '',
  },
  LOW: {
    badge:     'threat-badge threat-badge-low',
    cardStyle: { borderLeft: '3px solid #00e676' },
    icon:      Info,
    animation: '',
  },
};

const ThreatPanel = ({ threats = [] }) => {
  return (
    <div className="glass-card rounded-2xl flex flex-col h-full" style={{ minHeight: '300px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--border-subtle)]">
        <h3 className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          Real-Time Threat Feed
        </h3>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
              style={{ background: 'rgba(255,58,58,0.08)', borderColor: 'rgba(255,58,58,0.2)', color: threats.length > 0 ? '#ff6b6b' : '#3d5a80' }}>
          {threats.length} EVAL{threats.length !== 1 ? 'S' : ''}
        </span>
      </div>

      {/* Threat list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {threats.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center font-mono text-xs">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                 style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)' }}>
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-[var(--text-muted)] text-[11px]">Perimeter secure.</p>
            <p className="text-[var(--text-muted)] text-[11px]">No threat breaches detected.</p>
          </div>
        ) : (
          threats.map((evt, idx) => {
            const cfg = threatConfig[evt.threat_level] || threatConfig.LOW;
            const IconComponent = cfg.icon;

            return (
              <div
                key={idx}
                className={`rounded-xl p-3.5 font-mono text-xs transition-all duration-200 animate-slide-in-right ${cfg.animation}`}
                style={{
                  background: 'linear-gradient(135deg, rgba(17,29,56,0.95), rgba(11,18,37,0.9))',
                  border: '1px solid var(--border-subtle)',
                  ...cfg.cardStyle,
                }}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cfg.badge}>
                      <IconComponent className="w-3 h-3" />
                      {evt.threat_level}
                    </span>
                    <span className="text-[var(--text-primary)] font-bold uppercase text-[11px]">{evt.object_class}</span>
                    {evt.track_id !== -1 && (
                      <span className="text-cyan-400 font-bold text-[10px]">#{evt.track_id}</span>
                    )}
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)] tabular-nums">
                    {evt.timestamp?.split(' ')[1] || evt.timestamp}
                  </span>
                </div>

                {/* Reason */}
                <div className="text-[var(--text-secondary)] text-[11px] font-semibold mb-2.5 leading-relaxed">
                  {evt.threat_reason}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>{evt.zone_name}</span>
                  </div>
                  {evt.dwell_seconds > 0 && (
                    <div className="flex items-center gap-1 text-amber-400">
                      <Clock className="w-3 h-3" />
                      <span>Dwell: {evt.dwell_seconds}s</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ThreatPanel;

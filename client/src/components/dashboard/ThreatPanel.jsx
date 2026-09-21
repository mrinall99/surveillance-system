import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, Clock, MapPin } from 'lucide-react';

const ThreatPanel = ({ threats = [] }) => {
  const getBadgeStyle = (level) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-950/90 border-red-500/80 text-red-400',
          icon: ShieldAlert,
          cardBorder: 'border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-alert-pulse'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-950/90 border-amber-500/80 text-amber-400',
          icon: AlertTriangle,
          cardBorder: 'border-amber-500/60'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-950/80 border-yellow-500/60 text-yellow-400',
          icon: AlertCircle,
          cardBorder: 'border-yellow-500/40'
        };
      default:
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400',
          icon: Info,
          cardBorder: 'border-slate-800'
        };
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          REAL-TIME THREAT ASSESSMENT FEED
        </h3>
        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
          {threats.length} EVALUATIONS
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">
        {threats.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono text-xs">
            <Info className="w-8 h-8 text-slate-700 mb-2" />
            <p>Perimeter secure. No threat breaches evaluated.</p>
          </div>
        ) : (
          threats.map((evt, idx) => {
            const style = getBadgeStyle(evt.threat_level);
            const IconComponent = style.icon;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl bg-slate-900/90 border font-mono text-xs transition-all ${style.cardBorder}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-bold flex items-center gap-1 ${style.bg}`}>
                      <IconComponent className="w-3 h-3" />
                      {evt.threat_level}
                    </span>
                    <span className="text-slate-200 font-bold uppercase">{evt.object_class}</span>
                    {evt.track_id !== -1 && (
                      <span className="text-cyan-400 font-bold">#{evt.track_id}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{evt.timestamp.split(' ')[1] || evt.timestamp}</span>
                </div>

                <div className="text-slate-300 font-semibold mb-2">{evt.threat_reason}</div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1 text-slate-400">
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

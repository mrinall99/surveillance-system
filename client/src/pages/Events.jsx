import React from 'react';
import { AlertOctagon } from 'lucide-react';

const Events = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-mono font-bold text-white uppercase tracking-wider">EVENT AUDIT LOGS</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">SQLite database of all historical detection events and threat alerts.</p>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center font-mono text-slate-400 text-xs">
        <AlertOctagon className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
        <p>Event logging pipeline ready. Historical detections will populate here as events trigger.</p>
      </div>
    </div>
  );
};

export default Events;

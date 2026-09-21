import React, { useState } from 'react';
import { Film, Calendar, Search, HardDrive, Play, Filter, ShieldAlert, Clock, Download, RefreshCw } from 'lucide-react';

const Playback = () => {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCamera, setSelectedCamera] = useState('CAM-01');

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/10 pb-4">
        <div>
          <h1 className="text-xl font-mono font-black text-white uppercase tracking-wider flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
              <Film className="w-5 h-5" />
            </div>
            <span>VIDEO PLAYBACK ARCHIVE &amp; EVIDENCE VAULT</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1.5">
            Review annotated CCTV footage, breach incidents, and motion-triggered event captures.
          </p>
        </div>

        {/* Storage stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">VAULT:</span>
            <span className="text-cyan-400 font-semibold">ENCRYPTED (LOCAL)</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>FILTER:</span>
          </div>

          {/* Camera select */}
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs font-mono px-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500"
          >
            <option value="CAM-01">CAM-01 (Primary Optical)</option>
            <option value="CAM-02">CAM-02 (Perimeter North)</option>
            <option value="CAM-03">CAM-03 (Loading Bay)</option>
          </select>

          {/* Date input */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none text-xs"
            />
          </div>
        </div>

        <button
          onClick={() => {}}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 text-xs font-mono transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>QUERY VAULT</span>
        </button>
      </div>

      {/* Main Empty / Archive State */}
      <div className="glass-panel rounded-2xl p-12 border border-slate-800 text-center font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.03)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(0,212,255,0.15)]">
            <Film className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white tracking-wide">NO ARCHIVED RECORDINGS FOR SELECTED TIMEFRAME</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              When DEFCON 1 breaches or motion triggers occur with recording enabled in Settings, annotated incident clips will automatically sync into this vault.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Retention Period: 30 Days</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              <HardDrive className="w-3 h-3 text-emerald-400" />
              <span>Auto-Purge: Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playback;

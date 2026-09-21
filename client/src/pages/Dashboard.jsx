import React from 'react';
import LiveFeed from '../components/dashboard/LiveFeed';
import ThreatPanel from '../components/dashboard/ThreatPanel';
import { useSocket } from '../hooks/useSocket';
import { Shield, Eye, Cpu, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  const { isConnected, frameData } = useSocket();

  const payload = frameData?.payload;
  const detections = payload?.detections || [];
  const threats = payload?.threats || [];
  const highestThreat = payload?.highest_threat || 'LOW';

  const getThreatColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-400 font-bold animate-pulse';
      case 'HIGH': return 'text-amber-400 font-bold';
      case 'MEDIUM': return 'text-yellow-400 font-bold';
      default: return 'text-emerald-400 font-bold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2 font-mono text-xs">
            <span>PIPELINE LATENCY</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {payload?.inference_time_ms ? `${payload.inference_time_ms} ms` : '--'}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">CUDA Acceleration Active</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2 font-mono text-xs">
            <span>ACTIVE DETECTIONS</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {detections.length}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">YOLOv8 Objects Tracked</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2 font-mono text-xs">
            <span>HIGHEST THREAT LEVEL</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className={`text-xl font-mono ${getThreatColor(highestThreat)}`}>
            {highestThreat}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">Phase 2 Spatial Intelligence</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2 font-mono text-xs">
            <span>SECURITY SYSTEM</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400">DEFCON 4</div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">Admin Session Active</div>
        </div>
      </div>

      {/* Main Grid: Live Video Feed + Threat Feed Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Stream Container (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              LIVE SURVEILLANCE FEED [PRIMARY WEBCAM]
            </h2>
          </div>
          <LiveFeed frameData={frameData} isConnected={isConnected} />
        </div>

        {/* Phase 2 Real-Time Threat Feed Sidebar (1 col) */}
        <ThreatPanel threats={threats} />
      </div>
    </div>
  );
};

export default Dashboard;

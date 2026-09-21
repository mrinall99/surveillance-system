import React from 'react';
import ZoneEditor from '../components/zones/ZoneEditor';
import { useSocket } from '../hooks/useSocket';
import { Layers, Video, Shield, Radio } from 'lucide-react';

const Cameras = () => {
  const { frameData, isConnected } = useSocket();

  return (
    <div className="space-y-6 page-enter">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/10 pb-4">
        <div>
          <h1 className="text-xl font-mono font-black text-white uppercase tracking-wider flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <span>CAMERA MANAGEMENT &amp; SPATIAL ZONE EDITOR</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1.5 flex items-center gap-2">
            <span>Draw polygonal security zones directly on live camera feeds &amp; configure optical boundaries.</span>
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className="text-slate-400">STREAM:</span>
            <span className={isConnected ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {isConnected ? 'CAM-01 (ACTIVE)' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Zone Editor Component */}
      <ZoneEditor frameData={frameData} />
    </div>
  );
};

export default Cameras;

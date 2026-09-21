import React from 'react';
import ZoneEditor from '../components/zones/ZoneEditor';
import { useSocket } from '../hooks/useSocket';
import { Layers } from 'lucide-react';

const Cameras = () => {
  const { frameData } = useSocket();

  return (
    <div className="space-y-5 page-enter">
      {/* Page Header */}
      <div className="border-b border-cyan-500/10 pb-4">
        <h1 className="text-lg sm:text-xl font-mono font-black text-white uppercase tracking-wider flex items-center gap-2.5">
          <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span>SPATIAL ZONE MANAGER</span>
        </h1>
        <p className="text-[10px] sm:text-xs text-slate-400 font-mono mt-1">
          Draw and configure restricted zones, tripwires, and surveillance perimeters on the live feed.
        </p>
      </div>

      {/* Zone Editor */}
      <ZoneEditor frameData={frameData} />
    </div>
  );
};

export default Cameras;

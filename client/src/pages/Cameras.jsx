import React from 'react';
import ZoneEditor from '../components/zones/ZoneEditor';
import { useSocket } from '../hooks/useSocket';
import { Camera, MapPin, Layers } from 'lucide-react';

const Cameras = () => {
  const { frameData } = useSocket();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-cyan-400" />
          CAMERA MANAGEMENT & SPATIAL ZONE EDITOR
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Draw polygonal security zones directly on live camera streams and manage camera sources.
        </p>
      </div>

      <ZoneEditor frameData={frameData} />
    </div>
  );
};

export default Cameras;

import React from 'react';
import { Video } from 'lucide-react';

const Playback = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-mono font-bold text-white uppercase tracking-wider">VIDEO PLAYBACK ARCHIVE</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">Review annotated recordings saved during motion & threat triggers.</p>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center font-mono text-slate-400 text-xs">
        <Video className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
        <p>No video recordings stored yet. Motion triggered clips will be archived here.</p>
      </div>
    </div>
  );
};

export default Playback;

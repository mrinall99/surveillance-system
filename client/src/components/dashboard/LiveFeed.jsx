import React, { useState, useEffect } from 'react';
import { Camera, Activity, Cpu, Eye, Layers, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import ZoneOverlay from '../zones/ZoneOverlay';
import audioAlert from '../../utils/audioAlert';

const LiveFeed = ({ frameData, isConnected }) => {
  const [showZones, setShowZones] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [cachedZones, setCachedZones] = useState([]);

  // Fetch initial zones as a fallback if not yet delivered via socket stream
  useEffect(() => {
    fetch('/api/zones', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.zones) && data.zones.length > 0) {
          setCachedZones(data.zones);
        }
      })
      .catch(() => {});
  }, []);

  // Update cached zones whenever payload sends active zones
  useEffect(() => {
    if (frameData?.payload?.zones && Array.isArray(frameData.payload.zones) && frameData.payload.zones.length > 0) {
      setCachedZones(frameData.payload.zones);
    }
  }, [frameData?.payload?.zones]);

  const payload = frameData?.payload;
  const threats = payload?.threats || [];

  // Identify targets currently breaching restricted zones
  const activeBreaches = threats.filter(
    t => t.zone_type === 'restricted' || t.threat_level === 'CRITICAL'
  );
  const activeBreachZoneNames = activeBreaches.map(t => t.zone_name);
  const hasBreach = activeBreaches.length > 0;

  // Synthesize warning beep sound effect upon restricted zone breach
  useEffect(() => {
    if (hasBreach && !isMuted) {
      audioAlert.playRestrictedBreachBeep();
    }
  }, [threats, hasBreach, isMuted]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioAlert.setMuted(nextMuted);
    if (!nextMuted) {
      audioAlert.playChirp(1200, 0.1); // Short chirp confirmation
    }
  };

  if (!isConnected || !frameData) {
    return (
      <div className="w-full aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-600">
          <Camera className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
          {isConnected ? 'WAITING FOR CAMERA STREAM...' : 'CV ENGINE DISCONNECTED'}
        </h3>
        <p className="text-xs text-slate-500 font-mono max-w-sm">
          {isConnected
            ? 'Initializing webcam feed and loading CUDA PyTorch acceleration kernels...'
            : 'Ensure python engine/main.py is running on port 8765.'}
        </p>
      </div>
    );
  }

  const { frame } = frameData;
  const activeZones = (payload?.zones && payload.zones.length > 0) ? payload.zones : cachedZones;

  return (
    <div className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden border shadow-2xl group transition-all ${
      hasBreach ? 'border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.4)]' : 'border-slate-800'
    }`}>
      {/* Live Base64 Frame Stream Image */}
      <img
        src={`data:image/jpeg;base64,${frame}`}
        alt="Surveillance Feed"
        className="w-full h-full object-contain"
      />

      {/* Phase 2 Polygonal Spatial Security Zones SVG Overlay */}
      {showZones && (
        <ZoneOverlay 
          zones={activeZones} 
          activeBreachZoneNames={activeBreachZoneNames} 
        />
      )}

      {/* Top Stream Overlay Toolbar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/80 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-slate-200 font-bold">CAM-01 [WEBCAM]</span>
          </div>

          {/* Spatial Zones Toggle Button */}
          <button
            onClick={() => setShowZones(!showZones)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-md font-mono text-xs font-bold transition-all ${
              showZones
                ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-lg shadow-cyan-950/50'
                : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Spatial Polygonal Zone Overlays"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ZONES: {showZones ? `ON (${activeZones.length})` : 'OFF'}</span>
          </button>

          {/* Audio Alert Toggle Button */}
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-md font-mono text-xs font-bold transition-all ${
              hasBreach
                ? 'bg-red-950/90 border-red-500 text-red-300 animate-bounce shadow-lg shadow-red-950/80'
                : !isMuted
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Restricted Zone Breach Audio Alarm Beep"
          >
            {hasBreach ? (
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            ) : !isMuted ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>
              {hasBreach
                ? '⚠️ JALDI ALARM!'
                : !isMuted
                ? 'AUDIO: ARMED'
                : 'AUDIO: MUTED'}
            </span>
          </button>

          {/* Test Audio Button */}
          <button
            type="button"
            onClick={() => audioAlert.testPlay()}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Test jaldi.mp3 alert audio"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>TEST</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-800/80 font-mono text-xs">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">{payload.inference_time_ms} ms</span>
          </div>

          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border backdrop-blur-md font-mono text-xs font-bold ${
              payload.has_motion
                ? 'bg-red-950/80 border-red-500/80 text-red-400'
                : 'bg-emerald-950/80 border-emerald-500/80 text-emerald-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{payload.has_motion ? 'MOTION ACTIVE' : 'NO MOTION'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Detection Stats Overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between text-xs font-mono z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>OBJECTS DETECTED: <strong className="text-white">{payload.detections?.length || 0}</strong></span>
          </div>
          {hasBreach && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-900/80 border border-red-500/80 text-red-200 font-bold animate-pulse text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>CRITICAL RESTRICTED ZONE BREACH</span>
            </div>
          )}
        </div>
        <div className="text-slate-400">
          TIMESTAMP: <span className="text-slate-200">{payload.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;

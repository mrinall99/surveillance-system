import React, { useState, useEffect } from 'react';
import { Camera, Activity, Cpu, Eye, Layers, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import ZoneOverlay from '../zones/ZoneOverlay';
import audioAlert from '../../utils/audioAlert';

/* ---- Offline Radar Placeholder ---- */
const OfflinePlaceholder = ({ isConnected }) => (
  <div className="w-full aspect-video rounded-2xl border border-[var(--border-base)] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden"
       style={{ background: 'radial-gradient(ellipse at 50% 60%, #0c1428 0%, #060b18 100%)' }}>
    {/* Radar rings */}
    {[1, 2, 3, 4].map(i => (
      <div
        key={i}
        className="absolute rounded-full border border-cyan-900/30"
        style={{ width: `${i * 25}%`, height: `${i * 25}%`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
    ))}
    {/* Rotating sweep */}
    <div className="absolute w-1 h-[35%] bottom-[50%] left-[50%] origin-bottom radar-sweep"
         style={{ background: 'linear-gradient(to top, rgba(0,212,255,0.4), transparent)', borderRadius: '2px 2px 0 0', marginLeft: '-0.5px' }} />

    <div className="relative z-10">
      <div className="w-14 h-14 rounded-full border border-[var(--border-base)] flex items-center justify-center mb-4"
           style={{ background: 'rgba(0,212,255,0.06)' }}>
        <Camera className="w-7 h-7 text-cyan-700 animate-pulse" />
      </div>
      <h3 className="text-sm font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
        {isConnected ? 'AWAITING CAMERA STREAM' : 'CV ENGINE DISCONNECTED'}
      </h3>
      <p className="text-xs text-[var(--text-muted)] font-mono max-w-xs">
        {isConnected
          ? 'Initializing webcam — loading CUDA PyTorch kernels...'
          : 'Run engine/main.py to connect on port 8765'}
      </p>
    </div>
  </div>
);

/* ---- Overlay Pill Button ---- */
const PillBtn = ({ onClick, active, activeClass, inactiveClass, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-md font-mono text-xs font-bold transition-all duration-200
      ${active ? activeClass : inactiveClass}`}
  >
    {children}
  </button>
);

/* ---- LiveFeed ---- */
const LiveFeed = ({ frameData, isConnected }) => {
  const [showZones, setShowZones] = useState(true);
  const [isMuted, setIsMuted]     = useState(false);
  const [cachedZones, setCachedZones] = useState([]);

  useEffect(() => {
    fetch('/api/zones', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.zones) && d.zones.length > 0) setCachedZones(d.zones); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (frameData?.payload?.zones?.length > 0) setCachedZones(frameData.payload.zones);
  }, [frameData?.payload?.zones]);

  const payload  = frameData?.payload;
  const threats  = payload?.threats || [];
  const activeBreaches     = threats.filter(t => t.zone_type === 'restricted' || t.threat_level === 'CRITICAL');
  const activeBreachZoneNames = activeBreaches.map(t => t.zone_name);
  const hasBreach = activeBreaches.length > 0;

  useEffect(() => {
    if (hasBreach && !isMuted) audioAlert.playRestrictedBreachBeep();
  }, [threats, hasBreach, isMuted]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioAlert.setMuted(next);
    if (!next) audioAlert.playChirp(1200, 0.1);
  };

  if (!isConnected || !frameData) return <OfflinePlaceholder isConnected={isConnected} />;

  const { frame } = frameData;
  const activeZones = (payload?.zones?.length > 0) ? payload.zones : cachedZones;

  return (
    <div className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden border shadow-2xl transition-all duration-500
      ${hasBreach ? 'border-red-500 shadow-neon-red' : 'border-[var(--border-base)]'}`}
    >
      {/* Stream image */}
      <img src={`data:image/jpeg;base64,${frame}`} alt="Surveillance Feed" className="w-full h-full object-contain" />

      {/* Scanlines overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />

      {/* Zone Overlay */}
      {showZones && <ZoneOverlay zones={activeZones} activeBreachZoneNames={activeBreachZoneNames} />}

      {/* Top toolbar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Camera tag */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs"
               style={{ background: 'rgba(6,11,24,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(30,49,82,0.8)' }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[var(--text-primary)] font-bold tracking-wider">CAM-01</span>
          </div>

          {/* Zones toggle */}
          <PillBtn
            onClick={() => setShowZones(!showZones)}
            active={showZones}
            activeClass="bg-cyan-950/90 border-cyan-500/70 text-cyan-300 shadow-neon-cyan-sm"
            inactiveClass="border-[var(--border-base)] text-[var(--text-muted)] hover:text-white"
            style={{ background: 'rgba(6,11,24,0.85)', backdropFilter: 'blur(12px)' }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ZONES: {showZones ? `ON (${activeZones.length})` : 'OFF'}</span>
          </PillBtn>

          {/* Audio alarm */}
          <PillBtn
            onClick={handleToggleMute}
            active={hasBreach || !isMuted}
            activeClass={hasBreach
              ? 'bg-red-950/90 border-red-500 text-red-300 animate-bounce shadow-neon-red-sm'
              : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
            }
            inactiveClass="border-[var(--border-base)] text-[var(--text-muted)] hover:text-white"
          >
            {hasBreach
              ? <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              : !isMuted
              ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              : <VolumeX className="w-3.5 h-3.5" />
            }
            <span>{hasBreach ? '⚠ JALDI ALARM!' : !isMuted ? 'AUDIO: ARMED' : 'AUDIO: MUTED'}</span>
          </PillBtn>

          {/* Test audio */}
          <button
            type="button"
            onClick={() => audioAlert.testPlay()}
            className="px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold flex items-center gap-1.5 transition-all text-[var(--text-secondary)] hover:text-white hover:border-cyan-500/50"
            style={{ background: 'rgba(6,11,24,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(30,49,82,0.8)' }}
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            TEST
          </button>
        </div>

        {/* Right stats */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs"
               style={{ background: 'rgba(6,11,24,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(30,49,82,0.8)' }}>
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span className="text-[var(--text-primary)]">{payload.inference_time_ms} ms</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all
            ${payload.has_motion
              ? 'bg-red-950/80 border-red-500/70 text-red-400'
              : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-400'
            }`}
            style={{ backdropFilter: 'blur(12px)' }}
          >
            <Activity className="w-3 h-3" />
            <span>{payload.has_motion ? 'MOTION ACTIVE' : 'CLEAR'}</span>
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="absolute bottom-3 left-3 right-3 z-20 rounded-xl border px-4 py-3 flex items-center justify-between font-mono text-xs"
           style={{ background: 'rgba(6,11,24,0.88)', backdropFilter: 'blur(16px)', borderColor: 'rgba(30,49,82,0.8)' }}>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>OBJECTS: <strong className="text-white">{payload.detections?.length || 0}</strong></span>
          </div>
          {hasBreach && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-900/80 border border-red-500/60 text-red-200 font-bold animate-pulse text-[10px]">
              <ShieldAlert className="w-3 h-3 text-red-400" />
              CRITICAL RESTRICTED ZONE BREACH
            </div>
          )}
        </div>
        <div className="text-[var(--text-muted)] text-[10px] tabular-nums">
          TS: <span className="text-[var(--text-secondary)]">{payload.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;

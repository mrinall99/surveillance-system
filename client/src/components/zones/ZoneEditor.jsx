import React, { useState, useEffect } from 'react';
import { MousePointer, Plus, Trash2, Save, ShieldAlert, Check, RefreshCw, Volume2, VolumeX, Layers, MapPin } from 'lucide-react';
import ZoneOverlay from './ZoneOverlay';
import audioAlert from '../../utils/audioAlert';

const ZoneEditor = ({ frameData }) => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState('restricted');
  const [currentVertices, setCurrentVertices] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const payload = frameData?.payload;
  const threats = payload?.threats || [];

  // Active restricted zone breach detection
  const activeBreaches = threats.filter(
    t => t.zone_type === 'restricted' || t.threat_level === 'CRITICAL'
  );
  const activeBreachZoneNames = activeBreaches.map(t => t.zone_name);
  const hasBreach = activeBreaches.length > 0;

  // Trigger jaldi.mp3 when a breach occurs in Zone Editor view
  useEffect(() => {
    if (hasBreach && !isMuted) {
      audioAlert.playRestrictedBreachBeep();
    }
  }, [threats, hasBreach, isMuted]);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/zones', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.zones) {
        setZones(data.zones);
      }
    } catch (err) {
      console.error('Failed to load zones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePointerAdd = (clientX, clientY, targetRect) => {
    const clickX = clientX - targetRect.left;
    const clickY = clientY - targetRect.top;

    const percentX = Math.round(Math.max(0, Math.min(100, (clickX / targetRect.width) * 100)));
    const percentY = Math.round(Math.max(0, Math.min(100, (clickY / targetRect.height) * 100)));

    setCurrentVertices(prev => [...prev, [percentX, percentY]]);
  };

  const handleFrameClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handlePointerAdd(e.clientX, e.clientY, rect);
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      handlePointerAdd(touch.clientX, touch.clientY, rect);
    }
  };

  const handleClearCurrent = () => {
    setCurrentVertices([]);
  };

  const handleSaveZone = async () => {
    if (!zoneName.trim()) {
      setErrorMsg('Please enter a zone identifier name');
      return;
    }
    if (currentVertices.length < 3) {
      setErrorMsg('A zone polygon requires at least 3 perimeter vertices');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: zoneName.trim(),
          type: zoneType,
          polygon: currentVertices
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save zone');
      }

      setZoneName('');
      setCurrentVertices([]);
      fetchZones();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving zone');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (id) => {
    try {
      await fetch(`/api/zones/${id}`, { method: 'DELETE', credentials: 'include' });
      fetchZones();
    } catch (err) {
      console.error('Failed to delete zone:', err);
    }
  };

  const frame = frameData?.frame;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Interactive Video Stream Canvas (2 cols) */}
        <div className="lg:col-span-2 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between font-mono text-[11px] sm:text-xs text-[var(--text-secondary)] flex-wrap gap-2">
            <span className="flex items-center gap-1.5 font-bold uppercase truncate max-w-full">
              <MousePointer className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Click / Tap Frame to Add Vertices ({currentVertices.length} Points)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => audioAlert.testPlay()}
                className="px-2 sm:px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 hover:bg-cyan-900/80 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
              >
                <Volume2 className="w-3 h-3 text-cyan-400" />
                <span>TEST AUDIO</span>
              </button>

              <button
                type="button"
                onClick={handleClearCurrent}
                disabled={currentVertices.length === 0}
                className="text-slate-400 hover:text-red-400 text-[10px] sm:text-[11px] underline flex items-center gap-1 disabled:opacity-40"
              >
                <RefreshCw className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>

          <div
            onClick={handleFrameClick}
            onTouchEnd={handleTouchEnd}
            className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden border shadow-2xl cursor-crosshair group transition-all select-none touch-none
              ${hasBreach 
                ? 'border-red-500 shadow-neon-red' 
                : 'border-[var(--border-base)]'
              }`}
          >
            {frame ? (
              <img
                src={`data:image/jpeg;base64,${frame}`}
                alt="Camera Stream"
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] font-mono text-xs p-4 text-center">
                <Layers className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                <p>Waiting for live camera frame stream...</p>
              </div>
            )}

            {/* Existing Saved Zone SVG Overlays with active breach highlights */}
            <ZoneOverlay zones={zones} activeBreachZoneNames={activeBreachZoneNames} />

            {/* Active Breach Badge Overlay */}
            {hasBreach && (
              <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-red-950/90 border border-red-500 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-red-200 font-mono text-[10px] sm:text-xs font-bold animate-pulse shadow-lg">
                <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 flex-shrink-0" />
                <span>RESTRICTED ZONE BREACH</span>
              </div>
            )}

            {/* Current Unsaved Polygon Draft Overlay */}
            {currentVertices.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                {currentVertices.map(([x, y], idx) => (
                  <circle key={idx} cx={x} cy={y} r="1.4" fill="#00d4ff" stroke="#ffffff" strokeWidth="0.4" />
                ))}
                {currentVertices.length >= 2 && (
                  <polyline
                    points={currentVertices.map(([x, y]) => `${x},${y}`).join(' ')}
                    fill="rgba(0, 212, 255, 0.25)"
                    stroke="#00d4ff"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />
                )}
              </svg>
            )}
          </div>
        </div>

        {/* Zone Control Panel (1 col) */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-[var(--border-subtle)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <Plus className="w-4 h-4 text-cyan-400" />
              CREATE SECURITY ZONE
            </h3>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-300 font-mono text-[11px] animate-shake">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Zone Identifier Name
              </label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. Server Rack Vault"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Security Policy Level
              </label>
              <select
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="restricted">🔴 Restricted Zone (Breach = CRITICAL)</option>
                <option value="monitored">🟡 Monitored Zone (Loitering = HIGH)</option>
                <option value="safe">🟢 Safe Zone (Normal Activity = LOW)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSaveZone}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'SAVING ZONE...' : 'SAVE POLYGON BOUNDARY'}</span>
            </button>
          </div>

          {/* Existing Saved Zones List */}
          <div className="space-y-2.5 pt-4 border-t border-[var(--border-subtle)]">
            <h4 className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
              <span>CONFIGURED ZONES</span>
              <span>({zones.length})</span>
            </h4>

            <div className="space-y-1.5 max-h-44 sm:max-h-48 overflow-y-auto font-mono text-xs pr-1">
              {zones.length === 0 ? (
                <p className="text-[11px] text-[var(--text-muted)] italic py-2">No security zones defined yet.</p>
              ) : (
                zones.map((z) => (
                  <div key={z.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-200 text-[11px] truncate">{z.name}</div>
                      <div className="text-[9px] text-[var(--text-muted)] uppercase flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                        <span>{z.type} policy</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteZone(z.id)}
                      title="Delete zone"
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneEditor;

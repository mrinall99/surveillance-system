import React, { useState, useEffect } from 'react';
import { MousePointer, Plus, Trash2, Save, ShieldAlert, Check, RefreshCw, Volume2, VolumeX } from 'lucide-react';
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

  const handleFrameClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = Math.round((clickX / rect.width) * 100);
    const percentY = Math.round((clickY / rect.height) * 100);

    setCurrentVertices([...currentVertices, [percentX, percentY]]);
  };

  const handleClearCurrent = () => {
    setCurrentVertices([]);
  };

  const handleSaveZone = async () => {
    if (!zoneName.trim()) {
      setErrorMsg('Please enter a zone name');
      return;
    }
    if (currentVertices.length < 3) {
      setErrorMsg('A zone polygon requires at least 3 point vertices');
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
          name: zoneName,
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Video Stream Canvas (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs text-slate-300 flex-wrap gap-2">
            <span className="flex items-center gap-2 font-bold uppercase">
              <MousePointer className="w-4 h-4 text-cyan-400" />
              Interactive Zone Editor — Click Frame to Add Vertices ({currentVertices.length} Points)
            </span>
            <div className="flex items-center gap-3">
              {/* Test Audio Button */}
              <button
                type="button"
                onClick={() => audioAlert.testPlay()}
                className="px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 hover:bg-cyan-900/80 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="Test jaldi.mp3 alert audio"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>TEST JALDI AUDIO</span>
              </button>

              <button
                onClick={handleClearCurrent}
                className="text-slate-400 hover:text-red-400 text-[11px] underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Clear Points
              </button>
            </div>
          </div>

          <div
            onClick={handleFrameClick}
            className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden border shadow-2xl cursor-crosshair group transition-all ${
              hasBreach 
                ? 'border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.5)]' 
                : 'border-cyan-500/40'
            }`}
          >
            {frame ? (
              <img
                src={`data:image/jpeg;base64,${frame}`}
                alt="Camera Stream"
                className="w-full h-full object-contain pointer-events-none"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
                <p>Waiting for live camera frame stream...</p>
              </div>
            )}

            {/* Existing Saved Zone SVG Overlays with active breach highlights */}
            <ZoneOverlay zones={zones} activeBreachZoneNames={activeBreachZoneNames} />

            {/* Active Breach Badge Overlay */}
            {hasBreach && (
              <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-red-950/90 border border-red-500 px-3.5 py-1.5 rounded-lg text-red-200 font-mono text-xs font-bold animate-pulse shadow-lg">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>RESTRICTED ZONE BREACH DETECTED</span>
              </div>
            )}

            {/* Current Unsaved Polygon Draft Overlay */}
            {currentVertices.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                {currentVertices.map(([x, y], idx) => (
                  <circle key={idx} cx={x} cy={y} r="1.2" fill="#06b6d4" stroke="#ffffff" strokeWidth="0.3" />
                ))}
                {currentVertices.length >= 2 && (
                  <polyline
                    points={currentVertices.map(([x, y]) => `${x},${y}`).join(' ')}
                    fill="rgba(6, 182, 212, 0.2)"
                    stroke="#06b6d4"
                    strokeWidth="0.8"
                  />
                )}
              </svg>
            )}
          </div>
        </div>

        {/* Zone Control Panel (1 col) */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Plus className="w-4 h-4 text-cyan-400" />
              CREATE SECURITY ZONE
            </h3>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/60 text-red-400 font-mono text-xs">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Zone Name</label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. Front Door Vault"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Security Zone Level</label>
              <select
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:border-cyan-500"
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
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50"
            >
              <Save className="w-4 h-4" />
              <span>SAVE POLYGON ZONE</span>
            </button>
          </div>

          {/* Existing Saved Zones List */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              ACTIVE ZONES ({zones.length})
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-xs">
              {zones.map((z) => (
                <div key={z.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200">{z.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{z.type} zone</div>
                  </div>
                  <button
                    onClick={() => handleDeleteZone(z.id)}
                    className="p-1 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneEditor;

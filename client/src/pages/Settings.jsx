import React, { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon, Save, Cpu, Activity,
  Bell, Check, AlertCircle, Dot
} from 'lucide-react';

/* ---- Section Card ---- */
const Section = ({ icon: Icon, title, accent, children }) => {
  const accents = {
    cyan:   { border: '#00d4ff', icon: 'text-cyan-400', label: 'bg-cyan-950/60 text-cyan-300' },
    emerald:{ border: '#00e676', icon: 'text-emerald-400', label: 'bg-emerald-950/60 text-emerald-300' },
    amber:  { border: '#ff9500', icon: 'text-amber-400', label: 'bg-amber-950/60 text-amber-300' },
  };
  const a = accents[accent] || accents.cyan;
  return (
    <div className="glass-card rounded-2xl overflow-hidden" style={{ borderLeft: `3px solid ${a.border}` }}>
      <div className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--border-subtle)]"
           style={{ background: 'rgba(6,11,24,0.4)' }}>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${a.icon}`}
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <h2 className="text-xs font-mono font-bold text-white uppercase tracking-[0.12em] truncate">{title}</h2>
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6">{children}</div>
    </div>
  );
};

/* ---- Label Row ---- */
const SliderRow = ({ label, value, display, min, max, step, onChange, accent = 'cyan', hint }) => {
  const pct = ((value - min) / (max - min)) * 100;
  const colors = { cyan: '#00d4ff', emerald: '#00e676', amber: '#ff9500' };
  const c = colors[accent] || colors.cyan;

  return (
    <div>
      <div className="flex items-center justify-between mb-2 font-mono text-xs">
        <label className="text-[var(--text-secondary)]">{label}</label>
        <span className="font-bold px-2 py-0.5 rounded-md text-[11px]"
              style={{ background: `${c}18`, color: c, border: `1px solid ${c}40` }}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="cyber-slider w-full"
        style={{ '--val': `${pct}%`, background: `linear-gradient(to right, ${c} ${pct}%, var(--border-base) ${pct}%)` }}
      />
      {hint && <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1.5">{hint}</p>}
    </div>
  );
};

/* ---- Toggle ---- */
const CyberToggle = ({ checked, onChange, label, sub }) => (
  <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-[var(--border-subtle)] gap-3"
       style={{ background: 'rgba(6,11,24,0.4)' }}>
    <div className="min-w-0">
      <div className="text-xs font-mono text-[var(--text-primary)] font-bold">{label}</div>
      {sub && <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5 leading-snug">{sub}</div>}
    </div>
    <label className="cyber-toggle flex-shrink-0" onClick={() => onChange(!checked)}>
      <input type="checkbox" checked={checked} onChange={() => {}} />
      <div className="cyber-toggle-track">
        <div className="cyber-toggle-thumb" />
      </div>
    </label>
  </div>
);

/* ---- Class Chip ---- */
const ClassChip = ({ id, label, selected, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(id)}
    className={`px-3 py-2 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-2 transition-all duration-150 flex-shrink-0
      ${selected
        ? 'border-cyan-500/60 text-cyan-300 shadow-neon-cyan-sm'
        : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-base)] hover:text-white'
      }`}
    style={selected ? { background: 'rgba(0,212,255,0.08)' } : { background: 'rgba(6,11,24,0.5)' }}
  >
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${selected ? 'bg-cyan-400' : 'bg-[var(--text-muted)]'}`} />
    <span>{label}</span>
  </button>
);

/* ---- Save toast ---- */
const SaveToast = ({ show }) => (
  <div className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
    <div className="flex items-center justify-center gap-3 px-4 sm:px-5 py-3 rounded-xl font-mono text-xs font-bold text-emerald-300 shadow-2xl"
         style={{ background: 'rgba(0,59,37,0.95)', border: '1px solid rgba(0,230,118,0.5)', boxShadow: '0 0 25px rgba(0,230,118,0.2)' }}>
      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <span>Configuration saved — applied live to CV Engine!</span>
    </div>
  </div>
);

/* ---- Available COCO classes ---- */
const availableClasses = [
  { id: 'person',     label: 'Person' },
  { id: 'car',        label: 'Car' },
  { id: 'truck',      label: 'Truck' },
  { id: 'bus',        label: 'Bus' },
  { id: 'motorcycle', label: 'Motorcycle' },
  { id: 'bicycle',    label: 'Bicycle' },
  { id: 'dog',        label: 'Dog' },
  { id: 'backpack',   label: 'Backpack' },
  { id: 'suitcase',   label: 'Suitcase' },
];

/* ============================================================
   SETTINGS PAGE
   ============================================================ */
const Settings = () => {
  const [config, setConfig]                 = useState(null);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [saveSuccess, setSaveSuccess]       = useState(false);
  const [errorMsg, setErrorMsg]             = useState('');
  const [isDirty, setIsDirty]               = useState(false);

  // Form states
  const [confThreshold, setConfThreshold]   = useState(0.45);
  const [targetFps, setTargetFps]           = useState(30);
  const [motionEnabled, setMotionEnabled]   = useState(true);
  const [sensitivity, setSensitivity]       = useState(500);
  const [cooldown, setCooldown]             = useState(30);
  const [selectedClasses, setSelectedClasses] = useState(['person', 'car', 'truck', 'motorcycle', 'backpack']);

  // Track initial values for dirty detection
  const originalRef = useRef(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/config', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch config');

      const c = data.config || {};
      const conf = c.detection?.confidence_threshold ?? 0.45;
      const fps  = c.fps ?? 30;
      const mot  = c.motion?.enabled ?? true;
      const sens = c.motion?.sensitivity ?? 500;
      const cool = c.alerts?.cooldown_seconds ?? 30;
      const cls  = c.detection?.target_classes || ['person', 'car', 'truck', 'motorcycle', 'backpack'];

      setConfThreshold(conf);
      setTargetFps(fps);
      setMotionEnabled(mot);
      setSensitivity(sens);
      setCooldown(cool);
      setSelectedClasses(cls);

      originalRef.current = { confThreshold: conf, targetFps: fps, motionEnabled: mot, sensitivity: sens, cooldown: cool, selectedClasses: cls };
      setConfig(c);
      setIsDirty(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  // Dirty check
  useEffect(() => {
    if (!originalRef.current) return;
    const orig = originalRef.current;
    const changed =
      Math.abs(parseFloat(confThreshold) - orig.confThreshold) > 0.001 ||
      parseInt(targetFps) !== orig.targetFps ||
      motionEnabled !== orig.motionEnabled ||
      parseInt(sensitivity) !== orig.sensitivity ||
      parseInt(cooldown) !== orig.cooldown ||
      JSON.stringify(selectedClasses.sort()) !== JSON.stringify([...orig.selectedClasses].sort());
    setIsDirty(changed);
  }, [confThreshold, targetFps, motionEnabled, sensitivity, cooldown, selectedClasses]);

  const handleClassToggle = (id) => {
    setSelectedClasses(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fps:       parseInt(targetFps),
          detection: { confidence_threshold: parseFloat(confThreshold), target_classes: selectedClasses },
          motion:    { enabled: motionEnabled, sensitivity: parseInt(sensitivity, 10) },
          alerts:    { cooldown_seconds: parseInt(cooldown, 10) },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save settings');
      setSaveSuccess(true);
      setIsDirty(false);
      originalRef.current = { confThreshold: parseFloat(confThreshold), targetFps: parseInt(targetFps), motionEnabled, sensitivity: parseInt(sensitivity), cooldown: parseInt(cooldown), selectedClasses };
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center font-mono text-cyan-400">
      <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-3" />
      <p className="text-xs tracking-widest text-[var(--text-muted)]">LOADING SYSTEM CONFIGURATION...</p>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl animate-fade-in">
      <SaveToast show={saveSuccess} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-display font-bold text-white uppercase tracking-wider flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <SettingsIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <span>System Settings</span>
            {isDirty && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-normal text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/40">
                <Dot className="w-3 h-3 text-amber-400 animate-pulse" />
                Unsaved changes
              </span>
            )}
          </h1>
          <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] font-mono mt-0.5 sm:mt-1">
            Tune AI detection thresholds, frame rates, and alert rules — applied live to CV Engine.
          </p>
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="p-3.5 sm:p-4 rounded-xl border border-red-500/40 text-red-400 font-mono text-xs flex items-center gap-3"
             style={{ background: 'rgba(127,29,29,0.3)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <div>
            <div>{errorMsg}</div>
            <button onClick={fetchConfig} className="mt-1 text-cyan-400 underline font-bold">Retry loading config</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
        {/* Section 1: YOLOv8 Detection */}
        <Section icon={Cpu} title="YOLOv8 Object Detection Tuning" accent="cyan">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <SliderRow
              label="Confidence Threshold"
              value={parseFloat(confThreshold)}
              display={`${Math.round(confThreshold * 100)}%`}
              min={0.1} max={0.9} step={0.05}
              onChange={setConfThreshold}
              accent="cyan"
              hint="Higher = fewer false positives. Lower = detects smaller objects."
            />
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                Target Frame Rate (FPS)
              </label>
              <select
                value={targetFps}
                onChange={e => setTargetFps(e.target.value)}
                className="cyber-input w-full"
                style={{ cursor: 'pointer' }}
              >
                <option value={15}>15 FPS — Power Saver</option>
                <option value={20}>20 FPS — Standard</option>
                <option value={30}>30 FPS — High Performance (GPU)</option>
                <option value={60}>60 FPS — Ultra Smooth</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-2.5 sm:mb-3 uppercase tracking-wider">
              Detection Target Classes
              <span className="ml-2 text-cyan-400 font-bold">({selectedClasses.length} active)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableClasses.map(item => (
                <ClassChip
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  selected={selectedClasses.includes(item.id)}
                  onToggle={handleClassToggle}
                />
              ))}
            </div>
          </div>
        </Section>

        {/* Section 2: Motion Gatekeeper */}
        <Section icon={Activity} title="MOG2 Motion Pre-Filter Gatekeeper" accent="emerald">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <CyberToggle
              checked={motionEnabled}
              onChange={setMotionEnabled}
              label="MOG2 Motion Gatekeeper"
              sub='Disable for "Paranoid Mode" — runs YOLO on every frame'
            />
            <SliderRow
              label="Motion Sensitivity Threshold"
              value={parseInt(sensitivity)}
              display={`${sensitivity} px²`}
              min={100} max={2000} step={50}
              onChange={setSensitivity}
              accent="emerald"
              hint="Lower px² = higher sensitivity to subtle movement."
            />
          </div>
        </Section>

        {/* Section 3: Alerts */}
        <Section icon={Bell} title="Alerts & Cooldown Rules" accent="amber">
          <div className="max-w-sm">
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
              Alert Cooldown Period (Seconds)
            </label>
            <input
              type="number"
              min={5} max={300}
              value={cooldown}
              onChange={e => setCooldown(e.target.value)}
              className="cyber-input w-full"
              style={{ maxWidth: '180px' }}
            />
            <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1.5 sm:mt-2">
              Minimum seconds between duplicate alert notifications to prevent flooding.
            </p>
          </div>
        </Section>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto relative px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-mono text-xs font-bold uppercase tracking-widest text-white overflow-hidden transition-all duration-200 disabled:opacity-50 group flex items-center justify-center"
            style={{
              background: isDirty
                ? 'linear-gradient(135deg, #00b8d9, #7c3aed)'
                : 'linear-gradient(135deg, #1e3152, #1e3152)',
              boxShadow: isDirty ? '0 4px 20px rgba(0,212,255,0.3)' : 'none',
              border: isDirty ? '1px solid rgba(0,212,255,0.3)' : '1px solid var(--border-base)',
            }}
          >
            {/* Shimmer */}
            {!saving && isDirty && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            )}
            <span className="relative flex items-center gap-2">
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SAVING CONFIGURATION...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  SAVE &amp; APPLY SETTINGS LIVE
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Sliders, Cpu, Activity, Bell, Check, AlertCircle } from 'lucide-react';

const Settings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [confThreshold, setConfThreshold] = useState(0.5);
  const [targetFps, setTargetFps] = useState(30);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState(500);
  const [cooldown, setCooldown] = useState(15);
  const [selectedClasses, setSelectedClasses] = useState([]);

  const availableClasses = [
    { id: 'person', label: 'Persons / Humans' },
    { id: 'car', label: 'Cars' },
    { id: 'truck', label: 'Trucks' },
    { id: 'bus', label: 'Buses' },
    { id: 'motorcycle', label: 'Motorcycles' },
    { id: 'bicycle', label: 'Bicycles' },
    { id: 'dog', label: 'Dogs' },
    { id: 'cat', label: 'Cats' },
    { id: 'backpack', label: 'Backpacks' },
    { id: 'suitcase', label: 'Suitcases' },
    { id: 'handbag', label: 'Handbags' },
  ];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/config', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success && data.config) {
        setConfig(data.config);
        setConfThreshold(data.config.detection?.confidence_threshold || 0.5);
        setTargetFps(data.config.cameras?.[0]?.fps || 30);
        setMotionEnabled(data.config.motion?.enabled ?? true);
        setSensitivity(data.config.motion?.sensitivity || 500);
        setCooldown(data.config.alerts?.cooldown_seconds || 15);
        setSelectedClasses(data.config.detection?.target_classes || []);
      } else {
        throw new Error(data.error || `Server returned HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setErrorMsg(err.message || 'Failed to fetch settings from backend');
    } finally {
      setLoading(false);
    }
  };

  const handleClassToggle = (clsId) => {
    if (selectedClasses.includes(clsId)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== clsId));
    } else {
      setSelectedClasses([...selectedClasses, clsId]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg('');

    const updatedPayload = {
      fps: targetFps,
      detection: {
        confidence_threshold: parseFloat(confThreshold),
        target_classes: selectedClasses
      },
      motion: {
        enabled: motionEnabled,
        sensitivity: parseInt(sensitivity, 10)
      },
      alerts: {
        cooldown_seconds: parseInt(cooldown, 10)
      }
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedPayload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center font-mono text-cyan-400">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-3"></div>
        <p className="text-xs">LOADING SYSTEM CONFIGURATION...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-cyan-400" />
            LIVE SYSTEM SETTINGS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Tune AI detection thresholds, frame rates, and alert rules live from the UI.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-400 font-mono text-xs flex items-center gap-3 animate-pulse">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>Configuration saved successfully! Applied live to Python CV Engine.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/80 text-red-400 font-mono text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <div>{errorMsg}</div>
            <button onClick={fetchConfig} className="mt-2 text-cyan-400 underline font-bold">
              Click to retry loading configuration
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: AI Detection Tuning */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-mono font-bold text-white uppercase">YOLOv8 Object Detection Tuning</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2 font-mono text-xs">
                <label className="text-slate-300">Confidence Threshold</label>
                <span className="text-cyan-400 font-bold">{Math.round(confThreshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(e.target.value)}
                className="w-full accent-cyan-500 bg-slate-900 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Higher threshold reduces false positives; lower threshold detects smaller objects.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2">Target Camera Frame Rate (FPS)</label>
              <select
                value={targetFps}
                onChange={(e) => setTargetFps(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-cyan-500"
              >
                <option value={15}>15 FPS (Power Saver)</option>
                <option value={20}>20 FPS (Standard)</option>
                <option value={30}>30 FPS (High Performance — GPU Recommended)</option>
                <option value={60}>60 FPS (Ultra Smooth)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-3">Target Object Detection Classes</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 font-mono text-xs">
              {availableClasses.map((item) => (
                <label
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    selectedClasses.includes(item.id)
                      ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(item.id)}
                    onChange={() => handleClassToggle(item.id)}
                    className="accent-cyan-500 w-4 h-4 rounded"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Motion Detection Pre-Filter */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-mono font-bold text-white uppercase">MOG2 Motion Pre-Filter Gatekeeper</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
              <div>
                <div className="text-slate-200 font-bold">MOG2 Motion Gatekeeper</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Disable for "Paranoid Mode" (run YOLO on every frame)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMotionEnabled(!motionEnabled)}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  motionEnabled ? 'bg-cyan-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    motionEnabled ? 'right-1' : 'left-1'
                  }`}
                ></div>
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 font-mono text-xs">
                <label className="text-slate-300">Motion Sensitivity Threshold</label>
                <span className="text-emerald-400 font-bold">{sensitivity} px²</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value)}
                className="w-full accent-emerald-500 bg-slate-900 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Lower pixels² = higher sensitivity to subtle movement.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Alerts Cooldown */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-mono font-bold text-white uppercase">Alerts & Cooldown Rules</h2>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2">Alert Cooldown Cooldown Period (Seconds)</label>
            <input
              type="number"
              min="5"
              max="300"
              value={cooldown}
              onChange={(e) => setCooldown(e.target.value)}
              className="w-48 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Minimum seconds to wait between duplicate alert notifications to prevent alert flooding.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-widest shadow-xl shadow-cyan-950/50 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <span>SAVING CONFIGURATION...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>SAVE & APPLY SETTINGS LIVE</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

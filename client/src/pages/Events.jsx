import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Clock, 
  MapPin, 
  Search, 
  Download, 
  RefreshCw, 
  Trash2, 
  FileText, 
  Eye, 
  X,
  Layers,
  Filter
} from 'lucide-react';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/zones/events?limit=250', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to load threat event logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all historical threat logs?')) return;
    try {
      setClearing(true);
      await fetch('/api/zones/events', { method: 'DELETE', credentials: 'include' });
      setEvents([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setClearing(false);
    }
  };

  const handleExportCSV = () => {
    if (events.length === 0) return;

    const headers = ['ID', 'Timestamp', 'Threat Level', 'Object', 'Track ID', 'Confidence', 'Zone', 'Dwell Seconds', 'Reason'];
    const rows = events.map(e => [
      e.id,
      `"${e.timestamp}"`,
      e.threat_level,
      e.object_class,
      e.track_id,
      e.confidence,
      `"${e.zone_name}"`,
      e.metadata ? (JSON.parse(e.metadata || '{}').dwell_seconds || 0) : 0,
      `"${(JSON.parse(e.metadata || '{}').threat_reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `surveillance_threat_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeStyle = (level) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-950/90 text-red-300 border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.3)]',
          icon: ShieldAlert,
          dot: 'bg-red-500'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-950/90 text-amber-300 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
          icon: AlertTriangle,
          dot: 'bg-amber-500'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/60',
          icon: AlertCircle,
          dot: 'bg-yellow-400'
        };
      default:
        return {
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60',
          icon: Info,
          dot: 'bg-emerald-400'
        };
    }
  };

  // Filtered list based on search query and severity pill
  const filteredEvents = events.filter(e => {
    const matchesSeverity = selectedSeverity === 'ALL' || e.threat_level === selectedSeverity;
    const term = searchTerm.toLowerCase();
    const parsedMeta = e.metadata ? (typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata) : {};
    const reason = (parsedMeta.threat_reason || '').toLowerCase();
    const zone = (e.zone_name || '').toLowerCase();
    const cls = (e.object_class || '').toLowerCase();
    const track = String(e.track_id || '');

    const matchesSearch = !term || zone.includes(term) || cls.includes(term) || track.includes(term) || reason.includes(term);
    return matchesSeverity && matchesSearch;
  });

  const criticalCount = events.filter(e => e.threat_level === 'CRITICAL').length;
  const highCount = events.filter(e => e.threat_level === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            SECURITY THREAT & INCIDENT AUDIT LOGS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Forensic database records of real-time perimeter breaches, spatial containment triggers, and dwell-time loitering events.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-2 transition-all shadow-md"
            title="Refresh latest event logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>REFRESH</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={events.length === 0}
            className="px-3.5 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/80 hover:bg-cyan-900/90 text-cyan-300 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-950/40"
            title="Export full log to CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handleClearLogs}
            disabled={clearing || events.length === 0}
            className="px-3 py-2 rounded-xl bg-red-950/60 border border-red-800/80 hover:bg-red-900/80 text-red-300 font-mono text-xs flex items-center gap-1.5 transition-all"
            title="Clear all event logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Counters Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center justify-between mb-1.5">
            <span>TOTAL RECORDED EVENTS</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{events.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Logged in Embedded Database</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center justify-between mb-1.5">
            <span>CRITICAL BREACHES</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Restricted Zone Intrusions</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center justify-between mb-1.5">
            <span>HIGH THREAT LOITERING</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{highCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Dwell Time &gt; 30s Triggers</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center justify-between mb-1.5">
            <span>AUDIT INTEGRITY</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">100% PERSISTENT</div>
          <div className="text-[10px] text-slate-500 mt-1">Non-Volatile Storage</div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono text-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by zone, object class, track ID, or reason..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 outline-none text-xs"
          />
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-slate-500 text-[11px] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> SEVERITY:
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedSeverity(lvl)}
              className={`px-3 py-1.5 rounded-lg border font-bold transition-all text-[11px] ${
                selectedSeverity === lvl
                  ? lvl === 'CRITICAL'
                    ? 'bg-red-950 border-red-500 text-red-300'
                    : lvl === 'HIGH'
                    ? 'bg-amber-950 border-amber-500 text-amber-300'
                    : 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Events Table Container */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden font-mono shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <th className="py-3.5 px-4 font-semibold">INCIDENT ID</th>
                <th className="py-3.5 px-4 font-semibold">TIMESTAMP</th>
                <th className="py-3.5 px-4 font-semibold">SEVERITY</th>
                <th className="py-3.5 px-4 font-semibold">TARGET OBJECT</th>
                <th className="py-3.5 px-4 font-semibold">ZONE</th>
                <th className="py-3.5 px-4 font-semibold">BREACH REASON / DESCRIPTION</th>
                <th className="py-3.5 px-4 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                    <span>Loading forensic event logs from database...</span>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <Info className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                    <span>No threat incidents match the selected filter.</span>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  const style = getBadgeStyle(evt.threat_level);
                  const parsedMeta = evt.metadata
                    ? (typeof evt.metadata === 'string' ? JSON.parse(evt.metadata) : evt.metadata)
                    : {};
                  const reason = parsedMeta.threat_reason || 'Zone breach evaluated';
                  const dwell = parsedMeta.dwell_seconds || 0;

                  return (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedEvent({ ...evt, metadata: parsedMeta })}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-bold text-slate-400 group-hover:text-cyan-400">
                        #{evt.id}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        {evt.timestamp ? evt.timestamp.replace('T', ' ').slice(0, 19) : '--'}
                      </td>

                      {/* Severity Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold ${style.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                          {evt.threat_level}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200 uppercase flex items-center gap-1.5">
                          <span>{evt.object_class}</span>
                          {evt.track_id !== -1 && (
                            <span className="text-cyan-400 text-[10px]">#{evt.track_id}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {Math.round(evt.confidence * 100)}% Confidence
                        </div>
                      </td>

                      {/* Zone */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{evt.zone_name}</span>
                        </div>
                        {dwell > 0 && (
                          <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Dwell: {dwell}s</span>
                          </div>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {reason}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent({ ...evt, metadata: parsedMeta });
                          }}
                          className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-400 hover:text-cyan-300 text-[11px] inline-flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          <span>DETAILS</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Results Info */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            Showing <strong className="text-white">{filteredEvents.length}</strong> of{' '}
            <strong className="text-white">{events.length}</strong> incidents
          </div>
          <div>Database Source: <span className="text-cyan-400">data/surveillance.json</span></div>
        </div>
      </div>

      {/* Forensic Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
          <div className="glass-panel max-w-xl w-full rounded-2xl border border-cyan-500/60 shadow-[0_0_50px_rgba(6,182,212,0.2)] p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase">
                  FORENSIC INCIDENT INSPECTOR [#{selectedEvent.id}]
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">THREAT SEVERITY</span>
                <span className="font-bold text-white text-sm">{selectedEvent.threat_level}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TARGET CLASSIFICATION</span>
                <span className="font-bold text-white text-sm uppercase">
                  {selectedEvent.object_class} (Track #{selectedEvent.track_id})
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">ZONE IDENTIFIER</span>
                <span className="font-bold text-cyan-400 text-sm">{selectedEvent.zone_name}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CAMERA SOURCE</span>
                <span className="font-bold text-white text-sm">Camera #{selectedEvent.camera_id}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px] mb-1">INCIDENT DESCRIPTION</span>
              <p className="text-slate-200 font-semibold">
                {selectedEvent.metadata?.threat_reason || 'Breach trigger registered by spatial threat engine.'}
              </p>
            </div>

            {selectedEvent.metadata?.bbox && (
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                <span className="text-slate-500 block text-[10px] mb-1">BOUNDING BOX CO-ORDINATES (PIXELS)</span>
                <p className="text-cyan-400 font-bold">
                  [X1: {selectedEvent.metadata.bbox[0]}, Y1: {selectedEvent.metadata.bbox[1]}, X2: {selectedEvent.metadata.bbox[2]}, Y2: {selectedEvent.metadata.bbox[3]}]
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono transition-all"
              >
                CLOSE INSPECTOR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;

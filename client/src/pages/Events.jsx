import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, AlertTriangle, AlertCircle, Info,
  Clock, MapPin, Search, Download, RefreshCw, Trash2,
  FileText, Eye, X, ChevronUp, ChevronDown
} from 'lucide-react';

/* ---- Threat badge configs ---- */
const badgeCfg = {
  CRITICAL: { cls: 'threat-badge threat-badge-critical', icon: ShieldAlert, dot: '#ff3a3a' },
  HIGH:     { cls: 'threat-badge threat-badge-high',     icon: AlertTriangle, dot: '#ff9500' },
  MEDIUM:   { cls: 'threat-badge threat-badge-medium',   icon: AlertCircle,   dot: '#ffd60a' },
  LOW:      { cls: 'threat-badge threat-badge-low',       icon: Info,          dot: '#00e676' },
};

/* ---- Confirm Modal ---- */
const ConfirmModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative glass-card rounded-2xl p-6 max-w-sm w-full animate-slide-in-up"
         style={{ border: '1px solid rgba(255,58,58,0.3)', boxShadow: '0 0 40px rgba(255,58,58,0.15)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: 'rgba(255,58,58,0.12)', border: '1px solid rgba(255,58,58,0.3)' }}>
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-sm font-mono font-bold text-white">Confirm Clear Logs</h3>
          <p className="text-[10px] font-mono text-[var(--text-muted)]">This action is irreversible</p>
        </div>
      </div>
      <p className="text-xs font-mono text-[var(--text-secondary)] mb-5">
        All historical threat audit logs will be permanently deleted from the embedded database.
        Are you sure you want to proceed?
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-[var(--border-base)] text-[var(--text-secondary)] hover:text-white font-mono text-xs font-bold transition-all"
          style={{ background: 'rgba(15,26,48,0.8)' }}>
          CANCEL
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl font-mono text-xs font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)', border: '1px solid rgba(255,58,58,0.5)', boxShadow: '0 0 20px rgba(255,58,58,0.2)' }}>
          CLEAR ALL LOGS
        </button>
      </div>
    </div>
  </div>
);

/* ---- Event Detail Modal ---- */
const EventDetailModal = ({ event, onClose }) => {
  if (!event) return null;
  const meta = event.metadata ? (typeof event.metadata === 'string' ? JSON.parse(event.metadata) : event.metadata) : {};
  const cfg = badgeCfg[event.threat_level] || badgeCfg.LOW;
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-card rounded-2xl overflow-hidden animate-slide-in-up"
           style={{ border: '1px solid var(--border-base)', boxShadow: '0 0 40px rgba(0,0,0,0.6)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]"
             style={{ background: 'rgba(6,11,24,0.6)' }}>
          <div className="flex items-center gap-3">
            <span className={cfg.cls}><Icon className="w-3 h-3" />{event.threat_level}</span>
            <span className="text-sm font-display font-bold text-white uppercase tracking-wider">{event.object_class}</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg border border-[var(--border-base)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-[var(--border-base)] transition-all"
            style={{ background: 'rgba(15,26,48,0.8)' }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 font-mono text-xs">
          {meta.threat_reason && (
            <div className="p-3.5 rounded-xl border border-[var(--border-subtle)]"
                 style={{ background: 'rgba(0,212,255,0.04)' }}>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Threat Reason</p>
              <p className="text-[var(--text-primary)] font-semibold leading-relaxed">{meta.threat_reason}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Timestamp',   value: event.timestamp },
              { label: 'Zone',        value: event.zone_name,    icon: MapPin },
              { label: 'Track ID',    value: `#${event.track_id}` },
              { label: 'Confidence',  value: event.confidence != null ? `${(event.confidence * 100).toFixed(0)}%` : 'N/A' },
              { label: 'Dwell Time',  value: meta.dwell_seconds ? `${meta.dwell_seconds}s` : '—', icon: Clock },
              { label: 'Zone Type',   value: event.zone_type || meta.zone_type || '—' },
            ].map(({ label, value, icon: ItemIcon }) => (
              <div key={label} className="p-2.5 rounded-lg border border-[var(--border-subtle)]"
                   style={{ background: 'rgba(15,26,48,0.5)' }}>
                <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
                <p className="text-[var(--text-primary)] font-bold flex items-center gap-1">
                  {ItemIcon && <ItemIcon className="w-3 h-3 text-cyan-400" />}
                  {value ?? '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---- Stat Card ---- */
const MiniStat = ({ label, value, icon: Icon, color }) => (
  <div className="neon-card rounded-xl p-4" style={{ borderLeft: `3px solid ${color}` }}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)]">{label}</span>
      <Icon className="w-3.5 h-3.5" style={{ color }} />
    </div>
    <div className="text-xl font-display font-bold" style={{ color }}>{value}</div>
  </div>
);

/* ---- Sort icon ---- */
const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
  return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-cyan-400" /> : <ChevronDown className="w-3 h-3 text-cyan-400" />;
};

/* ---- SEVERITY PILLS ---- */
const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const pillColors = {
  ALL:      { active: 'bg-[var(--bg-elevated)] border-[var(--cyan-400)] text-[var(--cyan-400)]',     inactive: 'text-[var(--text-muted)]' },
  CRITICAL: { active: 'bg-red-950/80 border-red-500 text-red-300',       inactive: 'text-[var(--text-muted)]' },
  HIGH:     { active: 'bg-amber-950/80 border-amber-500 text-amber-300', inactive: 'text-[var(--text-muted)]' },
  MEDIUM:   { active: 'bg-yellow-950/80 border-yellow-500 text-yellow-300', inactive: 'text-[var(--text-muted)]' },
  LOW:      { active: 'bg-emerald-950/80 border-emerald-500 text-emerald-300', inactive: 'text-[var(--text-muted)]' },
};

/* ============================================================
   EVENTS PAGE
   ============================================================ */
const Events = () => {
  const [events, setEvents]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedSeverity, setSeverity] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing]         = useState(false);
  const [sortField, setSortField]       = useState('timestamp');
  const [sortDir, setSortDir]           = useState('desc');

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch('/api/zones/events?limit=250', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.events)) setEvents(data.events);
    } catch (err) {
      console.error('Failed to load threat event logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleClearLogs = async () => {
    try {
      setClearing(true);
      await fetch('/api/zones/events', { method: 'DELETE', credentials: 'include' });
      setEvents([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setClearing(false);
      setShowClearConfirm(false);
    }
  };

  const handleExportCSV = () => {
    if (!events.length) return;
    const headers = ['ID', 'Timestamp', 'Threat Level', 'Object', 'Track ID', 'Confidence', 'Zone', 'Dwell Seconds', 'Reason'];
    const rows = events.map(e => {
      const m = e.metadata ? (typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata) : {};
      return [e.id, `"${e.timestamp}"`, e.threat_level, e.object_class, e.track_id, e.confidence,
              `"${e.zone_name}"`, m.dwell_seconds || 0, `"${(m.threat_reason || '').replace(/"/g, '""')}"`];
    });
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `hawkeye_audit_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* Counts */
  const criticalCount = events.filter(e => e.threat_level === 'CRITICAL').length;
  const highCount     = events.filter(e => e.threat_level === 'HIGH').length;
  const lowCount      = events.filter(e => e.threat_level === 'LOW').length;

  /* Filter + Sort */
  const filtered = events
    .filter(e => {
      const matchSev = selectedSeverity === 'ALL' || e.threat_level === selectedSeverity;
      const term = searchTerm.toLowerCase();
      const m = e.metadata ? (typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata) : {};
      const matchSearch = !term
        || (e.zone_name || '').toLowerCase().includes(term)
        || (e.object_class || '').toLowerCase().includes(term)
        || String(e.track_id).includes(term)
        || (m.threat_reason || '').toLowerCase().includes(term);
      return matchSev && matchSearch;
    })
    .sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const columns = [
    { key: 'timestamp',    label: 'TIMESTAMP',  sortable: true,  width: 'w-36' },
    { key: 'threat_level', label: 'SEVERITY',   sortable: true,  width: 'w-28' },
    { key: 'object_class', label: 'OBJECT',     sortable: true,  width: 'w-24' },
    { key: 'track_id',     label: 'TRACK#',     sortable: false, width: 'w-16' },
    { key: 'zone_name',    label: 'ZONE',       sortable: true,  width: 'w-32' },
    { key: 'confidence',   label: 'CONF.',      sortable: true,  width: 'w-16' },
    { key: '_reason',      label: 'REASON',     sortable: false, width: '' },
    { key: '_actions',     label: '',           sortable: false, width: 'w-12' },
  ];

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center font-mono text-cyan-400">
      <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-3" />
      <p className="text-xs tracking-widest text-[var(--text-muted)]">LOADING THREAT AUDIT DATABASE...</p>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Modals */}
      {showClearConfirm && <ConfirmModal onConfirm={handleClearLogs} onCancel={() => setShowClearConfirm(false)} />}
      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            Threat Audit Logs
          </h1>
          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-1">
            Forensic database of perimeter breaches, zone triggers, and dwell-time loitering events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchEvents} disabled={loading}
            className="px-3 py-2 rounded-xl border border-[var(--border-base)] text-[var(--text-secondary)] hover:text-white hover:border-cyan-500/50 font-mono text-xs flex items-center gap-2 transition-all"
            style={{ background: 'rgba(15,26,48,0.8)' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            REFRESH
          </button>
          <button onClick={handleExportCSV} disabled={!events.length}
            className="px-3 py-2 rounded-xl font-mono text-xs font-bold text-cyan-300 flex items-center gap-2 transition-all disabled:opacity-40"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.35)' }}>
            <Download className="w-3.5 h-3.5" />
            EXPORT CSV
          </button>
          <button onClick={() => setShowClearConfirm(true)} disabled={clearing || !events.length}
            className="px-3 py-2 rounded-xl font-mono text-xs text-red-300 flex items-center gap-1.5 transition-all disabled:opacity-40"
            style={{ background: 'rgba(255,58,58,0.08)', border: '1px solid rgba(255,58,58,0.3)' }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Total Events"   value={events.length}  icon={FileText}    color="var(--cyan-400)" />
        <MiniStat label="Critical"       value={criticalCount}  icon={ShieldAlert} color="var(--threat-critical)" />
        <MiniStat label="High Priority"  value={highCount}      icon={AlertTriangle} color="var(--threat-high)" />
        <MiniStat label="Low / Safe"     value={lowCount}       icon={Info}        color="var(--threat-low)" />
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl px-4 py-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3 border border-[var(--border-subtle)]">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search zone, class, reason, track#..."
            className="cyber-input pl-9 text-[12px]"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Severity pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {severities.map(s => {
            const c = pillColors[s];
            const isActive = selectedSeverity === s;
            return (
              <button key={s} onClick={() => setSeverity(s)}
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border transition-all duration-150
                  ${isActive ? c.active : `${c.inactive} border-[var(--border-subtle)] hover:border-[var(--border-base)] hover:text-white`}`}>
                {s}
                {s !== 'ALL' && (
                  <span className="ml-1 opacity-70">
                    ({events.filter(e => e.threat_level === s).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
        {/* Sticky header */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono border-collapse">
            <thead>
              <tr style={{ background: 'rgba(6,11,24,0.9)' }}>
                {columns.map(col => (
                  <th key={col.key}
                    className={`${col.width} px-4 py-3.5 text-left text-[9px] uppercase tracking-[0.15em] text-[var(--text-muted)] border-b border-[var(--border-subtle)] whitespace-nowrap
                      ${col.sortable ? 'cursor-pointer hover:text-cyan-400 select-none' : ''}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--text-muted)] text-xs">
                    <Info className="w-8 h-8 mx-auto mb-2 text-[var(--border-base)]" />
                    {searchTerm || selectedSeverity !== 'ALL'
                      ? 'No events match your current filters.'
                      : 'No threat events recorded yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((evt, idx) => {
                  const cfg = badgeCfg[evt.threat_level] || badgeCfg.LOW;
                  const Icon = cfg.icon;
                  const m = evt.metadata ? (typeof evt.metadata === 'string' ? JSON.parse(evt.metadata) : evt.metadata) : {};
                  const isEven = idx % 2 === 0;

                  return (
                    <tr key={evt.id || idx}
                      className="group border-b border-[var(--border-subtle)] transition-all duration-150 hover:bg-cyan-950/10 cursor-pointer"
                      style={{ background: isEven ? 'rgba(11,18,37,0.4)' : 'transparent' }}
                      onClick={() => setSelectedEvent(evt)}
                    >
                      <td className="px-4 py-3 text-[var(--text-muted)] tabular-nums whitespace-nowrap">{evt.timestamp}</td>
                      <td className="px-4 py-3">
                        <span className={cfg.cls}>
                          <Icon className="w-3 h-3" />{evt.threat_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-primary)] font-bold uppercase">{evt.object_class}</td>
                      <td className="px-4 py-3 text-cyan-400 font-bold">#{evt.track_id}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">{evt.zone_name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {evt.confidence != null ? `${(evt.confidence * 100).toFixed(0)}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[200px]">
                        <span className="block truncate">{m.threat_reason || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-muted)] group-hover:text-cyan-400 transition-colors"
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                          title="View full details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]"
             style={{ background: 'rgba(6,11,24,0.5)' }}>
          <span>Showing <strong className="text-[var(--text-secondary)]">{filtered.length}</strong> of <strong className="text-[var(--text-secondary)]">{events.length}</strong> events</span>
          <span className="text-[var(--text-muted)]">Click any row to view full details</span>
        </div>
      </div>
    </div>
  );
};

export default Events;

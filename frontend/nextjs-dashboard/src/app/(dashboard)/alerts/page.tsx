'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  AlertTriangle, Shield, Search, Filter, ChevronRight, Copy, Activity, Download, Bot
} from 'lucide-react';
import AICopilot from '@/components/AICopilot';
import { useAlertContext, Alert } from '@/contexts/AlertContext';

const SOC_LEVEL_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'SOC Level 1 - Stable', value: 'SOC Level 1 - Stable' },
  { label: 'SOC Level 2 - High Risk', value: 'SOC Level 2 - High Risk' },
  { label: 'SOC Level 3 - Critical Threat', value: 'SOC Level 3 - Critical Threat' },
] as const;

type SocLevelOption = (typeof SOC_LEVEL_OPTIONS)[number]['value'];

const TIME_FILTER_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'Last 1 hour', value: 'LAST_1H' },
  { label: 'Last 24 hours', value: 'LAST_24H' },
] as const;

type TimeFilterOption = (typeof TIME_FILTER_OPTIONS)[number]['value'];

function computeThreatScore(alert: Pick<Alert, 'cve_id' | 'severity' | 'threat_score'>): number {
  if (typeof alert.threat_score === 'number' && Number.isFinite(alert.threat_score)) return alert.threat_score;
  const baseSeverity = typeof alert.severity === 'number' && Number.isFinite(alert.severity) ? alert.severity : 0;
  return baseSeverity + (alert.cve_id === 'ML-ANOMALY' ? 1 : 0);
}

function computeSocLevel(threatScore: number): Exclude<SocLevelOption, 'ALL'> {
  if (threatScore >= 9) return 'SOC Level 3 - Critical Threat';
  if (threatScore >= 7) return 'SOC Level 2 - High Risk';
  return 'SOC Level 1 - Stable';
}

function parseLogTimestamp(log: string): Date | null {
  if (typeof log !== 'string' || log.length < 19) return null;
  const date = new Date(log.slice(0, 19).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function AlertsPage() {
  const { alerts, fetchAlerts, isLoading } = useAlertContext();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<SocLevelOption>('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('ALL');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [alertsPerPage] = useState<number>(10);

  const closeModal = () => { setIsOpen(false); setSelectedAlert(null); };

  const copyToClipboard = useCallback(async (value: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      if (copiedTimeoutRef.current !== null) window.clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = window.setTimeout(() => setCopiedField(null), 1200);
    } catch (err) { console.error("Clipboard error", err); }
  }, []);

  useEffect(() => { 
    if (alerts.length === 0 && !isLoading) void fetchAlerts(); 
  }, [fetchAlerts, alerts.length, isLoading]);

  const filteredAlerts = alerts.filter((alert) => {
    const safeLog = alert.log || '';
    const matchesSearch = alert.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          safeLog.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || alert.soc_level === filter;
    const matchesTime = (() => {
      if (timeFilter === 'ALL') return true;
      const ts = parseLogTimestamp(safeLog);
      if (!ts) return false;
      const windowMs = timeFilter === 'LAST_1H' ? 3600000 : 86400000;
      return (Date.now() - ts.getTime()) <= windowMs;
    })();
    return matchesSearch && matchesFilter && matchesTime;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const valA = a.severity ?? 0;
    const valB = b.severity ?? 0;
    return sortOrder === 'DESC' ? valB - valA : valA - valB;
  });

  const indexOfLast = currentPage * alertsPerPage;
  const indexOfFirst = indexOfLast - alertsPerPage;
  const currentAlerts = sortedAlerts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedAlerts.length / alertsPerPage) || 1;

  const exportCSV = () => {
    const header = ['CVE_ID', 'Log', 'Severity', 'SOC_Level', 'Threat_Score'];
    const rows = sortedAlerts.map(a => [`"${a.cve_id}"`, `"${(a.log || '').replace(/"/g, '""')}"`, a.severity, `"${a.soc_level}"`, a.threat_score].join(','));
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `security_alerts_${new Date().getTime()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-2">
            Security <span className="text-violet-400">Alerts</span>
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-500" />
            Supervision temps réel des menaces
          </p>
        </div>
        
        <div className="bg-[#0a0a0a]/50 backdrop-blur-xl rounded-2xl border border-white/[0.05] p-3 flex flex-wrap gap-4 items-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[50px] pointer-events-none" />
          
          <div className="relative group z-10 w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
            <input 
              type="text" placeholder="Rechercher une CVE ou IP..." 
              className="w-full pl-10 pr-4 py-2.5 bg-[#030303] border border-white/[0.05] text-white rounded-xl text-xs font-medium focus:border-violet-500/50 outline-none transition-all placeholder:text-zinc-600"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="px-4 py-2.5 bg-[#030303] border border-white/[0.05] text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-widest outline-none z-10 cursor-pointer focus:border-violet-500/50 transition-all custom-select"
            value={filter} onChange={(e) => setFilter(e.target.value as SocLevelOption)}
          >
            {SOC_LEVEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-[#0a0a0a] text-zinc-300">{opt.label}</option>)}
          </select>

          <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] text-zinc-300 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all z-10 hover:border-violet-500/30">
            <Download className="w-4 h-4 text-violet-400" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#0a0a0a]/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/[0.05] overflow-hidden relative">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 blur-[80px]" />
        
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 relative z-10">
            <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Scan du réseau en cours...</span>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="min-w-full divide-y divide-white/[0.05]">
              <thead className="bg-white/[0.02]">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">Indicateur</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">Contexte / Log</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">Score de Menace</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {currentAlerts.map((alert, idx) => (
                  <tr key={`${alert.cve_id}-${idx}`} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${
                          alert.cve_id === 'ML-ANOMALY' 
                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-orange-500/10' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/10'
                        }`}>
                          {alert.cve_id === 'ML-ANOMALY' ? <Activity className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                        </div>
                        <span className="font-mono font-bold text-sm text-white group-hover:text-violet-300 transition-colors">{alert.cve_id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-md">
                      <p className="truncate text-xs font-medium text-zinc-400">{alert.log}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-lg text-xs font-black border ${
                        alert.threat_score! >= 7 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]'
                      }`}>
                        {alert.threat_score}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => { setSelectedAlert(alert); setIsOpen(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-violet-500 hover:border-violet-500 text-zinc-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_-3px_transparent] hover:shadow-[0_0_15px_-3px_rgba(139,92,246,0.4)]"
                      >
                        Inspecter <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-4 py-8 relative z-10">
        <button 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage(p => p - 1)} 
          className="px-5 py-2.5 bg-[#0a0a0a]/50 backdrop-blur-xl border border-white/[0.05] rounded-xl font-bold uppercase tracking-widest text-[10px] text-zinc-400 hover:bg-white/[0.05] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Précédent
        </button>
        <div className="px-6 py-2.5 bg-[#030303] rounded-xl border border-white/[0.05] text-[10px] font-black uppercase tracking-widest text-zinc-300">
          Page {currentPage} / {totalPages}
        </div>
        <button 
          disabled={currentPage >= totalPages} 
          onClick={() => setCurrentPage(p => p + 1)} 
          className="px-5 py-2.5 bg-[#0a0a0a]/50 backdrop-blur-xl border border-white/[0.05] rounded-xl font-bold uppercase tracking-widest text-[10px] text-zinc-400 hover:bg-white/[0.05] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Suivant
        </button>
      </div>

      {/* MODAL COMPLET DOM/CSS Refactoring */}
      {isOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-[#030303]/80 backdrop-blur-md" />
          <div className="relative w-full max-w-3xl bg-[#0a0a0a] rounded-3xl shadow-[0_0_50px_-10px_rgba(139,92,246,0.3)] border border-white/[0.1] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[80px]" />
            <div className="px-8 py-6 bg-white/[0.02] border-b border-white/[0.05] flex justify-between items-center relative z-10">
              <div>
                <h2 className="text-xl font-black text-white">Analyse Forensique</h2>
                <p className="text-xs font-mono font-bold tracking-widest text-violet-400 mt-1">{selectedAlert.cve_id}</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/[0.05] border border-transparent hover:border-white/[0.1] transition-all text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="p-8 space-y-6 relative z-10">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-5 bg-[#030303] rounded-2xl border border-white/[0.05] relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-rose-500/10 blur-[20px]" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 relative z-10">Sévérité</p>
                  <p className="text-3xl font-black text-white relative z-10">{selectedAlert.severity || 'N/A'}</p>
                </div>
                <div className="p-5 bg-[#030303] rounded-2xl border border-white/[0.05] relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-orange-500/10 blur-[20px]" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 relative z-10">Score de Menace</p>
                  <p className="text-3xl font-black text-white relative z-10">{selectedAlert.threat_score}</p>
                </div>
                <div className="p-5 bg-[#030303] rounded-2xl border border-white/[0.05] relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-emerald-500/10 blur-[20px]" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 relative z-10">Niveau SOC</p>
                  <p className="text-xs font-bold text-zinc-300 mt-4 uppercase tracking-widest relative z-10">{selectedAlert.soc_level}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Payload / Log Système bruts</p>
                <div className="p-5 bg-[#030303] text-cyan-400 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-white/[0.05] shadow-inner">
                  {selectedAlert.log}
                </div>
              </div>

              {selectedAlert.prediction && (
                <div className="p-5 bg-violet-500/5 border border-violet-500/20 rounded-2xl relative overflow-hidden">
                  <p className="text-[10px] font-black justify-between flex text-violet-400 uppercase tracking-widest mb-2 relative z-10">
                    Prédiction Synaptique (IA) <Bot className="w-3 h-3 relative -top-0.5" />
                  </p>
                  <p className="text-sm text-zinc-300 font-medium relative z-10">{selectedAlert.prediction}</p>
                </div>
              )}

              {selectedAlert.recommendation && (
                <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl relative overflow-hidden">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 relative z-10">Recommandation Stratégique</p>
                  <p className="text-sm text-zinc-300 font-medium relative z-10">{selectedAlert.recommendation}</p>
                </div>
              )}
            </div>

            <div className="px-8 py-5 bg-white/[0.01] border-t border-white/[0.05] flex justify-end gap-3 relative z-10">
              <button 
                onClick={() => copyToClipboard(JSON.stringify(selectedAlert, null, 2), 'json')}
                className="px-5 py-2.5 text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-white transition-colors"
              >
                {copiedField === 'json' ? 'Copied ✓' : 'Copy JSON'}
              </button>
              <button onClick={closeModal} className="px-6 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white text-xs tracking-widest uppercase font-bold rounded-xl hover:bg-white/[0.1] hover:border-white/[0.2] transition-all">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      
      <AICopilot alerts={alerts} />
    </div>
  );
}
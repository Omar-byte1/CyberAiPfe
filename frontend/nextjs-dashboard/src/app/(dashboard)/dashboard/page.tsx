'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Zap,
  Target,
  Clock,
  RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { useEnrichedIPs } from '@/hooks/useEnrichedIPs';
import WorldMap, { ThreatLocation } from '@/components/WorldMap';
import AICopilot from '@/components/AICopilot';
import { useAlertContext } from '@/contexts/AlertContext';

// --- Interfaces & Types ---
interface Alert {
  cve_id: string;
  log?: string;
  severity?: number;
  threat_score?: number;
  soc_level?: string;
}

type DashboardSummary = {
  totalAlerts: number;
  criticalAlerts: number;
  mlAnomalies: number;
  topThreats: Alert[];
  generatedAt: string;
};

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler
);
// --- Global Chart Defaults for our Dark Theme ---
ChartJS.defaults.color = '#71717a'; // zinc-500
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';

export default function Dashboard() {
  const TOP_THREATS_COUNT = 5;

  const { 
    alerts, isSimulating, toggleSimulation, toastMessage, fetchAlerts, isLoading, isRefreshing 
  } = useAlertContext();

  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const stats = useMemo(() => {
    const total_alerts = alerts.length;
    const critical_cves = alerts.filter(a => a.cve_id && a.cve_id.startsWith('CVE-')).length;
    const ml_anomalies = alerts.filter(a => a.cve_id === 'ML-ANOMALY').length;
    const soc_level = ml_anomalies > 0 || alerts.some(a => (a.threat_score || 0) >= 9) 
      ? 'SOC Level 2 - High Risk' 
      : 'SOC Level 1 - Stable';
      
    return { total_alerts, critical_cves, ml_anomalies, soc_level };
  }, [alerts]);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [alerts]);

  const getPriorityScore = (alert: Alert): number => alert.threat_score ?? alert.severity ?? 0;

  const getBadgeClasses = (score: number): string => {
    if (score >= 9) return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (score >= 7) return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  };

  const extractHourFromLog = (log: string): number | null => {
    if (typeof log !== 'string' || log.length < 19) return null;
    const date = new Date(log.slice(0, 19).replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date.getHours();
  };

  const topThreats = useMemo(() => {
    return [...alerts].sort((a, b) => getPriorityScore(b) - getPriorityScore(a)).slice(0, TOP_THREATS_COUNT);
  }, [alerts]);

  const insight = useMemo(() => {
    const criticals = alerts.filter(a => (a.severity ?? 0) >= 8 || a.soc_level?.toLowerCase().includes('critical')).length;
    const anomalies = alerts.filter(a => a.cve_id === 'ML-ANOMALY').length;

    if (criticals > 5) return { tone: 'critical', message: 'Volume élevé de menaces critiques détecté.', criticals, anomalies };
    if (anomalies > 0) return { tone: 'anomaly', message: 'Comportement anormal détecté (Anomalies ML).', criticals, anomalies };
    return { tone: 'stable', message: 'Le système semble stable. Aucune menace critique immédiate.', criticals, anomalies };
  }, [alerts]);

  const { enrichedIPs, isLoadingGeo } = useEnrichedIPs(alerts);

  const mapData: ThreatLocation[] = useMemo(() => {
    return enrichedIPs.map(item => ({ country: item.country, count: item.count }));
  }, [enrichedIPs]);

  const trendChartData = useMemo(() => {
    const hourCounts: Record<number, number> = {};
    alerts.forEach(alert => {
      if (!alert.log) return;
      const hour = extractHourFromLog(alert.log);
      if (hour !== null) hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    });
    const hours = Object.keys(hourCounts).map(Number).sort((a, b) => a - b);
    return {
      labels: hours.map(h => `${String(h).padStart(2, '0')}:00`),
      counts: hours.map(h => hourCounts[h]),
    };
  }, [alerts]);

  const exportSummary = useCallback(() => {
    setIsExporting(true);
    try {
      const blob = new Blob([JSON.stringify({
        totalAlerts: alerts.length, criticalAlerts: insight.criticals, mlAnomalies: insight.anomalies, topThreats, generatedAt: new Date().toISOString()
      }, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cyber-report-${new Date().getTime()}.json`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  }, [alerts, insight, topThreats]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-2">
            Supervision <span className="text-violet-400">Globale</span>
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-500" />
            {isLoading ? 'Synchronisation...' : `Dernière synchro : ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              isSimulating 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 shadow-[0_0_20px_-5px_rgba(244,63,94,0.5)]' 
                : 'bg-white/[0.03] text-zinc-300 border border-white/[0.08] hover:border-violet-500/30 hover:text-white'
            }`}
          >
            <Zap className={`w-4 h-4 ${isSimulating ? 'animate-pulse text-rose-400' : 'text-violet-400'}`} />
            {isSimulating ? 'Stop Simul' : 'Simulation'}
          </button>
          
          <button
            onClick={fetchAlerts}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]"
          >
            {isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
          <button
            onClick={exportSummary}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] text-zinc-300 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Alertes" value={stats.total_alerts} icon={Activity} color="violet" />
        <StatCard title="CVE Critiques" value={stats.critical_cves} icon={ShieldAlert} color="rose" />
        <StatCard title="Anomalies IA" value={stats.ml_anomalies} icon={Zap} color="orange" />
        <StatCard title="Statut SOC" value={stats.soc_level} icon={Target} color={stats.soc_level.includes('Stable') ? 'emerald' : 'rose'} isStatus />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Threats */}
        <div className="lg:col-span-1 bg-[#0a0a0a]/50 backdrop-blur-xl rounded-3xl p-6 border border-white/[0.05] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px]" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
            🔥 Top Menaces
          </h3>
          <div className="space-y-3 relative z-10">
            {topThreats.map((alert, idx) => (
              <div key={`${alert.cve_id}-${idx}`} className="flex items-center justify-between p-4 rounded-2xl bg-[#030303] border border-white/[0.03] hover:border-white/[0.08] transition-colors">
                <div className="truncate pr-4">
                  <p className="font-bold text-white truncate text-sm">{alert.cve_id}</p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{alert.soc_level || 'General'}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-black ${getBadgeClasses(getPriorityScore(alert))}`}>
                  {getPriorityScore(alert)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="lg:col-span-1 bg-[#0a0a0a]/50 backdrop-blur-xl rounded-3xl p-6 border border-white/[0.05] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px]" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">🎯 Distribution</h3>
          <div className="h-[220px] relative z-10">
            <Doughnut
              data={{
                labels: ['Critiques', 'Anomalies', 'Autres'],
                datasets: [{
                  data: [stats.critical_cves, stats.ml_anomalies, stats.total_alerts - (stats.critical_cves + stats.ml_anomalies)],
                  backgroundColor: ['#f43f5e', '#f97316', '#8b5cf6'],
                  borderWidth: 0,
                  hoverOffset: 4
                }]
              }}
              options={{ maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa', font: { family: 'inherit', size: 11, weight: 'bold' } } } } }}
            />
          </div>
        </div>

        {/* AI Insights */}
        <div className={`lg:col-span-1 rounded-3xl p-6 border backdrop-blur-xl shadow-2xl relative overflow-hidden transition-colors ${
          insight.tone === 'critical' ? 'bg-rose-950/20 border-rose-500/20' : 'bg-emerald-950/20 border-emerald-500/20'
        }`}>
          <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] ${insight.tone === 'critical' ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`} />
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2 relative z-10">
            🧠 Analyse Synaptique
          </h3>
          <div className="relative z-10 space-y-4">
            <p className="font-bold text-white text-lg leading-snug">{insight.message}</p>
            <div className="pt-4 border-t border-white/[0.05] flex gap-6">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Critiques</p>
                <p className={`text-2xl font-black ${insight.criticals > 0 ? "text-rose-400" : "text-zinc-300"}`}>{insight.criticals}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Anomalies</p>
                <p className={`text-2xl font-black ${insight.anomalies > 0 ? "text-orange-400" : "text-zinc-300"}`}>{insight.anomalies}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Trend */}
        <div className="lg:col-span-2 bg-[#0a0a0a]/50 backdrop-blur-xl rounded-3xl p-6 border border-white/[0.05] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-500/5 blur-[80px]" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 relative z-10">📉 Ligne du Temps</h3>
          <div className="h-[250px] relative z-10">
            <Line
              data={{
                labels: trendChartData.labels,
                datasets: [{
                  label: 'Alertes Actives',
                  data: trendChartData.counts,
                  borderColor: '#8b5cf6',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  fill: true,
                  tension: 0.4,
                  borderWidth: 2,
                  pointBackgroundColor: '#030303',
                  pointBorderColor: '#8b5cf6',
                  pointBorderWidth: 2
                }]
              }}
              options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }}
            />
          </div>
        </div>

        {/* Threat Origins */}
        <div className="lg:col-span-1 bg-[#0a0a0a]/50 backdrop-blur-xl rounded-3xl p-6 border border-white/[0.05] shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[60px]" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 relative z-10">🌍 Origine IPs</h3>

          {isLoadingGeo ? (
            <div className="space-y-3 relative z-10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.02]" />
              ))}
            </div>
          ) : enrichedIPs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center relative z-10">
              <p className="text-sm font-bold tracking-widest uppercase text-zinc-600">No Data</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar relative z-10 max-h-[250px]">
              {enrichedIPs.map((item) => (
                <div key={item.ip} className="p-4 rounded-2xl bg-[#030303] border border-white/[0.03] hover:border-cyan-500/30 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{item.flag}</span>
                      <span className="font-bold text-white text-sm">{item.country}</span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 rounded bg-white/[0.05] text-zinc-300">
                      {item.count} HIT
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-medium pl-9 text-zinc-500">
                    <span className="truncate">ASN: {item.org}</span>
                    <span className="font-mono text-[10px] text-cyan-400/70">{item.ip}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Threat Map */}
        <div className="lg:col-span-3 bg-[#0a0a0a]/50 backdrop-blur-xl rounded-3xl p-6 border border-white/[0.05] shadow-2xl relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[50%] bg-emerald-500/5 blur-[100px] pointer-events-none" />
          <div className="mb-6 flex items-center justify-between relative z-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">🌐 Global Threat Map</h3>
            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black tracking-widest uppercase">Live Tracking</span>
          </div>
          <div className="relative z-10">
            {isLoadingGeo ? (
              <div className="w-full h-[400px] flex flex-col items-center justify-center animate-pulse bg-[#030303] rounded-2xl border border-white/[0.03]">
                  <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-emerald-500 animate-spin mb-4" />
                  <div className="text-xs font-bold tracking-widest text-emerald-500/50 uppercase">Initialisation...</div>
              </div>
            ) : (
              <WorldMap data={mapData} />
            )}
          </div>
        </div>
      </div>

      {toastMessage && (
         <div className="fixed bottom-6 right-6 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(244,63,94,0.3)] border border-rose-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <p className="font-bold text-xs tracking-widest uppercase">{toastMessage}</p>
        </div>
      )}

      <AICopilot alerts={alerts} />
    </div>
  );
}

// --- Sub-components ---
interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: 'violet' | 'rose' | 'orange' | 'emerald';
  isStatus?: boolean;
}

function StatCard({ title, value, icon: Icon, color, isStatus }: StatCardProps) {
  const colorMap = {
    violet: 'from-violet-500 to-indigo-500 text-violet-400 border-violet-500/20 bg-violet-500/10 shadow-[0_0_15px_-3px_rgba(139,92,246,0.2)]',
    rose: 'from-rose-500 to-red-500 text-rose-400 border-rose-500/20 bg-rose-500/10 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]',
    orange: 'from-orange-400 to-amber-500 text-orange-400 border-orange-500/20 bg-orange-500/10 shadow-[0_0_15px_-3px_rgba(249,115,22,0.2)]',
    emerald: 'from-emerald-400 to-teal-500 text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]'
  };

  return (
    <div className="bg-[#0a0a0a]/50 backdrop-blur-xl p-6 rounded-3xl border border-white/[0.05] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorMap[color].split(' ')[0]} opacity-5 blur-[50px]`} />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3 rounded-2xl flex items-center justify-center bg-gradient-to-br border ${colorMap[color].split(' ').slice(2).join(' ')}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest relative z-10 mb-1">{title}</p>
      <p className={`font-black tracking-tight relative z-10 ${isStatus ? 'text-lg text-zinc-200' : 'text-4xl text-white'}`}>{value}</p>
    </div>
  );
}
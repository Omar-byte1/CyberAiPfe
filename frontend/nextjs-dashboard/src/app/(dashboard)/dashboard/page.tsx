"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  Activity,
  Zap,
  Target,
  Clock,
  RefreshCw,
} from "lucide-react";
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
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { useEnrichedIPs } from "@/hooks/useEnrichedIPs";
import WorldMap, { ThreatLocation } from "@/components/WorldMap";
import AICopilot from "@/components/AICopilot";
import { useAlertContext } from "@/contexts/AlertContext";

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
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
);
// --- Global Chart Defaults for Light Theme ---
ChartJS.defaults.color = "#6b7280"; // gray-500
ChartJS.defaults.borderColor = "#e5e7eb"; // gray-200

export default function Dashboard() {
  const TOP_THREATS_COUNT = 5;

  const {
    alerts,
    isSimulating,
    toggleSimulation,
    toastMessage,
    fetchAlerts,
    isLoading,
    isRefreshing,
  } = useAlertContext();

  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const stats = useMemo(() => {
    const total_alerts = alerts.length;
    const critical_cves = alerts.filter(
      (a) => a.cve_id && a.cve_id.startsWith("CVE-"),
    ).length;
    const ml_anomalies = alerts.filter((a) => a.cve_id === "ML-ANOMALY").length;
    const soc_level =
      ml_anomalies > 0 || alerts.some((a) => (a.threat_score || 0) >= 9)
        ? "SOC Level 2 - High Risk"
        : "SOC Level 1 - Stable";

    return { total_alerts, critical_cves, ml_anomalies, soc_level };
  }, [alerts]);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [alerts]);

  const getPriorityScore = (alert: Alert): number =>
    alert.threat_score ?? alert.severity ?? 0;

  const getBadgeClasses = (score: number): string => {
    if (score >= 9) return "bg-red-50 text-red-600 border border-red-200";
    if (score >= 7)
      return "bg-orange-50 text-orange-600 border border-orange-200";
    return "bg-green-50 text-green-600 border border-green-200";
  };

  const extractHourFromLog = (log: string): number | null => {
    if (typeof log !== "string" || log.length < 19) return null;
    const date = new Date(log.slice(0, 19).replace(" ", "T"));
    return Number.isNaN(date.getTime()) ? null : date.getHours();
  };

  const topThreats = useMemo(() => {
    return [...alerts]
      .sort((a, b) => getPriorityScore(b) - getPriorityScore(a))
      .slice(0, TOP_THREATS_COUNT);
  }, [alerts]);

  const insight = useMemo(() => {
    const criticals = alerts.filter(
      (a) =>
        (a.severity ?? 0) >= 8 ||
        a.soc_level?.toLowerCase().includes("critical"),
    ).length;
    const anomalies = alerts.filter((a) => a.cve_id === "ML-ANOMALY").length;

    if (criticals > 5)
      return {
        tone: "critical",
        message: "Volume élevé de menaces critiques détecté.",
        criticals,
        anomalies,
      };
    if (anomalies > 0)
      return {
        tone: "anomaly",
        message: "Comportement anormal détecté (Anomalies ML).",
        criticals,
        anomalies,
      };
    return {
      tone: "stable",
      message: "Le système semble stable. Aucune menace critique immédiate.",
      criticals,
      anomalies,
    };
  }, [alerts]);

  const { enrichedIPs, isLoadingGeo } = useEnrichedIPs(alerts);

  const mapData: ThreatLocation[] = useMemo(() => {
    return enrichedIPs.map((item) => ({
      country: item.country,
      count: item.count,
    }));
  }, [enrichedIPs]);

  const trendChartData = useMemo(() => {
    const hourCounts: Record<number, number> = {};
    alerts.forEach((alert) => {
      if (!alert.log) return;
      const hour = extractHourFromLog(alert.log);
      if (hour !== null) hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    });
    // Pad with all 24 hours so the chart always draws a line
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    return {
      labels: allHours.map((h) => `${String(h).padStart(2, "0")}:00`),
      counts: allHours.map((h) => hourCounts[h] || 0),
    };
  }, [alerts]);

  const exportSummary = useCallback(() => {
    setIsExporting(true);
    try {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              totalAlerts: alerts.length,
              criticalAlerts: insight.criticals,
              mlAnomalies: insight.anomalies,
              topThreats,
              generatedAt: new Date().toISOString(),
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `cyber-report-${new Date().getTime()}.json`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  }, [alerts, insight, topThreats]);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
            Supervision <span className="text-green-600">Globale</span>
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            {isLoading
              ? "Synchronisation..."
              : `Dernière synchro : ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              isSimulating
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                : "bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-700"
            }`}
          >
            <Zap
              className={`w-4 h-4 ${isSimulating ? "animate-pulse text-red-500" : "text-green-600"}`}
            />
            {isSimulating ? "Stop Simul" : "Simulation"}
          </button>

          <button
            onClick={fetchAlerts}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-md"
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
          <button
            onClick={exportSummary}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-green-600" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Alertes"
          value={stats.total_alerts}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="CVE Critiques"
          value={stats.critical_cves}
          icon={ShieldAlert}
          color="rose"
        />
        <StatCard
          title="Anomalies IA"
          value={stats.ml_anomalies}
          icon={Zap}
          color="orange"
        />
        <StatCard
          title="Statut SOC"
          value={stats.soc_level}
          icon={Target}
          color={stats.soc_level.includes("Stable") ? "emerald" : "rose"}
          isStatus
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Threats */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            🔥 Top Menaces
          </h3>
          <div className="space-y-3">
            {topThreats.map((alert, idx) => (
              <div
                key={`${alert.cve_id}-${idx}`}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition-colors"
              >
                <div className="truncate pr-4">
                  <p className="font-bold text-gray-900 truncate text-sm">
                    {alert.cve_id}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                    {alert.soc_level || "General"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-black ${getBadgeClasses(getPriorityScore(alert))}`}
                >
                  {getPriorityScore(alert)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">
            🎯 Distribution
          </h3>
          <div className="h-[220px]">
            <Doughnut
              data={{
                labels: ["Critiques", "Anomalies", "Autres"],
                datasets: [
                  {
                    data: [
                      stats.critical_cves,
                      stats.ml_anomalies,
                      stats.total_alerts -
                        (stats.critical_cves + stats.ml_anomalies),
                    ],
                    backgroundColor: ["#dc2626", "#f97316", "#16a34a"],
                    borderWidth: 0,
                    hoverOffset: 4,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                cutout: "75%",
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: "#6b7280",
                      font: { family: "inherit", size: 11, weight: "bold" },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* AI Insights */}
        <div
          className={`lg:col-span-1 rounded-2xl p-6 border shadow-sm transition-colors ${
            insight.tone === "critical"
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            🧠 Analyse Synaptique
          </h3>
          <div className="space-y-4">
            <p className="font-bold text-gray-900 text-lg leading-snug">
              {insight.message}
            </p>
            <div className="pt-4 border-t border-gray-200 flex gap-6">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                  Critiques
                </p>
                <p
                  className={`text-2xl font-black ${insight.criticals > 0 ? "text-red-600" : "text-gray-400"}`}
                >
                  {insight.criticals}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                  Anomalies
                </p>
                <p
                  className={`text-2xl font-black ${insight.anomalies > 0 ? "text-orange-500" : "text-gray-400"}`}
                >
                  {insight.anomalies}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">
            📉 Ligne du Temps
          </h3>
          <div className="h-[250px]">
            <Line
              data={{
                labels: trendChartData.labels,
                datasets: [
                  {
                    label: "Alertes Actives",
                    data: trendChartData.counts,
                    borderColor: "#16a34a",
                    backgroundColor: "rgba(22, 163, 74, 0.1)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: "#ffffff",
                    pointBorderColor: "#16a34a",
                    pointBorderWidth: 2,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { grid: { color: "#f3f4f6" } },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        </div>

        {/* Threat Origins */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">
            🌍 Origine IPs
          </h3>

          {isLoadingGeo ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : enrichedIPs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm font-bold tracking-widest uppercase text-gray-600">
                No Data
              </p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[250px]">
              {enrichedIPs.map((item) => (
                <div
                  key={item.ip}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{item.flag}</span>
                      <span className="font-bold text-gray-900 text-sm">
                        {item.country}
                      </span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 rounded bg-gray-100 text-gray-500">
                      {item.count} HIT
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-medium pl-9 text-gray-400">
                    <span className="truncate">ASN: {item.org}</span>
                    <span className="font-mono text-[10px] text-blue-400">
                      {item.ip}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Threat Map */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
              🌐 Global Threat Map
            </h3>
            <span className="px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg text-[10px] font-black tracking-widest uppercase">
              Live Tracking
            </span>
          </div>
          <div>
            {isLoadingGeo ? (
              <div className="w-full h-[400px] flex flex-col items-center justify-center animate-pulse bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-green-500 animate-spin mb-4" />
                <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                  Initialisation...
                </div>
              </div>
            ) : (
              <WorldMap data={mapData} />
            )}
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-gray-900 px-6 py-4 rounded-2xl shadow-lg border border-red-200 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <p className="font-bold text-xs tracking-widest uppercase">
            {toastMessage}
          </p>
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
  color: "green" | "rose" | "orange" | "emerald";
  isStatus?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  isStatus,
}: StatCardProps) {
  const colorMap = {
    green: "text-green-600 border-green-200 bg-green-50",
    rose: "text-red-600 border-red-200 bg-red-50",
    orange: "text-orange-500 border-orange-200 bg-orange-50",
    emerald: "text-green-600 border-green-200 bg-green-50",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-6">
        <div
          className={`p-3 rounded-xl flex items-center justify-center border ${colorMap[color]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
        {title}
      </p>
      <p
        className={`font-black tracking-tight ${isStatus ? "text-lg text-gray-700" : "text-4xl text-gray-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

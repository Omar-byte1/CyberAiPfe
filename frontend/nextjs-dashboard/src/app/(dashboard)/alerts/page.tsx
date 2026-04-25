"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Shield,
  Search,
  ChevronRight,
  Activity,
  Download,
  Bot,
} from "lucide-react";
import AICopilot from "@/components/AICopilot";
import { useAlertContext, Alert } from "@/contexts/AlertContext";

const SOC_LEVEL_OPTIONS = [
  { label: "All", value: "ALL" },
  { label: "SOC Level 1 - Stable", value: "SOC Level 1 - Stable" },
  { label: "SOC Level 2 - High Risk", value: "SOC Level 2 - High Risk" },
  {
    label: "SOC Level 3 - Critical Threat",
    value: "SOC Level 3 - Critical Threat",
  },
] as const;
type SocLevelOption = (typeof SOC_LEVEL_OPTIONS)[number]["value"];

function parseLogTimestamp(log: string): Date | null {
  if (typeof log !== "string" || log.length < 19) return null;
  const date = new Date(log.slice(0, 19).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function AlertsPage() {
  const { alerts, fetchAlerts, isLoading } = useAlertContext();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<SocLevelOption>("ALL");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [alertsPerPage] = useState(10);

  const closeModal = () => {
    setIsOpen(false);
    setSelectedAlert(null);
  };
  const copyToClipboard = useCallback(
    async (value: string, fieldKey: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedField(fieldKey);
        if (copiedTimeoutRef.current !== null)
          window.clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = window.setTimeout(
          () => setCopiedField(null),
          1200,
        );
      } catch (err) {
        console.error("Clipboard error", err);
      }
    },
    [],
  );

  useEffect(() => {
    if (alerts.length === 0 && !isLoading) void fetchAlerts();
  }, [fetchAlerts, alerts.length, isLoading]);

  const filteredAlerts = alerts.filter((alert) => {
    const safeLog = alert.log || "";
    const matchesSearch =
      alert.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      safeLog.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "ALL" || alert.soc_level === filter;
    return matchesSearch && matchesFilter;
  });
  const sortedAlerts = [...filteredAlerts].sort((a, b) =>
    sortOrder === "DESC"
      ? (b.severity ?? 0) - (a.severity ?? 0)
      : (a.severity ?? 0) - (b.severity ?? 0),
  );
  const currentAlerts = sortedAlerts.slice(
    (currentPage - 1) * alertsPerPage,
    currentPage * alertsPerPage,
  );
  const totalPages = Math.ceil(sortedAlerts.length / alertsPerPage) || 1;

  const exportCSV = () => {
    const header = ["CVE_ID", "Log", "Severity", "SOC_Level", "Threat_Score"];
    const rows = sortedAlerts.map((a) =>
      [
        `"${a.cve_id}"`,
        `"${(a.log || "").replace(/"/g, '""')}"`,
        a.severity,
        `"${a.soc_level}"`,
        a.threat_score,
      ].join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `security_alerts_${new Date().getTime()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
            Security <span className="text-green-600">Alerts</span>
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            Supervision temps réel des menaces
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-3 flex flex-wrap gap-4 items-center shadow-sm">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher une CVE ou IP..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl text-xs font-medium focus:border-green-500 outline-none transition-all placeholder:text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-widest outline-none cursor-pointer focus:border-green-500 transition-all"
            value={filter}
            onChange={(e) => setFilter(e.target.value as SocLevelOption)}
          >
            {SOC_LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            <Download className="w-4 h-4 text-green-600" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Scan du réseau...
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Indicateur
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Contexte / Log
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Score
                  </th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentAlerts.map((alert, idx) => (
                  <tr
                    key={`${alert.cve_id}-${idx}`}
                    className="hover:bg-blue-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${alert.cve_id === "ML-ANOMALY" ? "bg-orange-50 border-orange-200 text-orange-500" : "bg-red-50 border-red-200 text-red-500"}`}
                        >
                          {alert.cve_id === "ML-ANOMALY" ? (
                            <Activity className="w-5 h-5" />
                          ) : (
                            <Shield className="w-5 h-5" />
                          )}
                        </div>
                        <span className="font-mono font-bold text-sm text-gray-900 group-hover:text-green-600 transition-colors">
                          {alert.cve_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-md">
                      <p className="truncate text-xs font-medium text-gray-400">
                        {alert.log}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-lg text-xs font-black border ${alert.threat_score! >= 7 ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-600"}`}
                      >
                        {alert.threat_score}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedAlert(alert);
                          setIsOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-green-600 hover:border-green-600 text-gray-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
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

      <div className="flex justify-center items-center gap-4 py-8">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold uppercase tracking-widest text-[10px] text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-all"
        >
          Précédent
        </button>
        <div className="px-6 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600">
          Page {currentPage} / {totalPages}
        </div>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold uppercase tracking-widest text-[10px] text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-all"
        >
          Suivant
        </button>
      </div>

      {isOpen && selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Analyse Forensique
                </h2>
                <p className="text-xs font-mono font-bold text-green-600 mt-1">
                  {selectedAlert.cve_id}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Sévérité
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {selectedAlert.severity || "N/A"}
                  </p>
                </div>
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Score de Menace
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {selectedAlert.threat_score}
                  </p>
                </div>
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Niveau SOC
                  </p>
                  <p className="text-xs font-bold text-gray-600 mt-4 uppercase tracking-widest">
                    {selectedAlert.soc_level}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Payload / Log bruts
                </p>
                <div className="p-5 bg-gray-50 text-green-700 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-gray-200">
                  {selectedAlert.log}
                </div>
              </div>
              {selectedAlert.prediction && (
                <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex justify-between">
                    Prédiction IA <Bot className="w-3 h-3" />
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    {selectedAlert.prediction}
                  </p>
                </div>
              )}
              {selectedAlert.recommendation && (
                <div className="p-5 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">
                    Recommandation
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    {selectedAlert.recommendation}
                  </p>
                </div>
              )}
            </div>
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(selectedAlert, null, 2),
                    "json",
                  )
                }
                className="px-5 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900"
              >
                {copiedField === "json" ? "Copied ✓" : "Copy JSON"}
              </button>
              <button
                onClick={closeModal}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs tracking-widest uppercase font-bold rounded-xl transition-all"
              >
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

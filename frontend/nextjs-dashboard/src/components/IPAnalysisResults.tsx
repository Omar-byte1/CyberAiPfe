"use client";
import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Info,
  MapPin,
  Server,
  Calendar,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Toast from "./Toast";
interface IPAnalysis {
  ip: string;
  reputation: "Clean" | "Suspicious" | "Malicious";
  risk_score: number;
  geo: { country: string; city: string; isp: string };
  threat_types: string[];
  recommendation: string;
  last_seen: string;
}
export default function IPAnalysisResults({ data }: { data: IPAnalysis }) {
  const [isActing, setIsActing] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const handleAction = async (action: "block" | "monitor" | "ignore") => {
    setIsActing(action);
    setToast(null);
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const token = window.localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/ip-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ip: data.ip, action }),
      });
      if (!res.ok) throw new Error("Failed to perform SOC action");
      const result = await res.json();
      setToast({ message: result.message, type: "success" });
    } catch {
      setToast({
        message: "Erreur lors de l'exécution de l'action SOC.",
        type: "error",
      });
    } finally {
      setIsActing(null);
    }
  };
  const styles = {
    Clean: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      shadow: "",
      icon: <ShieldCheck className="w-10 h-10 text-emerald-400" />,
    },
    Suspicious: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
      shadow: "",
      icon: <ShieldAlert className="w-10 h-10 text-amber-400" />,
    },
    Malicious: {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/30",
      shadow: "",
      icon: <ShieldX className="w-10 h-10 text-rose-400" />,
    },
  }[data.reputation];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* Reputation Card */}
      <div
        className={`lg:col-span-1 p-8 rounded-3xl border ${styles.border} ${styles.bg} ${styles.shadow} flex flex-col items-center text-center relative overflow-hidden `}
      >
        <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 ">
          {styles.icon}
        </div>
        <h3
          className={`text-2xl font-black uppercase tracking-widest ${styles.text}`}
        >
          {data.reputation}
        </h3>
        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-2">
          Reputation Status
        </p>
        <div className="mt-8 w-full space-y-4">
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
            <span className="text-[9px] uppercase tracking-widest font-black text-gray-500 block mb-2">
              Risk Intensity
            </span>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-black ${styles.text}`}>
                {data.risk_score}%
              </span>
              <div className="flex-1 ml-4 h-1.5 bg-black rounded-full overflow-hidden border border-gray-200">
                <div
                  className={`h-full ${data.risk_score > 70 ? "bg-rose-500 " : data.risk_score > 30 ? "bg-amber-500 " : "bg-emerald-500 "} transition-all duration-1000`}
                  style={{ width: `${data.risk_score}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Details Card */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100/5 pointer-events-none" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <Info className="w-5 h-5 text-blue-500" />
            <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm">
              Intelligence Breakdown
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative z-10">
            {[
              {
                icon: MapPin,
                label: "Geographic Info",
                value: `${data.geo.country}, ${data.geo.city}`,
                color: "text-blue-500",
              },
              {
                icon: Server,
                label: "Provider / ISP",
                value: data.geo.isp,
                color: "text-green-600",
              },
              {
                icon: Calendar,
                label: "Last Detection",
                value: data.last_seen,
                color: "text-green-600",
              },
              {
                icon: AlertTriangle,
                label: "Threat Vectors",
                value:
                  data.threat_types.length > 0
                    ? data.threat_types.join(", ")
                    : "None Identified",
                color: "text-amber-400",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 group hover:border-blue-200 transition-colors"
              >
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                    {item.label}
                  </p>
                  <p className="text-xs font-bold text-gray-600 mt-1">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-5 bg-blue-100/10 rounded-2xl border border-cyan-500/20 relative z-10">
            <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> AI Recommendation
            </h5>
            <p className="text-xs text-cyan-100/70 font-medium leading-relaxed">
              {data.recommendation}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-4">
          <button
            disabled={!!isActing}
            onClick={() => handleAction("ignore")}
            className="px-6 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isActing === "ignore" && (
              <Loader2 className="w-3 h-3 animate-spin" />
            )}
            Ignorer
          </button>
          <button
            disabled={!!isActing}
            onClick={() =>
              handleAction(data.reputation === "Clean" ? "monitor" : "block")
            }
            className={`px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-900 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center gap-3 ${data.reputation === "Clean" ? "bg-blue-100 hover:bg-blue-100 " : "bg-rose-600 hover:bg-rose-500 "}`}
          >
            {isActing && isActing !== "ignore" && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {data.reputation === "Clean"
              ? "Monitorer IP"
              : "Bloquer IP Externe"}
          </button>
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

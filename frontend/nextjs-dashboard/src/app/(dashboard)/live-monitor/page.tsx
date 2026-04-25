"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Globe,
  Cpu,
  Database,
  ArrowRight,
} from "lucide-react";
import LiveTrafficChart from "@/components/LiveTrafficChart";
interface Packet {
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  size: string;
  risk_score: number;
  verdict: string;
}
export default function LiveMonitorPage() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const avgRisk =
    packets.length > 0
      ? (
          packets.reduce((acc, p) => acc + p.risk_score, 0) / packets.length
        ).toFixed(1)
      : "0.0";
  const criticalCount = packets.filter((p) => p.risk_score > 7).length;
  useEffect(() => {
    if (!isLive) return;
    const fetchTraffic = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/live-traffic");
        if (!res.ok) throw new Error("API Error");
        const newPackets = await res.json();
        setPackets((prev) => [...newPackets, ...prev].slice(0, 100));
        setLoading(false);
      } catch (err) {
        console.error("Failed", err);
      }
    };
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 3000);
    return () => clearInterval(interval);
  }, [isLive]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [packets]);
  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-2">
            Cyber <span className="text-emerald-400">Sentinel</span>
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> Flux
            d'Interception Global (LIVE)
          </p>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20" : "bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-900"}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-500 animate-ping" : "bg-zinc-600"}`}
          />
          {isLive ? "LIVE CAPTURE" : "PAUSED"}
        </button>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 " />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Score Risque Moyen
            </span>
          </div>
          <p className="text-3xl font-black text-gray-900 relative z-10">
            {avgRisk}
            <span className="text-lg text-gray-600">/10</span>
          </p>
          <div className="mt-4 h-1.5 w-full bg-gray-50 rounded-full overflow-hidden relative z-10 border border-gray-200">
            <div
              className="h-full bg-amber-500 transition-all duration-500 "
              style={{ width: `${Math.min(parseFloat(avgRisk) * 10, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 " />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Anomalies Critiques
            </span>
          </div>
          <p className="text-3xl font-black text-gray-900 relative z-10">
            {criticalCount}
          </p>
          <p className="text-[10px] font-bold text-rose-500/70 mt-2 uppercase tracking-widest relative z-10">
            Requiert Attention
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 " />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Paquets Actifs
            </span>
          </div>
          <p className="text-3xl font-black text-gray-900 relative z-10">
            {packets.length}
          </p>
          <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-widest relative z-10">
            En mémoire tampon
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 " />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Confidence IA
            </span>
          </div>
          <p className="text-3xl font-black text-gray-900 relative z-10">
            99.2%
          </p>
          <p className="text-[10px] font-bold text-emerald-500/70 mt-2 uppercase tracking-widest relative z-10">
            Model: RF-HyperSentinel v2
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Live Traffic Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-green-600/10 pointer-events-none" />
          <div className="mb-6 relative z-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">
              Risk Pulse
            </h3>
            <p className="text-[10px] text-gray-600 mt-1 uppercase font-bold tracking-widest">
              Fluctuations temporelles
            </p>
          </div>
          <div className="flex-1 min-h-[250px] relative z-10">
            <LiveTrafficChart
              data={packets
                .slice(0, 50)
                .reverse()
                .map((p) => ({
                  timestamp: p.timestamp,
                  risk_score: p.risk_score,
                }))}
            />
          </div>
          <div className="mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-200 relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-green-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                Télémétrie
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-mono">
              <span className="text-emerald-400/80">root@sentinel:~#</span> stat
              --net
              <br /> [SYSTEM] Processing 12.4k pkt/s
              <br /> [AI] Latency: <span className="text-green-600">14ms</span>
              <br /> [DB] Indexing...
              <span className="text-emerald-400">OK</span>
            </p>
          </div>
        </div>
        {/* Live Matrix Feed */}
        <div className="lg:col-span-2 bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden flex flex-col h-[700px] relative">
          <div className="bg-gray-50 border-b border-gray-200 p-5 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse " />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                Network Interception Feed
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-gray-600">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-green-600/50" /> BUF 100/100
              </span>
              <span className="flex items-center gap-1 text-emerald-500/50">
                <ArrowRight className="w-3 h-3" /> STREAMING
              </span>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-xs custom-scrollbar"
          >
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                <Activity className="w-8 h-8 animate-spin text-emerald-500/50" />
                <p className="animate-pulse text-[10px] font-black tracking-widest uppercase">
                  Initializing Sentinel Node...
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="text-gray-600 border-b border-gray-200 text-left text-[10px] uppercase font-black tracking-widest">
                    <th className="p-3 pb-4">Time</th>
                    <th className="p-3 pb-4 text-blue-500/50">Source IP</th>
                    <th className="p-3 pb-4">Proto</th>
                    <th className="p-3 pb-4">Size</th>
                    <th className="p-3 pb-4 text-amber-500/50">Risk</th>
                    <th className="p-3 pb-4 text-green-600/50">AI Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {packets.map((packet, i) => (
                    <tr
                      key={`${packet.timestamp}-${i}`}
                      className={`border-b border-gray-200 transition-colors group ${packet.risk_score > 7 ? "bg-rose-500/5 hover:bg-rose-500/10 text-rose-200" : "hover:bg-gray-50 text-gray-500"}`}
                    >
                      <td className="p-3 opacity-60 text-[10px]">
                        {packet.timestamp}
                      </td>
                      <td
                        className={`p-3 font-bold text-xs ${packet.risk_score > 7 ? "text-rose-400" : "text-blue-500"}`}
                      >
                        {packet.source}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-black opacity-80">
                          {packet.protocol}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] opacity-60">
                        {packet.size}
                      </td>
                      <td
                        className={`p-3 font-black text-sm ${packet.risk_score > 7 ? "text-rose-500 drop-" : packet.risk_score > 4 ? "text-amber-500" : "text-emerald-500"}`}
                      >
                        {packet.risk_score.toFixed(1)}
                      </td>
                      <td className="p-3 font-bold text-xs">
                        {packet.risk_score > 7 && (
                          <ShieldAlert className="inline w-3 h-3 mr-2 mb-0.5 text-rose-500" />
                        )}
                        {packet.verdict}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

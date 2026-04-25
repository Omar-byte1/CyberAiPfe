"use client";
import React, { useState } from "react";
import { Search, Globe, ShieldAlert, Loader2, Info } from "lucide-react";
import IPAnalysisResults from "@/components/IPAnalysisResults";
export default function IPIntelPage() {
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = window.localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8000/ip-lookup/${ip}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok)
        throw new Error("IP Lookup failed. Ensure the backend is running.");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-2">
            IP Intelligence <span className="text-blue-500">Hub</span>
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500 animate-pulse" /> AI-Powered
            Global Reputation
          </p>
        </div>
      </div>
      {/* Search Bar */}
      <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100/10 pointer-events-none" />
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-4 relative z-10"
        >
          <div className="flex-1 relative group bg-gray-50 rounded-2xl border border-gray-200 flex items-center px-6 transition-all focus-within:border-blue-300 ">
            <Search className="w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Ex: 8.8.8.8, 185.23.4.99..."
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="w-full bg-transparent border-none text-gray-900 font-bold px-4 py-4 outline-none placeholder:text-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !ip.trim()}
            className="flex items-center justify-center gap-3 bg-blue-100 hover:bg-blue-100 disabled:bg-gray-50 disabled:text-gray-600 text-gray-900 font-black px-10 py-4 rounded-2xl transition-all disabled:shadow-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            ANALYSER
          </button>
        </form>
      </section>
      {/* Error State */}
      {error && (
        <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex items-center gap-4 text-rose-400 font-bold animate-in bounce-in duration-300">
          <ShieldAlert className="w-6 h-6 shrink-0" /> <p>{error}</p>
        </div>
      )}
      {/* Initial/Empty State */}
      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-60">
          <div className="p-8 bg-gray-50 border border-gray-200 rounded-full relative">
            <div className="absolute inset-0 bg-blue-100/5 blur-xl rounded-full" />
            <Globe className="w-16 h-16 text-gray-600 relative z-10" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-600 uppercase tracking-widest">
              Prêt pour l'Analyse
            </h3>
            <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase mt-2">
              Diagnostic IA d'adresse IP V4/V6
            </p>
          </div>
        </div>
      )}
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in">
          <div className="relative">
            <div className="w-32 h-32 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin "></div>
            <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-blue-500 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-gray-900 uppercase tracking-widest">
              Requête Threat Intelligence...
            </p>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-2">
              Neural Link Active
            </p>
          </div>
        </div>
      )}
      {/* Result State */}
      {result && (
        <div className="animate-in slide-in-from-bottom-8 duration-700">
          <IPAnalysisResults data={result} />
        </div>
      )}
      {/* Info Footer */}
      <footer className="pt-10">
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 flex items-start gap-4">
          <Info className="w-5 h-5 text-gray-500 mt-1" />
          <div>
            <p className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest mb-1.5">
              Avis de Simulation
            </p>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-relaxed">
              Cet outil agrège des données simulées. Connectez les API OTX /
              VirusTotal dans le backend pour environnement prod.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

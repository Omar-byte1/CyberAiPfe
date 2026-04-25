"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FlaskConical,
  Globe,
  Link as LinkIcon,
  ShieldAlert,
  Loader2,
  Terminal,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Zap,
  RefreshCw,
  Radio,
  Target,
  Activity,
  Eye,
  X,
} from "lucide-react"; /* ── Verdict Helpers ────────────────────────────────────────── */
const verdictConfig: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    icon: React.ReactNode;
    glow: string;
  }
> = {
  MALICIOUS: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/60",
    text: "text-rose-400",
    glow: "",
    icon: <ShieldAlert className="w-6 h-6 text-rose-400" />,
  },
  SUSPICIOUS: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/60",
    text: "text-amber-400",
    glow: "",
    icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
  },
  CLEAN: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/60",
    text: "text-emerald-400",
    glow: "",
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
  },
  UNKNOWN: {
    bg: "bg-gray-200/50",
    border: "border-zinc-700",
    text: "text-gray-500",
    glow: "",
    icon: <Eye className="w-6 h-6 text-gray-500" />,
  },
};
const iocIcon: Record<string, React.ReactNode> = {
  url: <LinkIcon className="w-3 h-3" />,
  domain: <Globe className="w-3 h-3" />,
  ip: <Cpu className="w-3 h-3" />,
}; /* ── Types ──────────────────────────────────────────────────── */
interface FeedEntry {
  url: string;
  id: number;
}
interface DetonationResult {
  verdict: string;
  risk_score: number;
  brand_target?: string;
  technique?: string;
  ioc_types?: string[];
  suspicious_flags?: string[];
  summary?: string;
  url?: string;
  domain?: string;
}
export default function SandboxPage() {
  const [feeds, setFeeds] = useState<FeedEntry[]>([]);
  const [feedStatus, setFeedStatus] = useState<
    "loading" | "live" | "cache" | "stale" | "error"
  >("loading");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<DetonationResult | null>(null);
  const [detonating, setDetonating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logEndRef.current)
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [logs]);
  const saveToIncidents = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        id: crypto.randomUUID(),
        type: "phishing-url",
        verdict: result.verdict,
        risk_score: result.risk_score,
        timestamp: new Date().toISOString(),
        details: {
          url: result.url,
          domain: result.domain,
          brand_target: result.brand_target,
          technique: result.technique,
          suspicious_flags: result.suspicious_flags,
          ioc_types: result.ioc_types,
          summary: result.summary,
          source: "AI Sandbox / OpenPhish",
        },
      };
      const res = await fetch("http://127.0.0.1:8000/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };
  const fetchFeed = useCallback(async () => {
    setFeedStatus("loading");
    setFeeds([]);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/sandbox/live-feed", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Feed fetch failed");
      const data = await res.json();
      setFeeds(
        (data.urls as string[]).map((url: string, i: number) => ({
          url,
          id: i,
        })),
      );
      setFeedStatus(data.status);
    } catch {
      setFeedStatus("error");
    }
  }, []);
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);
  const handleDetonate = async (url: string) => {
    setSelectedUrl(url);
    setDetonating(true);
    setLogs([]);
    setResult(null);
    setError(null);
    setSaved(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/sandbox/detonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url }),
      });
      if (!res.ok || !res.body) throw new Error("Backend unreachable");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const lines = chunk.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const eventType = eventLine?.replace("event:", "").trim() ?? "log";
          const data = dataLine.replace("data:", "").trim();
          if (eventType === "result") {
            try {
              setResult(JSON.parse(data));
            } catch {
              /* ignore */
            }
          } else if (eventType === "error") {
            setError(data);
          } else {
            setLogs((prev) => [...prev, data]);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection error");
    } finally {
      setDetonating(false);
    }
  };
  const feedStatusBadge: Record<string, string> = {
    live: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    cache: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    stale: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    error: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    loading: "bg-gray-200 border-zinc-700 text-gray-500",
  };
  const cfg = result
    ? (verdictConfig[result.verdict] ?? verdictConfig.UNKNOWN)
    : null;
  return (
    <div className="space-y-6 max-w-[1700px] mx-auto animate-in fade-in duration-700">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-1">
            AI <span className="text-green-600">Sandbox</span>
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-green-600 animate-pulse" />
            Live Phishing Detonation Console · Powered by OpenPhish + Ollama
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${feedStatusBadge[feedStatus]}`}
          >
            {feedStatus === "live" && "● LIVE FEED"}
            {feedStatus === "cache" && "● CACHED"}
            {feedStatus === "stale" && "⚠ STALE"}
            {feedStatus === "error" && "✕ FEED ERROR"}
            {feedStatus === "loading" && "○ LOADING..."}
          </span>
          <button
            onClick={fetchFeed}
            disabled={feedStatus === "loading"}
            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-gray-50 hover:bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-xl transition-all"
          >
            <RefreshCw
              className={`w-3 h-3 ${feedStatus === "loading" ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>
      {/* ── Split Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* LEFT — Live Feed Panel */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
              OpenPhish Live Feed
            </span>
            <span className="ml-auto text-[9px] text-gray-600 font-bold">
              {feeds.length} URLs
            </span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[700px] divide-y divide-white/[0.03]">
            {feedStatus === "loading" && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                  Fetching OpenPhish feed...
                </p>
              </div>
            )}
            {feedStatus === "error" && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-rose-400">
                <ShieldAlert className="w-8 h-8" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Feed Unavailable
                </p>
                <button
                  onClick={fetchFeed}
                  className="text-[9px] border border-rose-500/30 hover:bg-rose-500/10 px-4 py-2 rounded-xl transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            {feeds.map(({ url, id }) => (
              <button
                key={id}
                onClick={() => !detonating && handleDetonate(url)}
                disabled={detonating}
                className={`w-full text-left px-5 py-4 transition-all group hover:bg-green-600/5 ${selectedUrl === url ? "bg-green-600/10 border-l-2 border-green-500" : "border-l-2 border-transparent"}`}
              >
                <div className="flex items-start gap-3">
                  <Globe
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${selectedUrl === url ? "text-green-600" : "text-gray-600 group-hover:text-green-600"} transition-colors`}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-gray-500 break-all line-clamp-2 group-hover:text-gray-700 transition-colors select-none">
                      {url}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[8px] font-black bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded uppercase tracking-widest">
                        Phishing
                      </span>
                      {selectedUrl === url && (
                        <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">
                          ● Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest text-center">
              ⚠ Threat data for research only. Do not access URLs directly.
            </p>
          </div>
        </div>
        {/* RIGHT — Console Panel */}
        <div className="bg-gray-50 border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          {/* Console Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
              Detonation Console
            </span>
            {detonating && (
              <span className="ml-auto flex items-center gap-2 text-[9px] font-black text-green-600 uppercase tracking-widest animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Active
              </span>
            )}
            {!detonating && selectedUrl && (
              <button
                onClick={() => {
                  setSelectedUrl(null);
                  setLogs([]);
                  setResult(null);
                  setError(null);
                }}
                className="ml-auto p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Empty State */}
          {!selectedUrl && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10 opacity-30">
              <Target className="w-16 h-16 text-gray-600" />
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                  Select a target from the live feed
                </p>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                  AI detonation will stream in real-time
                </p>
              </div>
            </div>
          )}
          {/* Terminal Log Stream */}
          {selectedUrl && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Target URL bar */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                <Activity className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <p className="font-mono text-[10px] text-gray-500 break-all select-all">
                  {selectedUrl}
                </p>
              </div>
              {/* Logs */}
              <div className="flex-1 overflow-y-auto p-6 space-y-1.5 font-mono text-[11px] bg-[#010101]">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 animate-in slide-in-from-bottom-1 duration-200"
                  >
                    <span className="text-gray-200 shrink-0 tabular-nums">
                      [{String(i + 1).padStart(2, "0")}]
                    </span>
                    <span
                      className={`${log.includes("✅") ? "text-emerald-400" : log.includes("⚠️") || log.includes("⚠") ? "text-amber-400" : log.includes("❌") ? "text-rose-400" : log.includes("🎯") ? "text-green-600" : "text-gray-500"}`}
                    >
                      {log}
                    </span>
                  </div>
                ))}
                {detonating && logs.length > 0 && (
                  <div className="text-emerald-500 animate-pulse ml-8">▋</div>
                )}
                {logs.length === 0 && detonating && (
                  <div className="text-gray-600 text-center py-10">
                    Connecting to detonation engine...
                  </div>
                )}
                <div ref={logEndRef} />
              </div>
              {/* Error */}
              {error && (
                <div className="mx-6 mb-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <p className="text-[11px] font-bold">{error}</p>
                </div>
              )}
              {/* Verdict Card */}
              {result && cfg && (
                <div
                  className={`mx-6 mb-6 p-6 rounded-2xl border ${cfg.bg} ${cfg.border} ${cfg.glow} animate-in slide-in-from-bottom-4 duration-500`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      {cfg.icon}
                      <div>
                        <p
                          className={`text-xl font-black uppercase tracking-widest ${cfg.text}`}
                        >
                          {result.verdict}
                        </p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                          AI Detonation Verdict
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-3xl font-black tabular-nums ${cfg.text}`}
                      >
                        {result.risk_score}
                        <span className="text-sm text-gray-600">/100</span>
                      </p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                        Risk Score
                      </p>
                    </div>
                  </div>
                  {/* Risk bar */}
                  <div className="h-1.5 w-full bg-gray-50 rounded-full mb-5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${result.risk_score >= 70 ? "bg-rose-500" : result.risk_score >= 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${result.risk_score}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {result.brand_target && (
                      <div className="bg-gray-100 rounded-xl p-3">
                        <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">
                          Brand Target
                        </p>
                        <p className="text-[11px] font-bold text-gray-900">
                          {result.brand_target}
                        </p>
                      </div>
                    )}
                    {result.technique && (
                      <div className="bg-gray-100 rounded-xl p-3">
                        <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">
                          Technique
                        </p>
                        <p className="text-[11px] font-bold text-gray-900">
                          {result.technique}
                        </p>
                      </div>
                    )}
                  </div>
                  {result.suspicious_flags &&
                    result.suspicious_flags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {result.suspicious_flags.map((flag, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-black bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-1 rounded-lg uppercase tracking-widest"
                          >
                            ⚑ {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  {result.ioc_types && result.ioc_types.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {result.ioc_types.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg text-gray-500"
                        >
                          {iocIcon[t.toLowerCase()] ?? (
                            <Zap className="w-3 h-3" />
                          )}
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {t}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.summary && (
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed border-t border-gray-200 pt-3 mt-1">
                      {result.summary}
                    </p>
                  )}
                  {/* Save to Incidents button */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    {saved ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" /> Saved to Incidents
                      </div>
                    ) : (
                      <button
                        onClick={saveToIncidents}
                        disabled={saving}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-600 disabled:opacity-50 text-gray-900 px-5 py-2.5 rounded-xl transition-all"
                      >
                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        {saving ? "Saving..." : "Save to Incidents"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

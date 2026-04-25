"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Link as LinkIcon,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Terminal,
  Cpu,
  ShieldCheck,
  Tag,
  Clock,
  Globe,
  Database,
  Info,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react"; /* ── colour helpers ─────────────────────────────────────────── */
const colorMap: Record<string, string> = {
  red: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  yellow: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  purple: "bg-green-600/10 text-green-600 border-green-300",
};
const getTLPBadge = (tlp: any[], threatLevel: number | string) => {
  if (tlp && tlp.length > 0) {
    const { name, color } = tlp[0];
    return (
      <span
        className="px-3 py-1 text-gray-900 text-[10px] font-black rounded-lg shadow-sm uppercase tracking-tighter"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 15px ${color}40`,
          border: `1px solid ${color}80`,
        }}
      >
        {name}
      </span>
    );
  }
  if (threatLevel === "CRITICAL" || threatLevel === 0)
    return (
      <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/50 text-[10px] font-black rounded-lg uppercase tracking-tighter">
        CRITICAL
      </span>
    );
  if (threatLevel === "HIGH" || threatLevel === 1)
    return (
      <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/50 text-[10px] font-black rounded-lg uppercase tracking-tighter">
        HIGH
      </span>
    );
  if (threatLevel === "MEDIUM" || threatLevel === 2)
    return (
      <span className="px-3 py-1 bg-green-600/20 text-green-600 border border-green-500 text-[10px] font-black rounded-lg uppercase tracking-tighter">
        MEDIUM
      </span>
    );
  return (
    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-[10px] font-black rounded-lg uppercase tracking-tighter">
      LOW
    </span>
  );
}; /* ── Pipeline phase definitions ─────────────────────────────── */
const PHASES = [
  {
    icon: Globe,
    label: "Scraping",
    color: "text-sky-400",
    progressMin: 0,
    progressMax: 29,
  },
  {
    icon: Zap,
    label: "iocextract Pre",
    color: "text-amber-400",
    progressMin: 30,
    progressMax: 59,
  },
  {
    icon: Bot,
    label: "LLM Analysis",
    color: "text-emerald-400",
    progressMin: 60,
    progressMax: 84,
  },
  {
    icon: ShieldCheck,
    label: "Whitelist Filter",
    color: "text-green-600",
    progressMin: 85,
    progressMax: 91,
  },
  {
    icon: Database,
    label: "DB Storage",
    color: "text-rose-400",
    progressMin: 92,
    progressMax: 100,
  },
]; /* ── Main Component ─────────────────────────────────────────── */
export default function ParseAIPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);
  /* Active phase derived from progress */ const activePhase =
    PHASES.findLastIndex((p) => progress >= p.progressMin);
  /* ── SSE Stream Consumer ─────────────────────────────────── */ const handleAnalyze =
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!url.trim()) return;
      setLoading(true);
      setError(null);
      setEvent(null);
      setLogs([]);
      setProgress(0);
      try {
        const token = window.localStorage.getItem("token");
        const res = await fetch(
          `http://127.0.0.1:8000/analyze-url-stream?url=${encodeURIComponent(url)}`,
          {
            method: "GET",
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          },
        );
        if (!res.ok) {
          const errData = await res
            .json()
            .catch(() => ({ detail: `HTTP ${res.status}` }));
          throw new Error(errData.detail || "Stream connection failed");
        }
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          /* keep incomplete last line */ for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.error) {
                throw new Error(payload.error);
              }
              if (payload.step) {
                setProgress(payload.progress ?? 0);
                const ts = new Date().toLocaleTimeString();
                setLogs((prev) => [...prev, `[${ts}] ${payload.step}`]);
              }
              if (payload.done && payload.event) {
                setEvent(payload.event);
                setProgress(100);
                setLoading(false);
              }
            } catch (parseErr: any) {
              if (parseErr?.message && !parseErr.message.includes("JSON")) {
                throw parseErr; /* re-throw actual pipeline errors */
              }
            }
          }
        }
      } catch (err: any) {
        setError(
          err instanceof Error ? err.message : "Analysis failed or timed out",
        );
        setLoading(false);
      }
    };
  /* ═══════════════════════════════════════════════════════════ */ return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-700">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-2">
            Parse<span className="text-emerald-400">AI</span> Engine
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-500 animate-pulse" />
            Autonomous CTI Event Generation (iocextract + Ollama · 100% Local)
          </p>
        </div>
        {/* Pipeline badge strip */}
        <div className="flex items-center gap-2 flex-wrap">
          {["Scrapling", "iocextract", "Ollama LLM", "Whitelist", "SQLite"].map(
            (label, i) => (
              <span
                key={i}
                className="text-[9px] bg-gray-50 border border-gray-200 text-gray-500 px-2.5 py-1 rounded-full font-black tracking-widest uppercase"
              >
                {label}
              </span>
            ),
          )}
        </div>
      </div>
      {/* ── Input Form ─────────────────────────────────────── */}
      {!loading && !event && (
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden scale-in-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 pointer-events-none" />
          <div className="p-8 relative z-10">
            <form onSubmit={handleAnalyze} className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Target Intelligence URL
                  </label>
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded font-black tracking-widest ">
                    LIVE SSE STREAM
                  </span>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://thehackernews.com/..."
                    className="w-full h-16 bg-gray-50 border border-gray-200 focus:border-green-500 rounded-2xl pl-16 pr-6 text-sm font-bold text-gray-900 transition-all outline-none tracking-widest placeholder:text-gray-600"
                  />
                </div>
              </div>
              {/* Feature badges */}
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-lg ">
                  <ShieldCheck className="w-3 h-3" /> IOC Refanging
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 rounded-lg ">
                  <Cpu className="w-3 h-3" /> qwen2.5-coder
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black text-green-600 uppercase tracking-widest border border-green-300 bg-green-600/10 px-3 py-1.5 rounded-lg ">
                  <Database className="w-3 h-3" /> Whitelist Filter
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black text-amber-400 uppercase tracking-widest border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 rounded-lg ">
                  <Activity className="w-3 h-3" /> Live SSE
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  id="parse-ai-submit-btn"
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-50 disabled:text-gray-600 disabled:shadow-none text-gray-900 font-black px-12 py-4 rounded-2xl transition-all flex items-center gap-4 group"
                >
                  START INGESTION
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
      {/* ── Loading / SSE Stream UI ─────────────────────────── */}
      {loading && (
        <section className="bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden animate-in zoom-in duration-500 relative">
          <div className="absolute inset-0 bg-emerald-500/5 " />
          <div className="p-10 flex flex-col items-center gap-8 relative z-10">
            {/* Title */}
            <div className="text-center">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3 justify-center">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /> AI
                PIPELINE RUNNING
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
                iocextract · Ollama LLM · MISP Schema
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-3xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Pipeline Progress
                </span>
                <span className="text-[10px] font-black text-emerald-400 tabular-nums">
                  {progress}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500 ease-out "
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {/* Phase Stepper */}
            <div className="w-full max-w-3xl grid grid-cols-5 gap-2">
              {PHASES.map((phase, i) => {
                const Icon = phase.icon;
                const isActive = i === activePhase;
                const isDone = i < activePhase || progress === 100;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${isDone ? "border-emerald-500/40 bg-emerald-500/10" : isActive ? "border-white/20 bg-gray-50 " : "border-gray-200 bg-transparent opacity-40"}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isActive ? (
                      <Icon
                        className={`w-4 h-4 ${phase.color} animate-pulse`}
                      />
                    ) : (
                      <Icon className="w-4 h-4 text-gray-600" />
                    )}
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest text-center leading-tight ${isDone ? "text-emerald-400" : isActive ? "text-gray-900" : "text-gray-600"}`}
                    >
                      {phase.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Terminal Log */}
            <div className="w-full max-w-3xl bg-white rounded-2xl p-5 border border-gray-200 font-mono text-[10px] ">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-gray-500 font-black uppercase tracking-widest">
                  Live Backend Pipeline Logs
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">
                    SSE Stream
                  </span>
                </span>
              </div>
              <div className="space-y-1.5 h-[180px] overflow-y-auto custom-scrollbar pr-1">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className="text-emerald-400/90 flex gap-4 animate-in slide-in-from-bottom-2"
                  >
                    <span className="opacity-40 text-gray-500 shrink-0">
                      [{`${i + 1}`.padStart(2, "0")}]
                    </span>
                    <span className="font-medium">{log}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
                {logs.length > 0 && progress < 100 && (
                  <div className="text-emerald-500 animate-pulse mt-2 ml-10">
                    ▋
                  </div>
                )}
                {logs.length === 0 && (
                  <div className="text-gray-600 text-center py-4">
                    Connecting to SSE stream...
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
      {/* ── Error ──────────────────────────────────────────── */}
      {error && !loading && (
        <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex items-center gap-6 text-rose-400 animate-in bounce-in mt-6">
          <div className="bg-rose-500/20 p-3 rounded-2xl border border-rose-500/50 shadow-sm">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-1">
              Pipeline Failed
            </h4>
            <p className="font-bold text-sm text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setProgress(0);
            }}
            className="ml-auto text-[10px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 px-5 py-2.5 rounded-xl transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* ── Result Card ────────────────────────────────────── */}
      {event && !loading && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          {/* Completion banner */}
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-3 ">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              Pipeline complete — {(event.attributes ?? []).length} validated
              IOC attribute(s) stored
            </span>
            <button
              onClick={() => {
                setEvent(null);
                setUrl("");
                setProgress(0);
                setLogs([]);
              }}
              className="ml-auto text-[10px] font-black text-gray-900 hover:text-emerald-300 bg-gray-50 border border-gray-200 hover:border-emerald-500/50 px-6 py-3 rounded-xl transition-all uppercase tracking-widest"
            >
              ANALYZE ANOTHER URL
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden p-8 relative">
            {/* Metadata Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div className="flex gap-4 items-center">
                {getTLPBadge(event.TLP, event.threat_level)}
                <div className="flex gap-2 items-center bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg ">
                  <Tag className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {event.category}
                  </span>
                </div>
                <div className="flex gap-2 items-center bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg ">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {event.date_occured}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                  ID: {event.id}
                </p>
                <p className="text-[9px] font-bold tracking-widest text-gray-600 mt-1">
                  Source: {event.website}
                </p>
              </div>
            </div>
            {/* Main Info */}
            <h2 className="text-2xl font-black text-gray-900 mb-4 leading-tight">
              {event.info}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-200 ">
              {event.description}
            </p>
            {/* MITRE ATT&CK Section */}
            {event.mitre_techniques && event.mitre_techniques.length > 0 && (
              <div className="mb-10">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-orange-500" /> MITRE ATT&CK
                  Techniques
                </h4>
                <div className="flex flex-wrap gap-3">
                  {event.mitre_techniques.map((tech: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl group hover:border-orange-500/50 transition-colors"
                    >
                      <span className="text-[10px] font-black text-orange-400 tabular-nums">
                        {tech.id}
                      </span>
                      <div className="w-[1px] h-3 bg-gray-50" />
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                        {tech.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="mb-10">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Tag className="w-3 h-3 text-emerald-500" /> AI Tags
                </h4>
                <div className="flex flex-wrap gap-3">
                  {event.tags.map((tag: any, i: number) => {
                    const theme = colorMap[tag.color] || colorMap["blue"];
                    return (
                      <span
                        key={i}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black border uppercase tracking-widest shadow-sm ${theme}`}
                      >
                        #{tag.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {/* IOC Attributes */}
            <div>
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Validated
                Attributes (IOCs)
                <span className="ml-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full">
                  Whitelist-filtered
                </span>
              </h4>
              {event.attributes && event.attributes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.attributes.map((attr: any, i: number) => (
                    <div
                      key={i}
                      className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:border-emerald-500/50 transition-colors group "
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                            {attr.type}
                          </span>
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                            {attr.category}
                          </span>
                        </div>
                        <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded uppercase tracking-widest">
                          {attr.role}
                        </span>
                      </div>
                      <div className="relative pl-3 border-l-2 border-emerald-500/50 mb-3 group-hover:border-emerald-400 transition-colors">
                        <p className="font-mono text-sm font-bold text-gray-900 break-all select-all">
                          {attr.value}
                        </p>
                      </div>
                      {/* Geo-IP Enrichment */}
                      {attr.geo_localisation &&
                        attr.geo_localisation.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {attr.geo_localisation.map(
                              (geo: any, j: number) => (
                                <div
                                  key={j}
                                  className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 px-2 py-1 rounded-lg"
                                >
                                  <Globe className="w-3 h-3 text-blue-400" />
                                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                    {geo.city}, {geo.country} — {geo.isp}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      <p
                        className="text-[10px] text-gray-500 font-medium line-clamp-2"
                        title={attr.comment}
                      >
                        {attr.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-10 border border-dashed border-gray-200 rounded-3xl text-gray-500 flex flex-col items-center">
                  <Info className="w-8 h-8 mb-4 opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    No concrete attributes extracted
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

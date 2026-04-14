'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Link as LinkIcon, ShieldAlert, Loader2, ArrowRight, Sparkles, Terminal, Cpu, ShieldCheck, Tag, Clock, Globe, Database, Info } from 'lucide-react';

const ANALYSIS_STEPS = [
  "Initializing ParseAI Ingestion Engine...",
  "Bypassing target anti-bot protections...",
  "Scraping HTML DOM and stripping noise...",
  "Extracting main article content...",
  "Loading local LLM (qwen2.5-coder:3b)...",
  "Running natural language processing...",
  "Mapping entities to CTI schema...",
  "Extracting IPs, Domains, and CVEs...",
  "Assigning MITRE ATT&CK heuristics...",
  "Generating strict JSON event format...",
  "Saving to local database..."
];

const colorMap: Record<string, string> = {
  'red': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  'blue': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'yellow': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'green': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'orange': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  'purple': 'bg-violet-500/10 text-violet-400 border-violet-500/30',
};

const getTLPBadge = (tlp: any[], threatLevel: number | string) => {
  if (tlp && tlp.length > 0) {
    const { name, color } = tlp[0];
    return (
      <span 
        className="px-3 py-1 text-white text-[10px] font-black rounded-lg shadow-lg uppercase tracking-tighter"
        style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}40`, border: `1px solid ${color}80` }}
      >
        {name}
      </span>
    );
  }
  
  if (threatLevel === "CRITICAL" || threatLevel === 0) return <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/50 text-[10px] font-black rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.3)] uppercase tracking-tighter">CRITICAL</span>;
  if (threatLevel === "HIGH" || threatLevel === 1) return <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/50 text-[10px] font-black rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.3)] uppercase tracking-tighter">HIGH</span>;
  if (threatLevel === "MEDIUM" || threatLevel === 2) return <span className="px-3 py-1 bg-violet-500/20 text-violet-400 border border-violet-500/50 text-[10px] font-black rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.3)] uppercase tracking-tighter">MEDIUM</span>;
  return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-[10px] font-black rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] uppercase tracking-tighter">LOW</span>;
};

export default function ParseAIPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const runSequence = async () => {
    setLogs([]);
    for (const step of ANALYSIS_STEPS) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step}`]);
      await new Promise(r => setTimeout(r, 80 + Math.random() * 150));
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setLoading(true); setError(null); setEvent(null);
    runSequence();

    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analysis failed. API unreachable.');
      setEvent(data.event);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Analysis timeout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-2">
            Parse<span className="text-emerald-400">AI</span> Engine
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-500 animate-pulse" />
            Autonomous CTI Event Generation (100% Local)
          </p>
        </div>
      </div>

      {/* Main Tool */}
      {!loading && !event && (
        <section className="bg-[#0a0a0a]/50 backdrop-blur-xl rounded-3xl border border-white/[0.05] shadow-2xl relative overflow-hidden scale-in-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none" />
          
          <div className="p-8 relative z-10">
            <form onSubmit={handleAnalyze} className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Intelligence URL</label>
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded font-black tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">OLLAMA ENGINE</span>
                </div>
                
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                     <LinkIcon className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                   </div>
                  <input 
                    type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://thehackernews.com/..."
                    className="w-full h-16 bg-[#030303] border border-white/[0.05] focus:border-emerald-500/50 rounded-2xl pl-16 pr-6 text-sm font-bold text-white transition-all outline-none shadow-inner tracking-widest placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 py-2">
                 <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <ShieldCheck className="w-3 h-3" /> Auto-Parsing
                 </div>
                 <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                    <Cpu className="w-3 h-3" /> qwen2.5-coder
                 </div>
                  <div className="flex items-center gap-2 text-[9px] font-black text-violet-400 uppercase tracking-widest border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                    <Database className="w-3 h-3" /> Event Mapping
                 </div>
              </div>

              <div className="flex justify-center pt-2">
                <button 
                  type="submit" disabled={loading || !url.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/[0.05] disabled:text-zinc-600 disabled:shadow-none text-white font-black px-12 py-4 rounded-2xl shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] transition-all flex items-center gap-4 group"
                >
                  START INGESTION <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Loading Screen */}
      {loading && (
        <section className="bg-[#030303] rounded-3xl border border-white/[0.1] shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden animate-in zoom-in duration-500 relative">
           <div className="absolute inset-0 bg-emerald-500/10 blur-[60px]" />
           <div className="p-10 flex flex-col items-center relative z-10">
              <div className="relative mb-10 text-center">
                 <div className="w-32 h-32 border-2 border-emerald-500/30 rounded-full border-t-emerald-500 animate-spin shadow-[0_0_30px_rgba(16,185,129,0.4)] mx-auto" />
                 <Bot className="w-10 h-10 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 <div className="mt-8">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">AI ANALYST WORKING</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Generating MISP Event Schema</p>
                 </div>
              </div>
              
              <div className="w-full max-w-3xl bg-[#0a0a0a] rounded-2xl p-6 border border-white/[0.05] font-mono text-[10px] shadow-inner">
                 <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
                    <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-zinc-500 font-black uppercase tracking-widest">Backend Pipeline Logs</span>
                 </div>
                 <div className="space-y-1.5 h-[160px] overflow-hidden custom-scrollbar">
                    {logs.map((log, i) => (
                      <div key={i} className="text-emerald-500/90 flex gap-4 animate-in slide-in-from-bottom-2">
                        <span className="opacity-40 text-zinc-500">[{`${i+1}`.padStart(2, '0')}]</span>
                        <span className="font-medium">{log}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                    {logs.length < ANALYSIS_STEPS.length && (
                      <div className="text-emerald-500 animate-pulse mt-2 ml-10">_</div>
                    )}
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex items-center gap-6 text-rose-400 animate-in bounce-in shadow-[0_0_30px_rgba(244,63,94,0.1)] mt-6">
          <div className="bg-rose-500/20 p-3 rounded-2xl border border-rose-500/50 shadow-lg">
             <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-1">Ingestion Failed</h4>
            <p className="font-bold text-sm text-zinc-300">{error}</p>
          </div>
          <button 
             onClick={() => setError(null)}
             className="ml-auto text-[10px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 px-5 py-2.5 rounded-xl transition-colors"
          >
             Dismiss
          </button>
        </div>
      )}

      {/* Result Card */}
      {event && !loading && (
         <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-between items-end">
               <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-2">Generated Event Payload</h3>
               <button 
                 onClick={() => { setEvent(null); setUrl(''); }}
                 className="text-[10px] font-black text-white hover:text-emerald-300 bg-white/[0.05] border border-white/[0.1] hover:border-emerald-500/50 px-6 py-3 rounded-xl transition-all uppercase tracking-widest"
               >
                  ANALYZE ANOTHER URL
               </button>
            </div>

            <div className="bg-[#0a0a0a]/50 backdrop-blur-xl border border-white/[0.05] rounded-3xl shadow-2xl overflow-hidden p-8 relative">
               
               {/* Metadata Bar */}
               <div className="flex flex-wrap gap-4 items-center justify-between mb-8 pb-6 border-b border-white/[0.05]">
                  <div className="flex gap-4 items-center">
                     {getTLPBadge(event.TLP, event.threat_level)}
                     <div className="flex gap-2 items-center bg-[#030303] border border-white/[0.05] px-3 py-1.5 rounded-lg shadow-inner">
                        <Tag className="w-3 h-3 text-zinc-500" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{event.category}</span>
                     </div>
                     <div className="flex gap-2 items-center bg-[#030303] border border-white/[0.05] px-3 py-1.5 rounded-lg shadow-inner">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phase: {event.analysis}</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">ID: {event.id}</p>
                     <p className="text-[9px] font-bold tracking-widest text-zinc-600 mt-1">Occurred: {event.date_occured} | Source: {event.website}</p>
                  </div>
               </div>

               {/* Main Info */}
               <h2 className="text-2xl font-black text-white mb-4 leading-tight">{event.info}</h2>
               <p className="text-zinc-400 text-sm leading-relaxed mb-10 bg-[#030303] p-6 rounded-2xl border border-white/[0.05] shadow-inner">
                  {event.description}
               </p>

               {/* Tags */}
               {event.tags && event.tags.length > 0 && (
                  <div className="mb-10">
                     <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Tag className="w-3 h-3 text-emerald-500" /> AI Tags
                     </h4>
                     <div className="flex flex-wrap gap-3">
                        {event.tags.map((tag: any, i: number) => {
                           const theme = colorMap[tag.color] || colorMap['blue'];
                           return (
                              <span key={i} className={`px-4 py-2 rounded-xl text-[10px] font-black border uppercase tracking-widest shadow-lg ${theme}`}>
                                 #{tag.name}
                              </span>
                           );
                        })}
                     </div>
                  </div>
               )}

               {/* IOC Attributes */}
               <div>
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <ShieldCheck className="w-3 h-3 text-emerald-500" /> Attributes (IOCs)
                  </h4>
                  {event.attributes && event.attributes.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {event.attributes.map((attr: any, i: number) => (
                           <div key={i} className="bg-[#030303] border border-white/[0.05] rounded-2xl p-5 hover:border-emerald-500/50 transition-colors group shadow-inner">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-3">
                                    <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                                       {attr.type}
                                    </span>
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{attr.category}</span>
                                 </div>
                                 <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded uppercase tracking-widest">
                                    {attr.role}
                                 </span>
                              </div>
                              <div className="relative pl-3 border-l-2 border-emerald-500/50 mb-3 group-hover:border-emerald-400 transition-colors">
                                <p className="font-mono text-sm font-bold text-white break-all select-all">
                                   {attr.value}
                                </p>
                              </div>
                              <p className="text-[10px] text-zinc-500 font-medium line-clamp-2" title={attr.comment}>
                                 {attr.comment}
                              </p>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="text-center p-10 border border-dashed border-white/[0.1] rounded-3xl text-zinc-500 flex flex-col items-center">
                        <Info className="w-8 h-8 mb-4 opacity-50" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No concrete attributes extracted</p>
                     </div>
                  )}
               </div>
               
            </div>
         </div>
      )}

    </div>
  );
}

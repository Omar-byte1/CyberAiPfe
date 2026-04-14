'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot,
  Link,
  ShieldAlert, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Terminal,
  Cpu,
  ShieldCheck,
  Tag,
  Clock,
  Globe,
  Database,
  Info
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

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
  'red': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  'blue': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'yellow': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  'green': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'orange': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'purple': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

const getTLPBadge = (tlp: any[], threatLevel: number | string) => {
  if (tlp && tlp.length > 0) {
    const { name, color } = tlp[0];
    return (
      <span 
        className="px-3 py-1 text-white text-[10px] font-black rounded-full shadow-lg uppercase tracking-tighter"
        style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}60` }}
      >
        {name}
      </span>
    );
  }
  
  // Fallback to threat level (0-3 scale as per V5.0)
  if (threatLevel === "CRITICAL" || threatLevel === 0) return <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)] uppercase tracking-tighter">CRITICAL</span>;
  if (threatLevel === "HIGH" || threatLevel === 1) return <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)] uppercase tracking-tighter">HIGH</span>;
  if (threatLevel === "MEDIUM" || threatLevel === 2) return <span className="px-3 py-1 bg-purple-500 text-white text-[10px] font-black rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] uppercase tracking-tighter">MEDIUM</span>;
  return <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] uppercase tracking-tighter">LOW</span>;
};

export default function ParseAIPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const runSequence = async () => {
    setLogs([]);
    for (const step of ANALYSIS_STEPS) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step}`]);
      // Réduit considérablement le délai artificiel (100ms au lieu de 1000ms+)
      await new Promise(r => setTimeout(r, 80 + Math.random() * 150));
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setLoading(true);
    setError(null);
    setEvent(null);

    const sequencePromise = runSequence();

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
      
      if (!res.ok) {
        throw new Error(data.detail || 'Analysis failed. API unreachable.');
      }

      // Finalisation immédiate une fois que les données arrivent
      setEvent(data.event);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Analysis timeout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Bot className="text-white w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">ParseAI</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">Autonomous CTI Event Generation (100% Local)</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Main Tool */}
      {!loading && !event && (
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden scale-in-center">
          <div className="p-8">
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Intelligence URL</label>
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-black">OLLAMA ENGINE</span>
                </div>
                
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                     <Link className="h-6 w-6 text-slate-400" />
                   </div>
                  <input 
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://thehackernews.com/..."
                    className="w-full h-20 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500/50 rounded-[2rem] pl-16 pr-6 text-lg font-black text-slate-700 dark:text-slate-300 transition-all outline-none shadow-inner tracking-tight placeholder:font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 py-4">
                 <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Auto-Parsing
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-xl">
                    <Cpu className="w-3.5 h-3.5" />
                    qwen2.5-coder
                 </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-purple-500 uppercase tracking-widest bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-xl">
                    <Database className="w-3.5 h-3.5" />
                    Event Mapping
                 </div>
              </div>

              <div className="flex justify-center pt-4">
                <button 
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 py-5 rounded-[2rem] shadow-2xl shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  START INGESTION
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Loading Screen */}
      {loading && (
        <section className="bg-slate-950 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in duration-500">
           <div className="p-10 flex flex-col items-center">
              <div className="relative mb-10 text-center">
                 <div className="w-32 h-32 border-4 border-emerald-500/20 rounded-full border-t-emerald-500 animate-spin" />
                 <Bot className="w-12 h-12 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 <div className="mt-8">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">AI ANALYST WORKING</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Generating MISP Event Schema</p>
                 </div>
              </div>
              
              <div className="w-full max-w-2xl bg-black/40 rounded-3xl p-6 border border-slate-800 font-mono text-[10px]">
                 <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                    <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-slate-400 font-bold uppercase">Backend Pipeline Logs</span>
                 </div>
                 <div className="space-y-1 h-[140px] overflow-hidden">
                    {logs.map((log, i) => (
                      <div key={i} className="text-emerald-500/90 flex gap-3 animate-in slide-in-from-left-2">
                        <span className="opacity-30">{i+1}</span>
                        <span>{log}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                    {logs.length < ANALYSIS_STEPS.length && (
                      <div className="text-white animate-pulse">_</div>
                    )}
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="p-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-[2.5rem] flex items-center gap-6 text-rose-600 animate-in bounce-in duration-300 shadow-xl shadow-rose-500/5 mt-6">
          <div className="bg-rose-600 p-3 rounded-2xl shadow-lg shadow-rose-500/20">
             <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="font-black uppercase tracking-widest text-sm">Ingestion Failed</h4>
            <p className="font-bold opacity-80">{error}</p>
          </div>
          <button 
             onClick={() => { setError(null); }}
             className="ml-auto text-xs font-black bg-rose-100 hover:bg-rose-200 dark:bg-rose-800/30 dark:hover:bg-rose-800/50 px-4 py-2 rounded-xl transition-colors"
          >
             Dismis
          </button>
        </div>
      )}

      {/* Result Card */}
      {event && !loading && (
         <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-between items-end">
               <h3 className="text-xl font-black text-slate-800 dark:text-white px-2">Generated Event Payload</h3>
               <button 
                 onClick={() => { setEvent(null); setUrl(''); }}
                 className="text-xs font-black text-emerald-600 hover:text-white hover:bg-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
               >
                  ANALYZE ANOTHER URL
               </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden p-8 relative">
               
               {/* Metadata Bar */}
               <div className="flex flex-wrap gap-4 items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/50">
                  <div className="flex gap-4 items-center">
                     {getTLPBadge(event.TLP, event.threat_level)}
                     <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">{event.category}</span>
                     </div>
                     <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Phase: {event.analysis}</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black uppercase text-slate-400">ID: {event.id}</p>
                     <p className="text-[10px] font-bold text-slate-500">Occurred: {event.date_occured} | Source: {event.website}</p>
                  </div>
               </div>

               {/* Main Info */}
               <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{event.info}</h2>
               <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-8 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                  {event.description}
               </p>

               {/* Tags */}
               {event.tags && event.tags.length > 0 && (
                  <div className="mb-10">
                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Tag className="w-4 h-4" /> AI Tags
                     </h4>
                     <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag: any, i: number) => {
                           const theme = colorMap[tag.color] || colorMap['blue'];
                           return (
                              <span key={i} className={`px-4 py-2 rounded-xl text-xs font-black border uppercase ${theme}`}>
                                 #{tag.name}
                              </span>
                           );
                        })}
                     </div>
                  </div>
               )}

               {/* IOC Attributes */}
               <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4" /> Attributes (IOCs)
                  </h4>
                  {event.attributes && event.attributes.length > 0 ? (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {event.attributes.map((attr: any, i: number) => (
                           <div key={i} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors group">
                              <div className="flex justify-between items-start mb-3">
                                 <div className="flex items-center gap-2">
                                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded text-[10px] font-black uppercase">
                                       {attr.type}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{attr.category}</span>
                                 </div>
                                 <span className="text-xs font-black text-rose-500/80 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded">
                                    {attr.role}
                                 </span>
                              </div>
                              <p className="font-mono text-sm font-bold text-slate-900 dark:text-white break-all mb-2 select-all relative">
                                 <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-blue-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                 {attr.value}
                              </p>
                              <p className="text-xs text-slate-500 font-medium line-clamp-2" title={attr.comment}>
                                 {attr.comment}
                              </p>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 flex flex-col items-center">
                        <Info className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm font-bold uppercase">No concrete attributes extracted</p>
                     </div>
                  )}
               </div>
               
            </div>
         </div>
      )}

    </div>
  );
}

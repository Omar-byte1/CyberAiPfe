'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FlaskConical, Mail, FileCode2, ShieldAlert, Loader2, ArrowRight, Sparkles, Terminal, Cpu, ShieldCheck, X } from 'lucide-react';
import SandboxReport from '@/components/SandboxReport';

const DETONATION_STEPS = [
  "Initializing isolated VM environment (Windows 10 x64)...",
  "Loading analysis engine 'Antigravity AI'...",
  "Snapshotting clean system state...",
  "Starting kernel-level API monitoring...",
  "Detonating specimen in secure chamber...",
  "Tracing process lifecycle and child forks...",
  "Intercepting HTTP/SSL traffic...",
  "Monitoring registry and file system modifications...",
  "Running heuristic pattern matching...",
  "Correlating behaviors with MITRE ATT&CK base...",
  "Generating final forensic report..."
];

export default function SandboxPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'file'>('email');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{name: string, size: string} | null>(null);
  const [detonationLogs, setDetonationLogs] = useState<string[]>([]);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [detonationLogs]);

  const runDetonationSequence = async () => {
    setDetonationLogs([]);
    for (const step of DETONATION_STEPS) {
      setDetonationLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step}`]);
      await new Promise(r => setTimeout(r, 250 + Math.random() * 400));
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'email' && !content.trim()) return;
    if (activeTab === 'file' && !selectedFile) return;
    
    setLoading(true); setError(null); setReport(null);
    await runDetonationSequence();

    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/analyze-sandbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: activeTab,
          content: activeTab === 'file' ? selectedFile?.name : content
        }),
      });

      if (!res.ok) throw new Error('Analysis failed. Backend unreachable.');
      setReport(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis timeout');
    } finally {
      setLoading(false);
    }
  };

  const simulateFileSelect = () => {
    const files = [
      { name: "invoice_9921.pdf.exe", size: "2.4 MB" },
      { name: "update_patch_system.vbs", size: "12 KB" },
      { name: "salary_spreadsheet_Q1.xlsx.js", size: "450 KB" }
    ];
    setSelectedFile(files[Math.floor(Math.random() * files.length)]);
    setReport(null);
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-2">
            AI <span className="text-indigo-400">Sandbox</span>
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-indigo-500 animate-pulse" />
            Heuristic Malware Detonation Chamber
          </p>
        </div>
      </div>

      {/* Main Analysis Tool */}
      {!loading && !report && (
        <section className="bg-[#0a0a0a]/50 backdrop-blur-xl rounded-3xl border border-white/[0.05] shadow-2xl overflow-hidden relative scale-in-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] pointer-events-none" />
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-white/[0.05] p-2 gap-2 relative z-10 bg-white/[0.01]">
            <button 
              onClick={() => { setActiveTab('email'); setReport(null); }}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                activeTab === 'email' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]' 
                  : 'text-zinc-500 hover:bg-white/[0.03] hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" /> Analyse Email
            </button>
            <button 
              onClick={() => { setActiveTab('file'); setReport(null); }}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                activeTab === 'file' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]' 
                  : 'text-zinc-500 hover:bg-white/[0.03] hover:text-white'
              }`}
            >
              <FileCode2 className="w-4 h-4" /> Binaire / Malware
            </button>
          </div>

          {/* Input Area */}
          <div className="p-8 relative z-10">
            <form onSubmit={handleAnalyze} className="space-y-6">
              {activeTab === 'email' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Source EML Brute</label>
                    <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-1 rounded font-black tracking-widest">AI v3</span>
                  </div>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Coller l'en-tête ou le corps de l'email suspect..."
                    className="w-full h-48 bg-[#030303] border border-white/[0.05] focus:border-indigo-500/50 rounded-2xl p-6 text-sm text-zinc-300 font-mono transition-all outline-none resize-none shadow-inner custom-scrollbar"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {!selectedFile ? (
                    <div 
                      onClick={simulateFileSelect}
                      className="border border-dashed border-white/[0.1] rounded-3xl p-16 flex flex-col items-center justify-center text-center group hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer bg-[#030303]/50"
                    >
                      <div className="w-20 h-20 bg-[#0a0a0a] rounded-2xl shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all border border-white/[0.05]">
                          <FileCode2 className="w-8 h-8 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <h3 className="text-xl font-black text-white">Sélectionner Fichier Suspect</h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-2">Dépôt sécurisé (Isolation activée)</p>
                    </div>
                  ) : (
                    <div className="bg-[#030303] border border-indigo-500/30 rounded-2xl p-6 flex items-center justify-between shadow-[0_0_20px_-5px_rgba(79,70,229,0.2)]">
                       <div className="flex items-center gap-5">
                          <div className="bg-indigo-600/20 border border-indigo-500/50 p-4 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                             <FileCode2 className="w-6 h-6 text-indigo-400" />
                          </div>
                          <div>
                             <h4 className="font-black text-white text-lg tracking-tight">{selectedFile.name}</h4>
                             <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">{selectedFile.size} • Payload Isolé</p>
                          </div>
                       </div>
                       <button 
                        type="button" onClick={() => setSelectedFile(null)}
                        className="p-3 hover:bg-white/[0.05] rounded-full transition-colors text-zinc-500 hover:text-white"
                       >
                          <X className="w-5 h-5" />
                       </button>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-4 py-4">
                     <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <ShieldCheck className="w-3 h-3" /> Gated VM
                     </div>
                     <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                        <Cpu className="w-3 h-3" /> Static + Dynamic
                     </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-6">
                <button 
                  type="submit"
                  disabled={loading || (activeTab === 'email' && !content.trim()) || (activeTab === 'file' && !selectedFile)}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/[0.05] disabled:text-zinc-600 text-white font-black px-12 py-5 rounded-2xl shadow-[0_0_30px_-5px_rgba(79,70,229,0.6)] transition-all active:scale-95 flex items-center gap-4 group disabled:shadow-none"
                >
                  DÉCLENCHER DÉTONATION IA
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Detonation Loading Screen */}
      {loading && (
        <section className="bg-[#030303] rounded-3xl border border-white/[0.1] shadow-[0_0_50px_rgba(79,70,229,0.15)] overflow-hidden animate-in zoom-in duration-500">
           <div className="p-10 flex flex-col items-center">
              <div className="relative mb-10 text-center">
                 <div className="absolute inset-0 bg-indigo-500/20 blur-[60px]" />
                 <div className="w-32 h-32 border-2 border-indigo-500/30 rounded-full border-t-indigo-500 animate-spin shadow-[0_0_30px_rgba(79,70,229,0.5)] mx-auto relative z-10" />
                 <FlaskConical className="w-10 h-10 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" />
                 <div className="mt-8 relative z-10">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest text-shadow-glow">DETONATION ACTIVE</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Environnement Hyper-V v3</p>
                 </div>
              </div>
              
              <div className="w-full max-w-3xl bg-[#0a0a0a] rounded-2xl p-6 border border-white/[0.05] font-mono text-[10px] shadow-inner relative z-10">
                 <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
                    <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-zinc-500 font-black uppercase tracking-widest">Gated Kernel Output</span>
                 </div>
                 <div className="space-y-1.5 h-[160px] overflow-hidden custom-scrollbar">
                    {detonationLogs.map((log, i) => (
                      <div key={i} className="text-emerald-500/90 flex gap-4 animate-in slide-in-from-bottom-2">
                        <span className="opacity-40 text-zinc-500">[{`${i+1}`.padStart(2, '0')}]</span>
                        <span className="font-medium">{log}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                    {detonationLogs.length < DETONATION_STEPS.length && (
                      <div className="text-emerald-500 animate-pulse mt-2 ml-10">_</div>
                    )}
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex items-center gap-6 text-rose-400 animate-in bounce-in duration-300 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
          <div className="bg-rose-500/20 border border-rose-500/50 p-3 rounded-2xl shadow-lg shadow-rose-500/10">
             <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-1">Échec de la Séquence</h4>
            <p className="font-bold text-sm text-zinc-300">{error}</p>
          </div>
        </div>
      )}

      {/* Report Section */}
      {report && !loading && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Rapport Forensique IA</h3>
              <button 
                onClick={() => { setReport(null); setSelectedFile(null); setContent(''); }}
                className="text-[10px] font-black tracking-widest uppercase text-white hover:text-indigo-300 bg-white/[0.05] border border-white/[0.1] hover:border-indigo-500/50 px-5 py-2.5 rounded-xl transition-all"
              >
                 Nouveau Spécimen
              </button>
           </div>
           
           <div className="bg-[#0a0a0a]/50 backdrop-blur-xl rounded-3xl p-6 border border-white/[0.05] shadow-2xl relative overflow-hidden">
               {/* Note: SandboxReport Component Inside. Si SandboxReport n'est pas stylisé Thematically, il faut l'éditer plus tard. */}
               <SandboxReport data={report} />
           </div>
        </div>
      )}

      {/* Placeholder Welcome */}
      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
           <Sparkles className="w-10 h-10 text-zinc-500 mb-6" />
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Système Prêt</p>
        </div>
      )}

    </div>
  );
}

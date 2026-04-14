'use client';

import React, { useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Terminal, Search, Database, Network, Clock, ExternalLink, ChevronRight, Fingerprint, Loader2, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function SandboxReport({ data }: { data: any }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!data) return null;

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    reportRef.current.classList.add('pdf-mode');
    try {
      await new Promise(r => requestAnimationFrame(r));
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#030303' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, Math.min(imgHeight, pdf.internal.pageSize.getHeight()));
      pdf.save(`Forensic_Report_${data.verdict || 'Analysis'}_${Date.now()}.pdf`);
    } finally {
      if (reportRef.current) reportRef.current.classList.remove('pdf-mode');
      setIsExporting(false);
    }
  };

  const handleAddToIncident = async () => {
    setIsSaving(true); setSavedSuccess(false);
    const incidentData = { id: `INC-${Math.floor(Math.random() * 90000) + 10000}`, type: data.type || "Unknown Analysis", verdict: data.verdict, risk_score: data.risk_score, timestamp: new Date().toISOString(), details: data };
    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(incidentData)
      });
      if (!res.ok) throw new Error("API Failure");
      setSavedSuccess(true); setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      alert("Erreur lors de l'enregistrement de l'incident.");
    } finally {
      setIsSaving(false);
    }
  };

  const isMalicious = data.status === 'Malicious' || data.verdict?.toLowerCase().includes('phishing') || data.verdict?.toLowerCase().includes('malware');

  return (
    <div className="space-y-6">
      <div ref={reportRef} id="report-content" className="animate-in fade-in slide-in-from-bottom-5 duration-700 p-1">
        
        {/* Summary Header */}
        <div className={`p-8 rounded-3xl border ${
          isMalicious ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'
        } mb-8 flex flex-col md:flex-row gap-8 items-center justify-between relative overflow-hidden backdrop-blur-md`}>
          <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] pointer-events-none ${isMalicious ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`} />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-xl ${
              isMalicious ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.4)]' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
            }`}>
              {isMalicious ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{data.verdict}</h2>
                 <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                   isMalicious ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                 }`}>
                   Risk Score: {data.risk_score}/100
                 </span>
              </div>
              <p className="text-zinc-400 text-xs font-medium max-w-xl leading-relaxed">{data.recommendation}</p>
            </div>
          </div>

          <div className="flex gap-6 text-white relative z-10 bg-[#030303] p-4 rounded-2xl border border-white/[0.05] shadow-inner">
             <div className="text-right">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Analysis Type</p>
                <p className="font-bold text-xs">{data.type}</p>
             </div>
             <div className="w-px h-8 bg-white/[0.1] self-center" />
             <div className="text-right">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Analyzed At</p>
                <p className="font-bold text-xs">{new Date(data.timestamp).toLocaleTimeString()}</p>
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-[#030303] rounded-3xl border border-white/[0.05] overflow-hidden shadow-inner">
              <div className="px-6 py-5 border-b border-white/[0.05] flex items-center gap-3 bg-white/[0.02]">
                 <Search className="w-4 h-4 text-indigo-500" />
                 <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Security Indicators</h3>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {data.indicators?.map((indicator: any, idx: number) => (
                  <div key={idx} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${indicator.risk === 'Critical' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' : indicator.risk === 'High' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'}`} />
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest w-20">{indicator.type}</span>
                      <span className="text-xs font-bold text-zinc-300">{indicator.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {data.behavior_logs && (
              <section className="bg-black rounded-3xl border border-white/[0.08] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
                   <div className="flex items-center gap-3">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Sandbox Detonation Logs</h3>
                   </div>
                </div>
                <div className="p-6 font-mono text-[10px] leading-relaxed overflow-y-auto max-h-[300px] custom-scrollbar">
                  {data.behavior_logs.map((log: string, idx: number) => (
                    <div key={idx} className={`flex gap-4 mb-2 ${log.includes('[THREAT]') ? 'text-rose-400 font-bold' : 'text-emerald-500/90'}`}>
                      <span className="opacity-40 text-zinc-500 select-none">[{idx.toString().padStart(3, '0')}]</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            {data.mitre_attack && (
              <section className="bg-indigo-600/10 rounded-3xl p-6 border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] pointer-events-none" />
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">ATT&CK® Mapping</h3>
                </div>
                <div className="space-y-3 relative z-10">
                  {data.mitre_attack.map((tech: any) => (
                    <div key={tech.id} className="bg-[#030303] p-4 rounded-xl border border-indigo-500/20 shadow-inner">
                      <p className="text-[9px] font-black text-indigo-500/70 uppercase tracking-widest mb-1">{tech.id}</p>
                      <p className="font-bold text-xs text-indigo-100">{tech.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Container */}
      <section className="bg-[#0a0a0a] rounded-3xl border border-white/[0.05] p-8 flex flex-col md:flex-row gap-6 items-center justify-between shadow-lg">
         <div className="flex items-center gap-5">
            <div className="bg-white/[0.03] border border-white/[0.05] p-4 rounded-2xl">
               <Fingerprint className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
               <h3 className="text-sm font-black text-white uppercase tracking-widest">Forensic Post-Actions</h3>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Execute compliance and archival workflows</p>
            </div>
         </div>
         
         <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleExportPDF} disabled={isExporting}
              className="flex items-center gap-3 px-6 py-4 bg-white/[0.03] border border-white/[0.1] text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/[0.08] active:scale-95 transition-all disabled:opacity-50"
            >
               {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <ExternalLink className="w-4 h-4 text-indigo-400" />}
               {isExporting ? "Exporting..." : "Generate PDF"}
            </button>
            <button 
              onClick={handleAddToIncident} disabled={isSaving || savedSuccess}
              className={`flex items-center gap-3 px-8 py-4 font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-70 disabled:shadow-none ${
                savedSuccess ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
              }`}
            >
               {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Database className="w-4 h-4" />}
               {isSaving ? "Saving..." : savedSuccess ? "Case Saved" : "Add to Incident Case"}
            </button>
         </div>
      </section>
    </div>
  );
}

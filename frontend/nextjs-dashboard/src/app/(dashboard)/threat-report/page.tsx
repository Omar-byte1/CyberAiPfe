'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrainCircuit, ShieldAlert, Sparkles, ArrowRight, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAlertContext } from '@/contexts/AlertContext';

interface ThreatReportItem {
  cve_id: string;
  prediction: string;
  recommendation: string;
  soc_level: string;
}

export default function ThreatReportPage() {
  const { alerts } = useAlertContext();
  const [report, setReport] = useState<ThreatReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [reportsPerPage] = useState<number>(4);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setLoading(false); setError(null);
      
      const sorted = [...alerts].sort((a, b) => (b.threat_score || 0) - (a.threat_score || 0));
      const distinctAlerts = [];
      const seenCves = new Set();
      
      for (const alert of sorted) {
        if (!seenCves.has(alert.cve_id)) {
          seenCves.add(alert.cve_id);
          distinctAlerts.push(alert);
        }
      }

      setReport(distinctAlerts.map(a => ({
        cve_id: a.cve_id,
        prediction: a.cve_id === 'ML-ANOMALY' 
          ? "Behavioral analytics indicate an active zero-day lateral movement attempt targeting internal subnets."
          : `Threat actor is attempting to exploit ${a.cve_id} to gain initial access.`,
        recommendation: a.cve_id === 'ML-ANOMALY'
          ? "Isolate anomalous hosts immediately and analyze EDR memory dumps."
          : `Apply emergency patch for ${a.cve_id} and deploy blocking WAF rules.`,
        soc_level: a.soc_level || (a.threat_score && a.threat_score >= 9 ? 'Critical - Level 3' : 'High - Level 2')
      })));
      return; 
    }

    const loadThreatReport = async () => {
      try {
        setLoading(true); setError(null);
        const token = window.localStorage.getItem('token');
        const res = await fetch('http://127.0.0.1:8000/threat-report', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        setReport(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load threat report.');
      } finally {
        setLoading(false);
      }
    };
    loadThreatReport();
  }, [alerts]);

  const exportPDF = async () => {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) return;

    try {
      setIsExporting(true);
      reportElement.classList.add('pdf-mode');
      await new Promise(resolve => requestAnimationFrame(resolve));
      const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true, backgroundColor: '#030303' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, Math.min(imgHeight, pdf.internal.pageSize.getHeight()));
      pdf.save('threat-report.pdf');
    } finally {
      reportElement.classList.remove('pdf-mode');
      setIsExporting(false);
    }
  };

  const currentReports = report.slice((currentPage - 1) * reportsPerPage, currentPage * reportsPerPage);
  const totalPages = Math.ceil(report.length / reportsPerPage) || 1;
  useEffect(() => setCurrentPage(1), [report.length]);

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-8 animate-in fade-in duration-700 pb-10">
      
      <section className="relative overflow-hidden rounded-[32px] border border-white/[0.05] bg-[#0a0a0a]/50 backdrop-blur-2xl p-10 shadow-2xl">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-600/20 blur-[80px] pointer-events-none" />
        <div className="absolute left-0 bottom-0 h-48 w-48 rounded-full bg-emerald-600/10 blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs font-bold uppercase tracking-widest text-violet-400">
              <BrainCircuit className="h-4 w-4" /> Analyse Forensique IA
            </p>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight">
              Rapports <span className="text-violet-400">Synaptiques</span>
            </h1>
            <p className="max-w-2xl text-sm text-zinc-400 font-medium">
              Générés automatiquement par le réseau de neurones en réponse aux menaces actives détectées sur l'infrastructure.
            </p>
          </div>
          
          <button
            onClick={exportPDF}
            disabled={isExporting || loading || !!error}
            className="flex items-center gap-2 h-12 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)] whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-violet-200" />
            {isExporting ? 'Génération...' : 'Exporter PDF'}
          </button>
        </div>
      </section>

      <div id="report-content" className="space-y-6">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-3xl bg-[#0a0a0a]/50 border border-white/[0.05]" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 flex items-center justify-center">
            <p className="text-sm font-bold tracking-widest uppercase text-rose-400 shadow-rose-500/20">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentReports.map((item, index) => (
              <article
                key={`${item.cve_id}-${index}`}
                className="group relative rounded-3xl border border-white/[0.05] bg-[#0a0a0a]/50 backdrop-blur-xl p-8 hover:bg-[#0f0f0f]/80 transition-all hover:-translate-y-1 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-[50px] pointer-events-none group-hover:bg-violet-500/10 transition-colors" />
                
                <div className="flex items-start justify-between gap-4 mb-8 border-b border-white/[0.05] pb-6 relative z-10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Cible Identifiée</p>
                    <p className="font-mono text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                      {item.cve_id || 'ML-ANOMALY'}
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center justify-center shadow-lg ${
                    item.soc_level.toLowerCase().includes('3') || item.soc_level.toLowerCase().includes('critical')
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                    : item.soc_level.toLowerCase().includes('2')
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {item.soc_level}
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="rounded-2xl border border-white/[0.03] bg-[#030303] p-5 shadow-inner">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-400 mb-2">
                       Prédiction Synaptique <Sparkles className="h-3 w-3" />
                    </p>
                    <p className="text-sm text-zinc-300 font-medium leading-relaxed">{item.prediction}</p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.03] bg-[#030303] p-5 shadow-inner">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
                       Directive Stratégique <ShieldAlert className="h-3 w-3" />
                    </p>
                    <p className="text-sm text-zinc-300 font-medium leading-relaxed">{item.recommendation}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.05] relative z-10 flex justify-end">
                  <Link
                    href={`/alerts?cve=${encodeURIComponent(item.cve_id || 'ML-ANOMALY')}`}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover/link:text-white hover:text-violet-400 transition-colors"
                  >
                    Investiguer Logs <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && report.length > 0 && (
          <div className="flex justify-center items-center gap-4 py-8">
            <button 
              disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} 
              className="px-5 py-2.5 bg-[#0a0a0a]/50 backdrop-blur-xl border border-white/[0.05] rounded-xl font-bold uppercase tracking-widest text-[10px] text-zinc-400 hover:bg-white/[0.05] hover:text-white disabled:opacity-50 transition-all"
            >
              Précédent
            </button>
            <div className="px-6 py-2.5 bg-[#030303] rounded-xl border border-white/[0.05] text-[10px] font-black uppercase tracking-widest text-zinc-300">
              Page {currentPage} / {totalPages}
            </div>
            <button 
              disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} 
              className="px-5 py-2.5 bg-[#0a0a0a]/50 backdrop-blur-xl border border-white/[0.05] rounded-xl font-bold uppercase tracking-widest text-[10px] text-zinc-400 hover:bg-white/[0.05] hover:text-white disabled:opacity-50 transition-all"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

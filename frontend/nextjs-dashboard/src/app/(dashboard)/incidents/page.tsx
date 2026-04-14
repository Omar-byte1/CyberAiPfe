'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Clock, Search, Filter, ChevronRight, Database, History, Info, Loader2, Trash2, ExternalLink as DownloadIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [incidentsPerPage] = useState(5);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/incidents', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) setIncidents(await res.json());
    } catch (err) {
      console.error("Failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!modalRef.current) return;
    setIsExporting(true);
    modalRef.current.classList.add('pdf-mode');
    try {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const canvas = await html2canvas(modalRef.current, { scale: 2, useCORS: true, backgroundColor: '#030303' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Incident_Report_${selectedIncident.id}_${Date.now()}.pdf`);
    } finally {
      if (modalRef.current) modalRef.current.classList.remove('pdf-mode');
      setIsExporting(false);
    }
  };

  const filteredIncidents = incidents.filter(inc => 
    inc.verdict.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastIncident = currentPage * incidentsPerPage;
  const indexOfFirstIncident = indexOfLastIncident - incidentsPerPage;
  const currentIncidents = filteredIncidents.slice(indexOfFirstIncident, indexOfLastIncident);
  const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage) || 1;

  useEffect(() => setCurrentPage(1), [searchTerm]);

  const stats = {
    total: incidents.length,
    critical: incidents.filter(i => i.risk_score >= 80).length,
    medium: incidents.filter(i => i.risk_score < 80 && i.risk_score > 30).length,
    clean: incidents.filter(i => i.risk_score <= 30).length,
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-2">
            Incident <span className="text-blue-500">History</span>
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500 animate-pulse" />
            Digital forensics & threat investigation records
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Cases', value: stats.total, color: 'blue' },
          { label: 'Critical', value: stats.critical, color: 'rose' },
          { label: 'Warning', value: stats.medium, color: 'amber' },
          { label: 'Clean', value: stats.clean, color: 'emerald' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0a0a0a]/50 backdrop-blur-xl p-6 rounded-3xl border border-white/[0.05] shadow-2xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/10 blur-[40px] pointer-events-none group-hover:bg-${stat.color}-500/20 transition-colors`} />
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 relative z-10">{stat.label}</p>
            <p className={`text-4xl font-black text-${stat.color}-400 relative z-10`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-[#0a0a0a]/50 backdrop-blur-xl rounded-3xl border border-white/[0.05] shadow-2xl overflow-hidden min-h-[500px] relative">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none" />
        
        {/* Toolbar */}
        <div className="p-6 border-b border-white/[0.05] flex flex-col md:flex-row gap-4 items-center justify-between relative z-10 bg-white/[0.02]">
           <div className="relative group w-full md:w-96 bg-[#030303] rounded-2xl border border-white/[0.05] flex items-center px-4 transition-all focus-within:border-blue-500/50 shadow-inner">
              <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID or Verdict..."
                className="w-full bg-transparent border-none text-white font-medium px-4 py-3.5 outline-none placeholder:text-zinc-600 text-xs"
              />
           </div>
           <button className="flex items-center gap-2 px-6 py-3.5 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.05] rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all shadow-lg">
              <Filter className="w-4 h-4 text-blue-500" /> Filter Records
           </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 opacity-60 relative z-10">
             <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Retrieving Forensics Database...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 opacity-40 relative z-10">
             <Database className="w-12 h-12 text-zinc-600 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No incident records found</p>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="divide-y divide-white/[0.03] max-h-[600px] overflow-y-auto custom-scrollbar">
              {currentIncidents.map((incident) => (
                <div 
                  key={incident.id} 
                  className="group p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-110 ${
                      incident.risk_score >= 80 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]' : 
                      incident.risk_score > 30 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]'
                    }`}>
                      {incident.risk_score >= 80 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1">
                         <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest px-2 py-0.5 border border-blue-500/30 bg-blue-500/10 rounded-lg">
                           {incident.id}
                         </span>
                         <h3 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-blue-300 transition-colors">{incident.verdict}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                         <div className="flex items-center gap-1.5 border border-white/[0.05] bg-black/20 px-2 py-1 rounded">
                            <Clock className="w-3 h-3 text-blue-500/70" />
                            {new Date(incident.timestamp).toLocaleDateString()} at {new Date(incident.timestamp).toLocaleTimeString()}
                         </div>
                         <div className="flex items-center gap-1.5 border border-white/[0.05] bg-black/20 px-2 py-1 rounded">
                            <ShieldAlert className="w-3 h-3 text-rose-500/70" />
                            {incident.type}
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                     <div className="text-right hidden md:block">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Risk Intensity</p>
                        <div className="flex items-center gap-3">
                           <div className="h-1.5 w-24 bg-[#030303] border border-white/[0.05] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] ${incident.risk_score >= 80 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${incident.risk_score}%` }} />
                           </div>
                           <span className="text-xs font-black text-zinc-300">{incident.risk_score}%</span>
                        </div>
                     </div>
                     <button className="w-10 h-10 flex items-center justify-center bg-white/[0.03] border border-white/[0.05] rounded-xl group-hover:bg-blue-600 group-hover:border-blue-500 text-zinc-400 group-hover:text-white transition-all shadow-[0_0_15px_-3px_transparent] group-hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.5)]">
                        <ChevronRight className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.05] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.01]">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Showing {indexOfFirstIncident + 1}-{Math.min(indexOfLastIncident, filteredIncidents.length)} of {filteredIncidents.length} Records
              </p>
              <div className="flex items-center gap-3">
                <button 
                  disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                  className="px-5 py-2.5 bg-[#0a0a0a]/50 backdrop-blur-xl border border-white/[0.05] rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white disabled:opacity-50 transition-all"
                >
                  Previous
                </button>
                <div className="px-6 py-2.5 bg-[#030303] border border-white/[0.05] rounded-xl text-[10px] text-zinc-300 font-black uppercase tracking-widest">
                  {currentPage} / {totalPages}
                </div>
                <button 
                  disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}
                  className="px-5 py-2.5 bg-[#0a0a0a]/50 backdrop-blur-xl border border-white/[0.05] rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white disabled:opacity-50 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030303]/80 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setSelectedIncident(null)}>
           <div ref={modalRef} id="report-content" className="relative w-full max-w-4xl bg-[#0a0a0a] rounded-[2.5rem] shadow-[0_0_50px_rgba(59,130,246,0.15)] border border-white/[0.08] overflow-hidden animate-in zoom-in-95 duration-300 h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none" />
              
              <div className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02] relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="bg-[#030303] p-4 rounded-2xl border border-white/[0.05] shadow-inner">
                       <ShieldAlert className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-white uppercase tracking-tighter">{selectedIncident.verdict}</h2>
                       <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Ref: {selectedIncident.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedIncident(null)} className="w-10 h-10 bg-[#030303] border border-white/[0.05] hover:border-white/[0.2] hover:bg-white/[0.05] rounded-xl flex items-center justify-center transition-all text-zinc-500 hover:text-white">
                    <Trash2 className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar relative z-10">
                 
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Risk Score', value: `${selectedIncident.risk_score}%` },
                      { label: 'Analysis At', value: new Date(selectedIncident.timestamp).toLocaleTimeString() },
                      { label: 'Type', value: selectedIncident.type },
                      { label: 'Status', value: selectedIncident.risk_score > 70 ? 'CRITICAL' : 'REVIEW REQ' }
                    ].map(m => (
                      <div key={m.label} className="bg-[#030303] border border-white/[0.05] p-5 rounded-2xl shadow-inner">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{m.label}</p>
                        <p className="text-lg font-black text-white">{m.value}</p>
                      </div>
                    ))}
                 </div>

                 {selectedIncident.details?.indicators && (
                   <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 flex items-center gap-2">
                        <Database className="w-3 h-3 text-blue-500" /> Correlated Indicators
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedIncident.details.indicators.map((ind: any, i: number) => (
                          <div key={i} className="flex items-center gap-4 bg-[#030303] p-4 rounded-xl border border-white/[0.05]">
                             <div className={`w-2 h-2 rounded-full ${ind.risk === 'Critical' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]'}`} />
                             <div className="flex-1">
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{ind.type}</p>
                                <p className="text-xs font-bold text-zinc-300 mt-1">{ind.detail}</p>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Forensic Log Extract</h4>
                    <div className="bg-[#030303] p-6 rounded-2xl font-mono text-[10px] leading-relaxed text-blue-400 border border-white/[0.05] overflow-x-auto shadow-inner">
                       <pre>{JSON.stringify(selectedIncident.details, null, 2)}</pre>
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t border-white/[0.05] flex justify-end gap-4 bg-white/[0.01] relative z-10">
                 <button 
                    onClick={handleExportPDF} disabled={isExporting}
                    className="px-6 py-3 bg-[#030303] border border-white/[0.1] rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-3 hover:bg-white/[0.05] transition-all disabled:opacity-50"
                  >
                     {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <DownloadIcon className="w-4 h-4 text-blue-500" />}
                     {isExporting ? 'Exporting...' : 'Export PDF'}
                 </button>
                 <button onClick={() => setSelectedIncident(null)} className="px-8 py-3 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.1] hover:border-white/[0.2] transition-all">
                    Close Case
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Info Notice */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
        <div className="bg-blue-500/20 p-5 rounded-2xl border border-blue-500/30 relative z-10">
           <Info className="w-8 h-8 text-blue-400" />
        </div>
        <div className="space-y-2 text-center md:text-left relative z-10">
           <h3 className="text-xl font-black uppercase tracking-tighter text-blue-100">Reporting Digital Compliance</h3>
           <p className="text-xs font-medium text-blue-200/70 max-w-2xl leading-relaxed">
             This dashboard displays a historical record of all incidents reported via the AI Sandbox or SOC actions. Use this history for compliance audits and cross-departmental incident reviews.
           </p>
        </div>
      </div>

    </div>
  );
}

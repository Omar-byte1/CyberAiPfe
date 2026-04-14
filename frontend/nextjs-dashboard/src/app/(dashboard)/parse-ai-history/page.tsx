'use client';

import React, { useState, useEffect } from 'react';
import { 
  History,
  Download,
  ShieldCheck,
  Tag,
  Clock,
  Loader2,
  Calendar,
  Globe,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

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

const colorThemeMap: Record<string, string> = {
  'red': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  'blue': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'yellow': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  'green': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'orange': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'purple': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

// --- Export Function ---
const exportEventToJson = (event: any) => {
  const jsonString = JSON.stringify(event, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `cti_event_${event.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ParseAIHistoryPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/cti-events', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, eventId: number) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:8000/cti-events/${eventId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error('Failed to delete event');
      
      // Update local state to remove the event instantly
      setEvents(prev => prev.filter(ev => ev.local_id !== eventId));
    } catch (err: any) {
      alert(err.message || 'Error while deleting');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE) || 1;
  const paginatedEvents = events.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
              <History className="text-white w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">ParseAI History</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">Database of all locally generated CTI events</p>
        </div>
        <ThemeToggle />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
           <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-500 font-bold rounded-xl border border-rose-200">{error}</div>
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800">
           <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
           <h3 className="text-xl font-black text-slate-600 dark:text-slate-400">No Events Yet</h3>
           <p className="text-slate-500">Go to the ParseAI Engine to ingest your first URL.</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-6">
            {paginatedEvents.map((event) => (
              <div key={event.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden relative">
                
                {/* Card Header (Always Visible) */}
                <div 
                   className="p-6 cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group"
                   onClick={() => toggleExpand(event.id)}
                >
                    <div className="flex items-center gap-4 flex-1">
                       {getTLPBadge(event.TLP, event.threat_level)}
                       <div>
                          <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors line-clamp-1">{event.info}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-bold">
                             <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{event.date_occured}</span>
                             <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{event.website}</span>
                             <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{event.category}</span>
                          </div>
                       </div>
                    </div>
                    
                        <div className="flex items-center gap-2">
                           {/* Delete Button */}
                           <button
                              onClick={(e) => handleDelete(e, event.local_id)}
                              className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 p-2 rounded-xl transition-colors shadow-sm"
                              title="Delete Event"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>

                           {/* Export Button inside header */}
                           <button
                              onClick={(e) => { e.stopPropagation(); exportEventToJson(event); }}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 p-2 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                              title="Export JSON"
                           >
                              <Download className="w-4 h-4" />
                              <span className="text-xs font-black uppercase tracking-wider hidden md:block px-1">Export</span>
                           </button>
                        </div>
                       
                       <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full">
                          {expandedId === event.id ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                       </div>
                     </div>
   
                 {/* Card Details (Expanded) */}
                {expandedId === event.id && (
                   <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                      <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl mb-6 shadow-inner text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                         {event.description}
                      </div>
  
                      <div className="flex flex-wrap gap-2 mb-6">
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center">Tags:</span>
                         {event.tags?.map((tag: any, i: number) => {
                             const theme = colorThemeMap[tag.color] || colorThemeMap['blue'];
                             return (
                                <span key={i} className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase ${theme}`}>
                                   #{tag.name}
                                </span>
                             );
                          })}
                      </div>
  
                      {event.attributes && event.attributes.length > 0 && (
                         <div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <ShieldCheck className="w-4 h-4" /> Extracted Attributes
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                               {event.attributes.map((attr: any, i: number) => (
                                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                                     <div className="flex items-center gap-2">
                                        <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                                           {attr.type}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{attr.category}</span>
                                     </div>
                                     <span className="text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded uppercase">{attr.role}</span>
                                     <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 break-all mb-1 select-all">{attr.value}</p>
                                     <p className="text-[10px] text-slate-500 line-clamp-1">{attr.comment}</p>
                                  </div>
                               ))}
                            </div>
                         </div>
                      )}
                   </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-3xl shadow-sm">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-sm font-black uppercase text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 rounded-xl transition"
              >
                Previous
              </button>
              
              <div className="text-sm font-bold text-slate-500">
                Page <span className="text-indigo-600 dark:text-indigo-400">{currentPage}</span> of {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="text-sm font-black uppercase text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 rounded-xl transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

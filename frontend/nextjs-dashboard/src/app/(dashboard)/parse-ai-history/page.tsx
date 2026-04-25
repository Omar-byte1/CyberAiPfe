"use client";
import React, { useState, useEffect } from "react";
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
  Trash2,
} from "lucide-react";
const getTLPBadge = (tlp: any[], threatLevel: number | string) => {
  if (tlp && tlp.length > 0) {
    const { name, color } = tlp[0];
    return (
      <span
        className="px-3 py-1 text-gray-900 text-[9px] font-black rounded-lg shadow-sm uppercase tracking-widest"
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
      <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/50 text-rose-400 text-[9px] font-black rounded-lg uppercase tracking-widest">
        CRITICAL
      </span>
    );
  if (threatLevel === "HIGH" || threatLevel === 1)
    return (
      <span className="px-3 py-1 bg-orange-500/20 border border-orange-500/50 text-orange-400 text-[9px] font-black rounded-lg uppercase tracking-widest">
        HIGH
      </span>
    );
  if (threatLevel === "MEDIUM" || threatLevel === 2)
    return (
      <span className="px-3 py-1 bg-green-600/20 border border-green-500 text-green-600 text-[9px] font-black rounded-lg uppercase tracking-widest">
        MEDIUM
      </span>
    );
  return (
    <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[9px] font-black rounded-lg uppercase tracking-widest">
      LOW
    </span>
  );
};
const colorThemeMap: Record<string, string> = {
  red: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  yellow: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  purple: "bg-green-600/10 text-green-600 border-green-300",
};
const exportEventToJson = (event: any) => {
  const jsonString = JSON.stringify(event, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
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
    const fetchEvents = async () => {
      try {
        const token = window.localStorage.getItem("token");
        const res = await fetch("http://127.0.0.1:8000/cti-events", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch events");
        setEvents(await res.json());
      } catch (err: any) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);
  const handleDelete = async (e: React.MouseEvent, eventId: number) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
      )
    )
      return;
    try {
      const token = window.localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8000/cti-events/${eventId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to delete event");
      setEvents((prev) => prev.filter((ev) => ev.local_id !== eventId));
    } catch (err: any) {
      alert(err.message || "Error while deleting");
    }
  };
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));
  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE) || 1;
  const paginatedEvents = events.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-2">
            ParseAI <span className="text-green-600">History</span>
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 flex items-center gap-2">
            <History className="w-4 h-4 text-green-600 animate-pulse" />
            Database of Locally Generated CTI Events
          </p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 text-rose-400 font-bold tracking-widest text-[10px] uppercase rounded-2xl border border-rose-500/30">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-gray-200 shadow-sm">
          <History className="w-16 h-16 text-gray-600 mx-auto mb-6" />
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">
            No Events Yet
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
            Go to the ParseAI Engine to ingest your first URL.
          </p>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-6">
            {paginatedEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-3xl shadow-sm hover:border-gray-200 transition-all overflow-hidden relative group"
              >
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-600/5 pointer-events-none group-hover:bg-green-600/10 transition-colors" />
                {/* Card Header (Always Visible) */}
                <div
                  className="p-6 cursor-pointer flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative z-10"
                  onClick={() => toggleExpand(event.id)}
                >
                  <div className="flex items-center gap-6 flex-1">
                    {getTLPBadge(event.TLP, event.threat_level)}
                    <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider group-hover:text-green-600 transition-colors line-clamp-1">
                        {event.info}
                      </h3>
                      <div className="flex items-center gap-4 text-[10px] text-gray-500 mt-2 font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-green-600/50" />
                          {event.date_occured}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-emerald-500/50" />
                          {event.website}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-blue-500/50" />
                          {event.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleDelete(e, event.local_id)}
                      className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 p-2.5 rounded-xl transition-colors shadow-sm"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportEventToJson(event);
                      }}
                      className="bg-gray-50 border border-gray-200 hover:bg-gray-50 text-gray-900 p-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                      title="Export JSON"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden md:block px-1">
                        Export
                      </span>
                    </button>
                    <div className="p-2.5 bg-green-600/10 border border-green-300 text-green-600 rounded-xl ml-2">
                      {expandedId === event.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>
                {/* Card Details (Expanded) */}
                {expandedId === event.id && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-200 relative z-10 animate-in slide-in-from-top-2">
                    <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl mb-6 text-xs text-gray-600 leading-relaxed font-medium">
                      {event.description}
                    </div>
                    <div className="flex flex-wrap gap-3 mb-8">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2 flex items-center">
                        Tags:
                      </span>
                      {event.tags?.map((tag: any, i: number) => {
                        const theme =
                          colorThemeMap[tag.color] || colorThemeMap["blue"];
                        return (
                          <span
                            key={i}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black border uppercase tracking-widest ${theme}`}
                          >
                            #{tag.name}
                          </span>
                        );
                      })}
                    </div>
                    {event.attributes && event.attributes.length > 0 && (
                      <div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3 text-green-600" />
                          Extracted Attributes
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {event.attributes.map((attr: any, i: number) => (
                            <div
                              key={i}
                              className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col justify-between hover:border-green-300 transition-colors"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <span className="bg-green-600/10 text-green-600 border border-green-300 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                                  {attr.type}
                                </span>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex-1">
                                  {attr.category}
                                </span>
                                <span className="text-[8px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded uppercase tracking-widest">
                                  {attr.role}
                                </span>
                              </div>
                              <p className="font-mono text-sm font-bold text-gray-900 break-all mb-2 select-all border-l-2 border-green-500/50 pl-2">
                                {attr.value}
                              </p>
                              <p className="text-[10px] text-gray-500 line-clamp-1 italic">
                                {attr.comment}
                              </p>
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
            <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-4 rounded-3xl shadow-sm">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-900 hover:bg-gray-50 px-5 py-2.5 rounded-xl transition"
              >
                Previous
              </button>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 px-6 py-2.5 rounded-xl border border-gray-200">
                Page <span className="text-green-600">{currentPage}</span> of{" "}
                {totalPages}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-900 hover:bg-gray-50 px-5 py-2.5 rounded-xl transition"
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

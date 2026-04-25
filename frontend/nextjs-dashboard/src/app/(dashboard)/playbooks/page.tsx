"use client";
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  ShieldAlert,
  Clock,
  ChevronRight,
  AlertCircle,
  Loader2,
  Lock,
  Zap,
} from "lucide-react";
import Link from "next/link";
interface Playbook {
  id: string;
  title: string;
  category: string;
  duration: string;
  description: string;
}
export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchPlaybooks = async () => {
      try {
        const token = window.localStorage.getItem("token");
        const res = await fetch("http://127.0.0.1:8000/playbooks", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok)
          throw new Error(
            "Failed to fetch playbooks. Ensure backend is running.",
          );
        setPlaybooks(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchPlaybooks();
  }, []);
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-2">
            Response <span className="text-amber-500">Playbooks</span>
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500 animate-pulse" />
            NIST-compliant Cyber Action Plans
          </p>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 scale-in-center">
          <div className="relative">
            <div className="w-24 h-24 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin " />
            <BookOpen className="w-8 h-8 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="font-black text-[10px] text-gray-500 uppercase tracking-widest">
            Loading Strategic Directives...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex items-center gap-4 text-rose-400 ">
          <AlertCircle className="w-6 h-6" />
          <p className="font-bold text-sm tracking-wide">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playbooks.map((pb) => (
            <Link
              key={pb.id}
              href={`/playbooks/${pb.id}`}
              className="group relative bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:bg-[#0f0f0f]/80 hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center shadow-sm ${pb.category === "Critical" ? "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-500/10" : pb.category === "High" ? "bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-orange-500/10" : "bg-green-600/10 text-green-600 border-green-300 shadow-indigo-500/10"}`}
                  >
                    {pb.category} Priority
                  </div>
                  <Zap className="w-5 h-5 text-gray-600 group-hover:text-amber-600 transition-colors" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-amber-600 transition-colors leading-tight">
                  {pb.title}
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-3">
                  {pb.description}
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {pb.duration} est.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-gray-900 group-hover:bg-amber-600/20 px-3 py-1.5 rounded-lg border border-transparent group-hover:border-amber-500/30 font-black text-[10px] uppercase tracking-widest transition-all">
                  Execute
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
          {/* Locked/Soon Card */}
          <div className="bg-gray-50 p-8 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-5 opacity-60 hover:opacity-100 transition-opacity">
            <div className="p-4 bg-white border border-gray-200 rounded-2xl ">
              <Lock className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <h4 className="font-black text-gray-600 uppercase tracking-widest text-sm mb-1">
                More Playbooks
              </h4>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                Update Core AI to unlock
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Footer Info */}
      <div className="mt-12 p-6 bg-gray-50 rounded-3xl border border-gray-200 flex items-start gap-4">
        <ShieldAlert className="w-5 h-5 text-gray-500 mt-1 shrink-0" />
        <div>
          <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5">
            Regulatory Notice
          </p>
          <p className="text-[10px] uppercase text-gray-500 font-black tracking-widest leading-relaxed">
            Ces procédures opérationnelles sont conformes au NIST SP 800-61 Rev.
            2. Conformez-vous toujours à la politique interne de l'entreprise
            avant toute action d'isolation réseau.
          </p>
        </div>
      </div>
    </div>
  );
}

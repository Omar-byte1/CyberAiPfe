/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { 
  LayoutDashboard, 
  AlertCircle, 
  ShieldAlert, 
  FileText, 
  ShieldCheck,
  LogOut,
  Activity,
  Globe,
  FlaskConical,
  BookOpen,
  Bot,
  History,
  User as UserIcon,
  ShieldIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const router = useRouter();
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Alerts', href: '/alerts', icon: AlertCircle },
    { name: 'CVE Intel', href: '/cve', icon: ShieldAlert },
    { name: 'Threat Report', href: '/threat-report', icon: FileText },
    { name: 'Live Monitor', href: '/live-monitor', icon: Activity },
    { name: 'IP Intel', href: '/ip-intel', icon: Globe },
    { name: 'AI Sandbox', href: '/sandbox', icon: FlaskConical },
    { name: 'Incidents', href: '/incidents', icon: ShieldCheck },
    { name: 'Playbooks', href: '/playbooks', icon: BookOpen },
    { name: 'ParseAI Engine', href: '/parse-ai', icon: Bot },
    { name: 'ParseAI History', href: '/parse-ai-history', icon: History },
  ];

  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        setUser({ username: payload.username, role: payload.role });
      } catch (e) {
        console.error("Failed to parse token", e);
      }
    }
  }, []);

  const handleLogout = (): void => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
    } catch {
      // Ignore storage errors.
    }
    router.replace('/login');
  };

  return (
    <div className="w-64 bg-white/[0.02] text-zinc-300 h-screen p-6 flex flex-col fixed shadow-2xl border-r border-white/[0.08] backdrop-blur-3xl z-50">
      
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      <div className="flex items-center gap-3 mb-10 px-2 relative group cursor-pointer">
        <div className="absolute inset-0 bg-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl rounded-full" />
        <div className="relative bg-gradient-to-br from-violet-600 to-indigo-600 p-2.5 rounded-xl border border-white/10 shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]">
          <ShieldAlert className="text-white w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tighter">
          CYBER<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-500">AI</span>
        </h2>
      </div>

      <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {menuItems.map((item) => (
          <Link 
            key={item.name}
            href={item.href} 
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.05] hover:text-white transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-left rounded-r" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <item.icon className="w-5 h-5 text-zinc-500 group-hover:text-violet-400 transition-colors z-10" />
            <span className="font-bold text-sm tracking-wide z-10">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-4">
        <div className="bg-[#0a0a0a]/50 backdrop-blur-md rounded-2xl p-5 border border-white/[0.05] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          {user ? (
            <div className="flex flex-col gap-3 mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(139,92,246,0.4)]">
                  <UserIcon className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <span className="block text-xs font-black text-white truncate">{user.username}</span>
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">{user.role}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">System Online</span>
            </div>
          )}
          <div className="h-px w-full bg-white/[0.05] mb-4 relative z-10" />
          <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-widest relative z-10">
            CTI Engine <span className="text-zinc-400">v5.1</span><br/>
            <span className="text-violet-500/70">Neural Link Active</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-xs tracking-widest uppercase">Déconnexion</span>
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

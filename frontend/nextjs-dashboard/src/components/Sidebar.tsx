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
        // Simple manual JWT base64 decode for the payload
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
    <div className="w-64 bg-slate-950 text-slate-300 h-screen p-6 flex flex-col fixed shadow-2xl border-r border-slate-800/50 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tighter">
          CYBER<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">AI</span>
        </h2>
      </div>

      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => (
          <Link 
            key={item.name}
            href={item.href} 
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-white/5 hover:text-white transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <item.icon className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors z-10" />
            <span className="font-bold text-sm tracking-wide z-10">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800 shadow-inner">
          {user ? (
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-xs font-black text-slate-100 truncate">{user.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                  <ShieldIcon className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.role}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute inset-0"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative"></div>
              </div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">System Online</span>
            </div>
          )}
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
            CTI Engine <span className="text-slate-400">v1.2.4</span><br/>
            <span className="text-blue-500/50">Infrastructure Secure</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-200 hover:bg-slate-800/60 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-bold text-sm tracking-wide">Logout</span>
        </button>
      </div>
    </div>
  );
}

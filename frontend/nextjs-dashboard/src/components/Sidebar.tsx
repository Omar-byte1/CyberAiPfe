/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const router = useRouter();
  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Alerts", href: "/alerts", icon: AlertCircle },
    { name: "CVE Intel", href: "/cve", icon: ShieldAlert },
    { name: "Threat Report", href: "/threat-report", icon: FileText },
    { name: "Live Monitor", href: "/live-monitor", icon: Activity },
    { name: "IP Intel", href: "/ip-intel", icon: Globe },
    { name: "AI Sandbox", href: "/sandbox", icon: FlaskConical },
    { name: "Incidents", href: "/incidents", icon: ShieldCheck },
    { name: "Playbooks", href: "/playbooks", icon: BookOpen },
    { name: "ParseAI Engine", href: "/parse-ai", icon: Bot },
    { name: "ParseAI History", href: "/parse-ai-history", icon: History },
  ];

  const [user, setUser] = useState<{ username: string; role: string } | null>(
    null,
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payloadBase64 = token.split(".")[1];
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
      localStorage.removeItem("token");
      localStorage.removeItem("auth");
    } catch {
      // Ignore storage errors.
    }
    router.replace("/login");
  };

  return (
    <div className="w-64 bg-white text-gray-600 h-screen p-6 flex flex-col fixed shadow-md border-r border-gray-200 z-50">
      {/* Logo & Title */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <Image
          src="/logo.png"
          alt="CyberAI Logo"
          width={44}
          height={44}
          className="rounded-xl"
        />
        <h2 className="text-xl font-black text-gray-900 tracking-tight">
          CYBER<span className="text-green-600">AI</span>
        </h2>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-green-50 hover:text-green-700 transition-all duration-200 group relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-left rounded-r" />
            <item.icon className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            <span className="font-semibold text-sm">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-4">
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
          {user ? (
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-900 truncate">
                    {user.username}
                  </span>
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </div>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                System Online
              </span>
            </div>
          )}
          <div className="h-px w-full bg-gray-200 mb-4" />
          <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest">
            CTI Engine <span className="text-gray-500">v5.1</span>
            <br />
            <span className="text-green-600/70">Active</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-xs tracking-widest uppercase">
            Déconnexion
          </span>
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
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

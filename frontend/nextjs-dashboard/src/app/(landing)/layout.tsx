import Link from 'next/link';
import { ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-50 flex flex-col selection:bg-violet-500/30 overflow-x-hidden font-sans">
      
      {/* --- ADVANCED BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        {/* Dynamic Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[150px] animate-pulse mix-blend-screen" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[150px] animate-pulse mix-blend-screen" style={{ animationDuration: '12s' }} />
      </div>

      {/* --- FLOATING PREMIUM NAVBAR --- */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6">
        <div className="w-full max-w-5xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.1)] rounded-2xl h-14 flex items-center justify-between px-4 transition-all duration-500 hover:bg-white/[0.05]">
          
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <ShieldAlert className="w-5 h-5 text-violet-400 group-hover:text-white transition-colors relative z-10" />
            </div>
            <span className="font-extrabold tracking-widest text-sm uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
              Cyber<span className="text-violet-500">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase text-zinc-400">
            <Link href="#goals" className="hover:text-white hover:text-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">Architecture</Link>
            <Link href="#stack" className="hover:text-white hover:text-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">Matrice</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-xl bg-violet-600 px-6 font-medium text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)]">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                Console <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* --- CONTENT --- */}
      <main className="flex-1 relative z-10 pt-32 pb-20">
        {children}
      </main>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 border-t border-white/[0.05] bg-[#030303]/80 backdrop-blur-xl mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs tracking-widest uppercase font-semibold">
            <Sparkles className="w-4 h-4 text-violet-500/50" />
            <span>© 2026 CyberAI SOC. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.05] rounded-full px-4 py-1.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] text-zinc-400 tracking-widest uppercase font-bold">Réseau Opérationnel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

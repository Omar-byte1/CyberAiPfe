import Link from "next/link";
import Image from "next/image";
import { Sparkles, ChevronRight } from "lucide-react";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col overflow-x-hidden font-sans">
      {/* --- FLOATING PREMIUM NAVBAR --- */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6">
        <div className="w-full max-w-5xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-md rounded-2xl h-14 flex items-center justify-between px-4 transition-all duration-500">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="CyberAI Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-extrabold tracking-widest text-sm uppercase text-gray-900">
              Cyber<span className="text-green-600">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase text-gray-400">
            <Link href="#goals" className="hover:text-green-600 transition-all">
              Architecture
            </Link>
            <Link href="#stack" className="hover:text-green-600 transition-all">
              Matrice
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-xl bg-green-600 px-6 font-medium text-white transition-all hover:scale-105 hover:bg-green-700 shadow-md"
            >
              <span className="relative flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                Console <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* --- CONTENT --- */}
      <main className="flex-1 relative z-10 pt-32 pb-20">{children}</main>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 border-t border-gray-200 bg-gray-50 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs tracking-widest uppercase font-semibold">
            <Sparkles className="w-4 h-4 text-green-600/50" />
            <span>© 2026 CyberAI SOC. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
            <span className="text-[10px] text-green-600 tracking-widest uppercase font-bold">
              Réseau Opérationnel
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

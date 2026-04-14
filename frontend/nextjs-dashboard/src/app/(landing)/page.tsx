import Link from 'next/link';
import { ChevronRight, Radar, BrainCircuit, ShieldBan, Code2, Server, Database, Container, Activity, Lock, Search } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full items-center">
      
      {/* ----------------- HERO SECTION ----------------- */}
      <section className="relative min-h-[90vh] w-full flex items-center justify-center px-4 md:px-8">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[800px] bg-violet-600/5 rounded-full blur-[100px] border border-violet-500/10" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center">
          
          <div className="group cursor-pointer inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-8 hover:bg-white/[0.08] transition-all duration-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 group-hover:text-white transition-colors">
              Engine 5.1 Deployed
            </span>
            <ChevronRight className="w-3 h-3 text-zinc-500 group-hover:text-violet-400 transition-colors" />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-300 to-zinc-700 tracking-tighter mb-6 leading-[1.1]">
            Intelligence <br className="hidden md:block" />
            <span className="relative inline-block pb-2">
              Artificielle <span className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-600 to-transparent rounded-full" />
            </span> 
            {" "}Synaptique
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl font-medium leading-relaxed">
            Plateforme CTI asynchrone de nouvelle génération. Détection de menaces, analyse neuro-cognitive locale et extraction furtive d'indicateurs de compromission.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto relative group overflow-hidden rounded-2xl p-[1px]">
              <span className="absolute inset-0 bg-gradient-to-br from-violet-500 via-emerald-400 to-blue-500 opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center justify-center gap-3 px-8 py-4 bg-[#030303] rounded-[15px] group-hover:bg-transparent transition-colors duration-500">
                <ShieldBan className="w-5 h-5 text-zinc-100 group-hover:text-white" />
                <span className="text-sm font-black tracking-widest uppercase text-white">Scanner le réseau</span>
              </div>
            </Link>
            
            <a href="#goals" className="w-full sm:w-auto px-8 py-4 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] rounded-2xl text-sm font-bold tracking-widest uppercase text-zinc-300 hover:text-white transition-all duration-300 backdrop-blur-md">
              Explorer l'Architecture
            </a>
          </div>
        </div>
      </section>

      {/* ----------------- OBJECTIVES / DIRECTIVES SECTION ----------------- */}
      <section id="goals" className="py-32 w-full px-4 md:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center mb-20 text-center">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Directives Opérationnelles</h2>
            <p className="text-zinc-500 max-w-xl text-sm font-medium leading-relaxed">
              Le moteur central s'appuie sur une infrastructure hybride conçue pour l'anonymat, l'analyse locale et l'intégration instantanée des menaces.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Spotlight Glow behind cards */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1/2 bg-violet-600/10 blur-[120px] pointer-events-none" />

            {[
              {
                icon: Radar, color: "text-emerald-400", title: "Extraction Furtive",
                desc: "Bypass dynamique de Cloudflare via environnement isolé (StealthyFetcher). Collecte d'IoCs sur l'infrastructure adverse dans un silence radar absolu."
              },
              {
                icon: BrainCircuit, color: "text-violet-400", title: "Cerveau Numérique",
                desc: "Parsing sémantique exécuté par IA locale (Ollama Qwen2.5-Coder). Génération de rapports structurés garantissant une intimité des données à 100%."
              },
              {
                icon: Activity, color: "text-blue-400", title: "Assimilation MISP",
                desc: "Scoring de sévérité asynchrone, assignation automatique selon la doctrine TLP 2.0 et ingestion directe dans les bases de défense du SOC."
              }
            ].map((d, i) => (
              <div key={i} className="group relative bg-[#0a0a0a] border border-white/[0.05] rounded-3xl p-8 hover:bg-[#0f0f0f] transition-all duration-500 shadow-2xl hover:-translate-y-2">
                {/* Top Inner Border Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-3xl" />
                
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white/[0.08] transition-all duration-500">
                  <d.icon className={`w-6 h-6 ${d.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-4">{d.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed font-medium">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------- STACK BENTO GRID SECTION ----------------- */}
      <section id="stack" className="py-32 w-full px-4 md:px-8 relative bg-gradient-to-b from-transparent to-[#050505]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Matrice Technologique</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
            
            {/* FRONTEND BENTO CELL */}
            <div className="md:col-span-2 md:row-span-2 bg-[#0a0a0a] border border-white/[0.05] rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-end group hover:border-violet-500/30 transition-all duration-500 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-violet-900/10 pointer-events-none" />
              <div className="absolute top-8 right-8 w-16 h-16 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Code2 className="text-violet-400 w-8 h-8" />
              </div>
              <div className="z-10 mt-32 md:mt-0">
                <h3 className="text-3xl font-black text-white tracking-tighter mb-4">Next.js 16</h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                  Interface de commandement construite avec React 19, Tailwind CSS 4 et Shadcn/UI. Un rendu ultra-performant, une architecture Route Groups sécurisée et un Glassmorphism immersif.
                </p>
              </div>
            </div>

            {/* BACKEND BENTO CELL */}
            <div className="md:col-span-2 bg-[#0a0a0a] border border-white/[0.05] rounded-[32px] p-8 flex flex-col justify-center relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500 shadow-xl">
              <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-6 z-10">
                <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform duration-500">
                  <Server className="text-blue-400 w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">FastAPI Core</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed font-medium">Asynchronisme Python natif. Moteur de scraping hybride et base de données structurée par SQLAlchemy.</p>
                </div>
              </div>
            </div>

            {/* AI BENTO CELL */}
            <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[32px] p-8 flex flex-col items-center justify-center text-center group hover:border-emerald-500/30 transition-all duration-500 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center mb-6 relative z-10">
                 <Database className="text-emerald-400 w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight relative z-10">Ollama LLM</h3>
              <p className="text-xs text-zinc-500 mt-2 font-medium relative z-10">Inférence hors-réseau</p>
            </div>

            {/* DEVOPS BENTO CELL */}
            <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[32px] p-8 flex flex-col items-center justify-center text-center group hover:border-cyan-500/30 transition-all duration-500 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center mb-6 relative z-10">
                 <Container className="text-cyan-400 w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight relative z-10">Docker</h3>
              <p className="text-xs text-zinc-500 mt-2 font-medium relative z-10">Conteneurisation totale</p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

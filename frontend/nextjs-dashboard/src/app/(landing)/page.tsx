import Link from "next/link";
import {
  ChevronRight,
  Radar,
  BrainCircuit,
  ShieldBan,
  Code2,
  Server,
  Database,
  Container,
  Activity,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full items-center">
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] w-full flex items-center justify-center px-4 md:px-8">
        <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="group cursor-pointer inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 mb-8 hover:bg-green-100 transition-all duration-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-green-700 group-hover:text-green-800 transition-colors">
              Engine 5.1 Deployed
            </span>
            <ChevronRight className="w-3 h-3 text-green-400 group-hover:text-green-600 transition-colors" />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 tracking-tighter mb-6 leading-[1.1]">
            Intelligence <br className="hidden md:block" />
            <span className="relative inline-block pb-2">
              Artificielle{" "}
              <span className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-600 to-transparent rounded-full" />
            </span>{" "}
            Synaptique
          </h1>

          <p className="text-lg md:text-xl text-gray-500 mb-12 max-w-2xl font-medium leading-relaxed">
            Plateforme CTI asynchrone de nouvelle génération. Détection de
            menaces, analyse neuro-cognitive locale et extraction furtive
            d&apos;indicateurs de compromission.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto">
              <div className="flex items-center justify-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 rounded-2xl transition-colors duration-300 shadow-md">
                <ShieldBan className="w-5 h-5 text-white" />
                <span className="text-sm font-black tracking-widest uppercase text-white">
                  Scanner le réseau
                </span>
              </div>
            </Link>

            <a
              href="#goals"
              className="w-full sm:w-auto px-8 py-4 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-2xl text-sm font-bold tracking-widest uppercase text-gray-500 hover:text-gray-900 transition-all duration-300"
            >
              Explorer l&apos;Architecture
            </a>
          </div>
        </div>
      </section>

      {/* --- OBJECTIVES SECTION --- */}
      <section id="goals" className="py-32 w-full px-4 md:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center mb-20 text-center">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">
              Directives Opérationnelles
            </h2>
            <p className="text-gray-400 max-w-xl text-sm font-medium leading-relaxed">
              Le moteur central s&apos;appuie sur une infrastructure hybride
              conçue pour l&apos;anonymat, l&apos;analyse locale et
              l&apos;intégration instantanée des menaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Radar,
                color: "text-green-600",
                title: "Extraction Furtive",
                desc: "Bypass dynamique de Cloudflare via environnement isolé (StealthyFetcher). Collecte d'IoCs sur l'infrastructure adverse.",
              },
              {
                icon: BrainCircuit,
                color: "text-green-600",
                title: "Cerveau Numérique",
                desc: "Parsing sémantique exécuté par IA locale (Ollama Qwen2.5-Coder). Rapports structurés avec intimité des données à 100%.",
              },
              {
                icon: Activity,
                color: "text-blue-400",
                title: "Assimilation MISP",
                desc: "Scoring de sévérité asynchrone, assignation automatique selon la doctrine TLP 2.0 et ingestion directe dans le SOC.",
              },
            ].map((d, i) => (
              <div
                key={i}
                className="group relative bg-white border border-gray-200 rounded-3xl p-8 hover:bg-gray-50 transition-all duration-500 shadow-sm hover:-translate-y-2 hover:shadow-md"
              >
                <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500">
                  <d.icon className={`w-6 h-6 ${d.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-4">
                  {d.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- STACK BENTO GRID --- */}
      <section
        id="stack"
        className="py-32 w-full px-4 md:px-8 relative bg-gray-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">
              Matrice Technologique
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
            {/* FRONTEND */}
            <div className="md:col-span-2 md:row-span-2 bg-white border border-gray-200 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-end group hover:border-green-300 transition-all duration-500 shadow-sm">
              <div className="absolute top-8 right-8 w-16 h-16 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Code2 className="text-green-600 w-8 h-8" />
              </div>
              <div className="z-10 mt-32 md:mt-0">
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-4">
                  Next.js 16
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                  Interface de commandement construite avec React 19, Tailwind
                  CSS 4 et Shadcn/UI. Rendu ultra-performant et architecture
                  Route Groups sécurisée.
                </p>
              </div>
            </div>

            {/* BACKEND */}
            <div className="md:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden group hover:border-blue-300 transition-all duration-500 shadow-sm">
              <div className="flex items-center gap-6 z-10">
                <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform duration-500">
                  <Server className="text-blue-500 w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                    FastAPI Core
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-medium">
                    Asynchronisme Python natif. Moteur de scraping hybride et
                    base de données SQLAlchemy.
                  </p>
                </div>
              </div>
            </div>

            {/* AI */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-green-300 transition-all duration-500 shadow-sm">
              <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mb-6">
                <Database className="text-green-600 w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Ollama LLM
              </h3>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                Inférence hors-réseau
              </p>
            </div>

            {/* DEVOPS */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-blue-300 transition-all duration-500 shadow-sm">
              <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mb-6">
                <Container className="text-blue-500 w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Docker
              </h3>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                Conteneurisation totale
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

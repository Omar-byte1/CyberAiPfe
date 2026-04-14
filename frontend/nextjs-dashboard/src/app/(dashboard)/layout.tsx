import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#030303] text-zinc-50 font-sans relative overflow-hidden">
        
        {/* BACKGROUND EFFECTS */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
          
          {/* Dimmed Orbs for readability */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[150px] animate-pulse mix-blend-screen" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[150px] animate-pulse mix-blend-screen" style={{ animationDuration: '12s' }} />
        </div>

        {/* SIDEBAR */}
        <Sidebar />
        
        {/* MAIN CONTENT AREA */}
        <main className="ml-64 flex-1 min-h-screen p-8 relative z-10">{children}</main>
      </div>
    </AuthGuard>
  );
}

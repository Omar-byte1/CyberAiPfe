import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
        {/* SIDEBAR */}
        <Sidebar />

        {/* MAIN CONTENT AREA */}
        <main className="ml-64 flex-1 min-h-screen p-8">{children}</main>
      </div>
    </AuthGuard>
  );
}

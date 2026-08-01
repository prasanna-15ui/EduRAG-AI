import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 hidden md:block flex-shrink-0">
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden p-4 border-b">
          {/* Simple mobile header for dashboard */}
          <h1 className="font-bold text-xl">EduRAG Dashboard</h1>
        </div>
        <div className="container mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

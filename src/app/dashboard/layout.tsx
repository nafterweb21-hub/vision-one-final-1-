import Sidebar from "@/components/Sidebar";
import { auth } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === UserRole.ADMIN;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-900">
      {/* Sidebar navigation panel */}
      <Sidebar
        userEmail={session?.user?.email}
        userRole={session?.user?.role}
        isAdmin={isAdmin}
      />

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Soft atmospheric radial gradients behind page content */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-200/20 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-200/20 blur-[100px] pointer-events-none z-0" />

        {/* Dynamic page contents scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 w-full px-4 pt-24 pb-12 sm:px-8 md:px-12 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

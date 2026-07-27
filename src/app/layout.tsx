import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import GlobalHeaderWrapper from "@/components/GlobalHeaderWrapper";
import { auth } from "@/lib/auth";
import { landingPathFor } from "@/lib/access";

export const metadata: Metadata = {
  title: "Vision One ERP",
  description: "Enterprise Resource Planning System",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const role = session?.user?.role ?? null;
  const permissions = session?.user?.permissions ?? null;

  // Shop-floor-only roles are bounced off /dashboard by the proxy, so offering
  // them the link would just round-trip them back to their terminal.
  const canSeeDashboard = !!session?.user && landingPathFor(permissions, role) === "/dashboard";

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <GlobalHeaderWrapper
          userEmail={session?.user?.email}
          userRole={role}
          userPermissions={permissions}
          canSeeDashboard={canSeeDashboard}
        />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

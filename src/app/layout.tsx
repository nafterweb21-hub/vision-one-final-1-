import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import GlobalHeaderWrapper from "@/components/GlobalHeaderWrapper";

export const metadata: Metadata = {
  title: "Vision One ERP",
  description: "Enterprise Resource Planning System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <GlobalHeaderWrapper />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

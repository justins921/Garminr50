import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "GolfPulse — R50 Analytics",
  description: "Premium golf analytics dashboard for the Garmin Approach R50 launch monitor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "GolfPulse — R50 Analytics",
  description: "Premium golf analytics dashboard for the Garmin Approach R50 launch monitor",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <SessionProvider>
          <div className="flex min-h-screen">
            <div className="hidden md:block">
              <Sidebar />
            </div>
            <div className="flex-1 flex flex-col overflow-auto">
              <MobileLayout />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
          <Toaster richColors position="bottom-right" />
        </SessionProvider>
      </body>
    </html>
  );
}

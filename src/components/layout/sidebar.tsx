"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Radio,
  History,
  BarChart3,
  Upload,
  Crosshair,
  GitCompare,
  Settings,
  Map,
  Grid3X3,
  Zap,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/live", label: "Live Session", icon: Radio },
  { href: "/sessions", label: "Sessions", icon: History },
  { href: "/clubs", label: "Clubs", icon: Crosshair },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/bag-mapping", label: "Bag Mapping", icon: Map },
  { href: "/wedge-matrix", label: "Wedge Matrix", icon: Grid3X3 },
  { href: "/optimizer", label: "Shot Optimizer", icon: Zap },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-60 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Crosshair className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">GolfPulse</h1>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">R50 Analytics</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.label === "Live Session" && (
                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t space-y-2">
        {session?.user && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          <p>Garmin Approach R50</p>
          <p className="text-[10px] mt-0.5">Bridge: <span className="text-amber-500">Not connected</span></p>
        </div>
      </div>
    </aside>
  );
}

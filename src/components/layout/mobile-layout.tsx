"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Crosshair,
  LayoutDashboard,
  Radio,
  History,
  BarChart3,
  Upload,
  GitCompare,
  Settings,
  Map,
  Grid3X3,
  Zap,
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

export function MobileLayout() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b bg-card px-4 py-3">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Crosshair className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="font-bold text-base">GolfPulse</span>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" />}
        >
          <Menu className="w-5 h-5" />
          <span className="sr-only">Menu</span>
        </SheetTrigger>

        <SheetContent side="left" showCloseButton>
          <SheetHeader>
            <SheetTitle>
              <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Crosshair className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <span className="font-bold text-lg leading-none block">GolfPulse</span>
                  <span className="text-[10px] text-muted-foreground tracking-wider uppercase">R50 Analytics</span>
                </div>
              </Link>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
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

          <div className="p-3 border-t mt-auto">
            <div className="text-xs text-muted-foreground">
              <p>Garmin Approach R50</p>
              <p className="text-[10px] mt-0.5">Bridge: <span className="text-amber-500">Not connected</span></p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

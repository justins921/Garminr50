"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  accent?: boolean;
}

export function StatCard({ label, value, unit, subtitle, trend, accent }: Props) {
  return (
    <Card className={accent ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          {trend && trend !== "neutral" && (
            <span className={`text-xs ml-1 ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
              {trend === "up" ? "↑" : "↓"}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

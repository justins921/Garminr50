"use client";

import { useFetch } from "@/hooks/use-fetch";
import { DistanceChart } from "@/components/charts/distance-chart";
import { DispersionChart } from "@/components/charts/dispersion-chart";
import { MetricTrendChart } from "@/components/charts/metric-trend-chart";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { ClubStats, GappingData } from "@/types/analytics";

export default function AnalyticsPage() {
  const { data: clubStats } = useFetch<ClubStats[]>("/api/analytics?type=clubs");
  const { data: gapping } = useFetch<GappingData>("/api/analytics?type=gapping");
  const { data: allShots } = useFetch<Array<{
    carryDistance: number | null;
    totalDistance: number | null;
    offlineDistance: number | null;
    ballSpeed: number | null;
    clubSpeed: number | null;
    spinRate: number | null;
    launchAngle: number | null;
    smashFactor: number | null;
    validity: string;
    club: { name: string } | null;
    session: { name: string; startedAt: string } | null;
  }>>("/api/shots?limit=500");

  const validShots = (allShots ?? []).filter((s) => s.validity === "valid");

  const sorted = (clubStats ?? []).filter((c) => c.shotCount >= 3).sort((a, b) => b.avgCarry - a.avgCarry);

  // Summary stats that actually make sense across clubs
  const mostConsistentClub = sorted.length > 0 ? sorted.reduce((best, c) => c.consistencyScore > best.consistencyScore ? c : best) : null;
  const longestCarry = clubStats && clubStats.length > 0 ? Math.max(...clubStats.map((c) => c.bestCarry)) : 0;

  // Dispersion data
  const dispersionData = validShots
    .filter((s) => s.carryDistance != null && s.offlineDistance != null)
    .slice(0, 300)
    .map((s) => ({
      x: s.offlineDistance!,
      y: s.carryDistance!,
      totalDistance: s.totalDistance ?? undefined,
      clubName: s.club?.name,
      ballSpeed: s.ballSpeed ?? undefined,
    }));

  // Gapping analysis
  const gappingCards = gapping?.clubs ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Deep analysis across all your shot data
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Valid Shots" value={validShots.length} />
        <StatCard label="Clubs Tracked" value={sorted.length} />
        <StatCard label="Longest Carry" value={longestCarry || "—"} unit={longestCarry ? "yds" : undefined} />
        <StatCard
          label="Most Consistent"
          value={mostConsistentClub ? mostConsistentClub.clubName : "—"}
          unit={mostConsistentClub ? `${mostConsistentClub.consistencyScore}%` : undefined}
        />
      </div>

      {/* Club Gapping */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Club Gapping Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <DistanceChart data={sorted} title="" height={350} />
          {gappingCards.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="py-2 px-2 text-left">Club</th>
                    <th className="py-2 px-2 text-right">Avg Carry</th>
                    <th className="py-2 px-2 text-right">Avg Total</th>
                    <th className="py-2 px-2 text-right">Range</th>
                    <th className="py-2 px-2 text-right">Gap to Next</th>
                    <th className="py-2 px-2 text-right">Overlap</th>
                  </tr>
                </thead>
                <tbody>
                  {gappingCards.map((c) => (
                    <tr key={c.clubName} className="border-b">
                      <td className="py-1.5 px-2 font-medium">{c.clubName}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{c.avgCarry} yds</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{c.avgTotal} yds</td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">{c.minCarry}–{c.maxCarry}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">
                        {c.gapToNext != null ? `${c.gapToNext} yds` : "—"}
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums">
                        {c.overlapWithNext != null ? (
                          <span className="text-amber-500">{c.overlapWithNext} yds</span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispersion */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overall Dispersion</CardTitle>
        </CardHeader>
        <CardContent>
          <DispersionChart data={dispersionData} title="" height={450} />
        </CardContent>
      </Card>
    </div>
  );
}

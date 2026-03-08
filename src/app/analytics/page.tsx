"use client";

import { useFetch } from "@/hooks/use-fetch";
import { DistanceChart } from "@/components/charts/distance-chart";
import { DispersionChart } from "@/components/charts/dispersion-chart";
import { MetricTrendChart } from "@/components/charts/metric-trend-chart";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { ClubStats, GappingData } from "@/types/analytics";
import { avg } from "@/analytics/stats";

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
  const carries = validShots.map((s) => s.carryDistance).filter((v): v is number => v != null);
  const ballSpeeds = validShots.map((s) => s.ballSpeed).filter((v): v is number => v != null);
  const spins = validShots.map((s) => s.spinRate).filter((v): v is number => v != null);
  const smashes = validShots.map((s) => s.smashFactor).filter((v): v is number => v != null);

  const sorted = (clubStats ?? []).filter((c) => c.shotCount >= 3).sort((a, b) => b.avgCarry - a.avgCarry);

  // Dispersion data
  const dispersionData = validShots
    .filter((s) => s.carryDistance != null && s.offlineDistance != null)
    .slice(0, 200)
    .map((s) => ({
      x: s.offlineDistance!,
      y: s.carryDistance!,
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

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Valid Shots" value={validShots.length} />
        <StatCard label="Overall Avg Carry" value={carries.length ? Math.round(avg(carries)) : "—"} unit="yds" />
        <StatCard label="Avg Ball Speed" value={ballSpeeds.length ? Math.round(avg(ballSpeeds)) : "—"} unit="mph" />
        <StatCard label="Avg Spin Rate" value={spins.length ? Math.round(avg(spins)) : "—"} unit="rpm" />
        <StatCard label="Avg Smash Factor" value={smashes.length ? (Math.round(avg(smashes) * 100) / 100).toString() : "—"} />
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

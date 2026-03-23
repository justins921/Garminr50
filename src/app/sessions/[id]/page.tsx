"use client";

import { use } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { StatCard } from "@/components/common/stat-card";
import { DispersionChart } from "@/components/charts/dispersion-chart";
import { DistanceChart } from "@/components/charts/distance-chart";
import { MetricTrendChart } from "@/components/charts/metric-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { computeClubStats, computeSessionStats, avg, stdDev } from "@/analytics/stats";

interface SessionData {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  environment: string;
  sessionType: string;
  source: string;
  notes: string | null;
  shots: Array<{
    id: string;
    shotNumber: number;
    timestamp: string;
    ballSpeed: number | null;
    clubSpeed: number | null;
    launchAngle: number | null;
    spinRate: number | null;
    carryDistance: number | null;
    totalDistance: number | null;
    offlineDistance: number | null;
    apexHeight: number | null;
    smashFactor: number | null;
    validity: string;
    shotShape: string | null;
    shotResult: string | null;
    club: { id: string; name: string; type: string } | null;
  }>;
  tags: Array<{ tag: { id: string; name: string } }>;
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, loading } = useFetch<SessionData>(`/api/sessions/${id}`);

  if (loading || !session) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
        </div>
      </div>
    );
  }

  const validShots = session.shots.filter((s) => s.validity === "valid");
  const carries = validShots.map((s) => s.carryDistance).filter((v): v is number => v != null);
  const totals = validShots.map((s) => s.totalDistance).filter((v): v is number => v != null);
  const ballSpeeds = validShots.map((s) => s.ballSpeed).filter((v): v is number => v != null);
  const clubSpeeds = validShots.map((s) => s.clubSpeed).filter((v): v is number => v != null);
  const spins = validShots.map((s) => s.spinRate).filter((v): v is number => v != null);
  const launches = validShots.map((s) => s.launchAngle).filter((v): v is number => v != null);
  const offlines = validShots.map((s) => s.offlineDistance).filter((v): v is number => v != null);

  // Dispersion data
  const dispersionData = validShots
    .filter((s) => s.carryDistance != null && s.offlineDistance != null)
    .map((s) => ({
      x: s.offlineDistance!,
      y: s.carryDistance!,
      clubName: s.club?.name,
      shotNumber: s.shotNumber,
      validity: s.validity,
      ballSpeed: s.ballSpeed ?? undefined,
    }));

  // Club breakdown
  const clubGroups = new Map<string, typeof validShots>();
  validShots.forEach((s) => {
    const key = s.club?.name ?? "Unknown";
    if (!clubGroups.has(key)) clubGroups.set(key, []);
    clubGroups.get(key)!.push(s);
  });

  const clubDistances = Array.from(clubGroups.entries())
    .map(([name, shots]) => {
      const c = shots.map((s) => s.carryDistance).filter((v): v is number => v != null);
      const t = shots.map((s) => s.totalDistance).filter((v): v is number => v != null);
      return {
        clubName: name,
        avgCarry: Math.round(avg(c) * 10) / 10,
        avgTotal: Math.round(avg(t) * 10) / 10,
        stdDevCarry: Math.round(stdDev(c) * 10) / 10,
      };
    })
    .filter((c) => c.avgCarry > 0)
    .sort((a, b) => b.avgCarry - a.avgCarry);

  // Carry trend by shot number
  const carryTrend = validShots
    .filter((s) => s.carryDistance != null)
    .map((s) => ({
      label: `#${s.shotNumber}`,
      value: Math.round(s.carryDistance! * 10) / 10,
    }));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{session.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <p className="text-sm text-muted-foreground">
            {format(new Date(session.startedAt), "EEEE, MMM d, yyyy · h:mm a")}
          </p>
          <Badge variant="outline">{session.environment}</Badge>
          <Badge variant="outline">{session.sessionType}</Badge>
          <Badge variant="secondary">{session.shots.length} shots</Badge>
        </div>
        {session.notes && (
          <p className="text-sm text-muted-foreground mt-2 italic">{session.notes}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Valid Shots" value={validShots.length} />
        <StatCard label="Avg Carry" value={carries.length ? Math.round(avg(carries)) : "—"} unit="yds" />
        <StatCard label="Avg Total" value={totals.length ? Math.round(avg(totals)) : "—"} unit="yds" />
        <StatCard label="Avg Ball Speed" value={ballSpeeds.length ? Math.round(avg(ballSpeeds)) : "—"} unit="mph" />
        <StatCard label="Avg Spin" value={spins.length ? Math.round(avg(spins)) : "—"} unit="rpm" />
        <StatCard label="Avg Launch" value={launches.length ? (Math.round(avg(launches) * 10) / 10).toString() : "—"} unit="°" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dispersion</CardTitle>
          </CardHeader>
          <CardContent>
            <DispersionChart data={dispersionData} title="" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Club Distances</CardTitle>
          </CardHeader>
          <CardContent>
            <DistanceChart data={clubDistances} title="" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Carry Distance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricTrendChart data={carryTrend} unit="yds" height={200} />
        </CardContent>
      </Card>

      {/* Shot Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Shots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="py-2 px-2 text-left">#</th>
                  <th className="py-2 px-2 text-left">Club</th>
                  <th className="py-2 px-2 text-right">Carry</th>
                  <th className="py-2 px-2 text-right hidden sm:table-cell">Total</th>
                  <th className="py-2 px-2 text-right">Ball Spd</th>
                  <th className="py-2 px-2 text-right hidden md:table-cell">Club Spd</th>
                  <th className="py-2 px-2 text-right hidden sm:table-cell">Spin</th>
                  <th className="py-2 px-2 text-right hidden md:table-cell">Launch</th>
                  <th className="py-2 px-2 text-right hidden sm:table-cell">Offline</th>
                  <th className="py-2 px-2 text-center">Result</th>
                </tr>
              </thead>
              <tbody>
                {session.shots.map((shot) => (
                  <tr
                    key={shot.id}
                    className={`border-b hover:bg-accent/50 transition-colors ${
                      shot.validity !== "valid" ? "opacity-50" : ""
                    }`}
                  >
                    <td className="py-1.5 px-2 text-muted-foreground">{shot.shotNumber}</td>
                    <td className="py-1.5 px-2 font-medium">{shot.club?.name ?? "—"}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{shot.carryDistance ?? "—"}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums hidden sm:table-cell">{shot.totalDistance ?? "—"}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{shot.ballSpeed ?? "—"}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums hidden md:table-cell">{shot.clubSpeed ?? "—"}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums hidden sm:table-cell">{shot.spinRate ?? "—"}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums hidden md:table-cell">{shot.launchAngle ?? "—"}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums hidden sm:table-cell">
                      {shot.offlineDistance != null
                        ? `${shot.offlineDistance > 0 ? "R" : "L"} ${Math.abs(shot.offlineDistance)}`
                        : "—"}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {shot.validity !== "valid" ? (
                        <Badge variant="destructive" className="text-xs">{shot.shotResult ?? shot.validity}</Badge>
                      ) : shot.shotShape ? (
                        <Badge variant="outline" className="text-xs">{shot.shotShape}</Badge>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

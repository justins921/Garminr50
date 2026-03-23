"use client";

import { useFetch } from "@/hooks/use-fetch";
import { StatCard } from "@/components/common/stat-card";
import { DistanceChart } from "@/components/charts/distance-chart";
import { DispersionChart } from "@/components/charts/dispersion-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { ClubStats } from "@/types/analytics";
import { Radio, Upload, BarChart3 } from "lucide-react";

interface OverviewData {
  totalShots: number;
  totalSessions: number;
  recentSessions: Array<{
    id: string;
    name: string;
    startedAt: string;
    environment: string;
    sessionType: string;
    _count: { shots: number };
  }>;
}

export default function DashboardPage() {
  const { data: overview } = useFetch<OverviewData>("/api/analytics?type=overview");
  const { data: clubStats } = useFetch<ClubStats[]>("/api/analytics?type=clubs");
  const { data: allShots } = useFetch<Array<{
    carryDistance: number | null;
    totalDistance: number | null;
    offlineDistance: number | null;
    ballSpeed: number | null;
    validity: string;
    club: { name: string } | null;
  }>>("/api/shots?limit=200");

  const dispersionData = (allShots ?? [])
    .filter((s) => s.carryDistance != null && s.offlineDistance != null && s.validity === "valid")
    .map((s) => ({
      x: s.offlineDistance!,
      y: s.carryDistance!,
      totalDistance: s.totalDistance ?? undefined,
      clubName: s.club?.name,
      ballSpeed: s.ballSpeed ?? undefined,
    }));

  const gappingData = (clubStats ?? [])
    .filter((c) => c.shotCount >= 3)
    .sort((a, b) => b.avgCarry - a.avgCarry);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your golf analytics overview</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            href="/live"
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">Live Session</span>
            <span className="sm:hidden">Live</span>
          </Link>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Shots" value={overview?.totalShots ?? 0} />
        <StatCard label="Sessions" value={overview?.totalSessions ?? 0} />
        <StatCard
          label="Longest Carry"
          value={clubStats && clubStats.length > 0
            ? Math.max(...clubStats.map((c) => c.bestCarry))
            : 0}
          unit="yds"
        />
        <StatCard
          label="Clubs Tracked"
          value={clubStats?.filter((c) => c.shotCount > 0).length ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Club Gapping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DistanceChart data={gappingData} title="" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shot Dispersion (Recent)</CardTitle>
          </CardHeader>
          <CardContent>
            <DispersionChart data={dispersionData.slice(0, 100)} title="" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {!overview?.recentSessions?.length ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sessions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start a live session or import data to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {overview.recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                      {session.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(session.startedAt), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {session._count.shots} shots
                    </Badge>
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                      {session.environment}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

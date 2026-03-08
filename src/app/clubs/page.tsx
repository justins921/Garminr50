"use client";

import { useFetch } from "@/hooks/use-fetch";
import { StatCard } from "@/components/common/stat-card";
import { DistanceChart } from "@/components/charts/distance-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair } from "lucide-react";
import { ClubStats } from "@/types/analytics";

export default function ClubsPage() {
  const { data: clubStats, loading } = useFetch<ClubStats[]>("/api/analytics?type=clubs");

  const sorted = (clubStats ?? [])
    .filter((c) => c.shotCount > 0)
    .sort((a, b) => b.avgCarry - a.avgCarry);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Crosshair className="w-6 h-6" />
          Club Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Performance breakdown by club
        </p>
      </div>

      {/* Gapping Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Club Gapping</CardTitle>
        </CardHeader>
        <CardContent>
          <DistanceChart data={sorted} title="" height={300} />
        </CardContent>
      </Card>

      {/* Club Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((club) => (
            <Card key={club.clubId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{club.clubName}</CardTitle>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-xs">{club.shotCount} shots</Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        club.consistencyScore >= 70
                          ? "text-emerald-500 border-emerald-500/30"
                          : club.consistencyScore >= 40
                          ? "text-amber-500 border-amber-500/30"
                          : "text-red-500 border-red-500/30"
                      }`}
                    >
                      {club.consistencyScore}% consistent
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Carry</p>
                    <p className="text-lg font-bold tabular-nums">{club.avgCarry} <span className="text-xs font-normal text-muted-foreground">yds</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Total</p>
                    <p className="text-lg font-bold tabular-nums">{club.avgTotal} <span className="text-xs font-normal text-muted-foreground">yds</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ball Speed</p>
                    <p className="text-lg font-bold tabular-nums">{club.avgBallSpeed} <span className="text-xs font-normal text-muted-foreground">mph</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Spin Rate</p>
                    <p className="text-sm font-medium tabular-nums">{club.avgSpinRate} rpm</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Launch</p>
                    <p className="text-sm font-medium tabular-nums">{club.avgLaunchAngle}°</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Smash</p>
                    <p className="text-sm font-medium tabular-nums">{club.avgSmashFactor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Std Dev</p>
                    <p className="text-sm font-medium tabular-nums">±{club.stdDevCarry} yds</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Miss Tendency</p>
                    <p className="text-sm font-medium">{club.missTendency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Best 5 Avg</p>
                    <p className="text-sm font-medium tabular-nums">{club.best5Carry} yds</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

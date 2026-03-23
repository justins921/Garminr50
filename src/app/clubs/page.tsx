"use client";

import { useState, useMemo, useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GappingBarChart } from "@/components/charts/gapping-bar-chart";
import { TrajectoryChart, CLUB_COLORS } from "@/components/charts/trajectory-chart";
import { ClubStats } from "@/types/analytics";

export default function ClubsPage() {
  const { data: clubStats, loading } = useFetch<ClubStats[]>("/api/analytics?type=clubs");
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set());
  const [gapMode, setGapMode] = useState<"gapping" | "dispersion">("gapping");
  const [initialized, setInitialized] = useState(false);

  const sorted = useMemo(() => {
    const s = (clubStats ?? [])
      .filter((c) => c.shotCount > 0)
      .sort((a, b) => b.avgTotal - a.avgTotal);

    // Auto-select all clubs on first load
    if (s.length > 0 && !initialized) {
      setSelectedClubs(new Set(s.map((c) => c.clubId)));
      setInitialized(true);
    }

    return s;
  }, [clubStats, initialized]);

  const toggleClub = useCallback((id: string) => {
    setSelectedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => setSelectedClubs(new Set(sorted.map((c) => c.clubId)));
  const deselectAll = () => setSelectedClubs(new Set());

  // Color assignment — consistent by sort order
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    sorted.forEach((club, i) => {
      map.set(club.clubId, CLUB_COLORS[i % CLUB_COLORS.length]);
    });
    return map;
  }, [sorted]);

  // Filtered clubs for charts
  const selectedSorted = sorted.filter((c) => selectedClubs.has(c.clubId));

  const gappingData = selectedSorted.map((club, idx) => {
    const next = idx < selectedSorted.length - 1 ? selectedSorted[idx + 1] : undefined;
    return {
      clubName: club.clubName,
      avgTotal: club.avgTotal,
      avgCarry: club.avgCarry,
      color: colorMap.get(club.clubId) ?? CLUB_COLORS[0],
      gapToNext: next ? Math.round(club.avgTotal - next.avgTotal) : undefined,
    };
  });

  const trajectoryData = selectedSorted.map((club) => ({
    clubName: club.clubName,
    avgCarry: club.avgCarry,
    avgLaunchAngle: club.avgLaunchAngle,
    apexHeight: club.avgApexHeight > 0 ? club.avgApexHeight * 3 : undefined, // yards → feet
    color: colorMap.get(club.clubId) ?? CLUB_COLORS[0],
  }));

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Top row: Table + Gapping */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Club Averages Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Club Averages</CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left py-2 px-2 font-medium">Club</th>
                    <th className="text-right py-2 px-1 font-medium">
                      <span className="block">Total</span>
                      <span className="text-[9px] font-normal">yds</span>
                    </th>
                    <th className="text-right py-2 px-1 font-medium">
                      <span className="block">Carry</span>
                      <span className="text-[9px] font-normal">yds</span>
                    </th>
                    <th className="text-right py-2 px-1 font-medium hidden md:table-cell">
                      <span className="block">Club Spd</span>
                      <span className="text-[9px] font-normal">mph</span>
                    </th>
                    <th className="text-right py-2 px-1 font-medium">
                      <span className="block">Ball Spd</span>
                      <span className="text-[9px] font-normal">mph</span>
                    </th>
                    <th className="text-right py-2 px-1 font-medium">
                      <span className="block">Spin</span>
                      <span className="text-[9px] font-normal">rpm</span>
                    </th>
                    <th className="text-right py-2 px-1 font-medium">
                      <span className="block">Launch</span>
                      <span className="text-[9px] font-normal">deg</span>
                    </th>
                    <th className="text-right py-2 px-1 font-medium">
                      <span className="block">Offline</span>
                      <span className="text-[9px] font-normal">yds</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((club) => {
                    const isSelected = selectedClubs.has(club.clubId);
                    const color = colorMap.get(club.clubId);
                    const offline = club.avgOffline;
                    const offlineStr = Math.abs(offline) < 0.1
                      ? "0"
                      : `${Math.abs(offline).toFixed(1)} ${offline < 0 ? "L" : "R"}`;

                    return (
                      <tr
                        key={club.clubId}
                        onClick={() => toggleClub(club.clubId)}
                        className={`cursor-pointer border-t border-border/30 transition-colors ${
                          isSelected
                            ? "hover:bg-accent/50"
                            : "opacity-40 hover:opacity-60"
                        }`}
                      >
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className={`${isSelected ? "font-semibold" : "font-normal"}`}>
                              {club.clubName}
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-2.5 px-1 tabular-nums font-medium">
                          {club.avgTotal}
                        </td>
                        <td className="text-right py-2.5 px-1 tabular-nums font-medium">
                          {club.avgCarry}
                        </td>
                        <td className="text-right py-2.5 px-1 tabular-nums hidden md:table-cell">
                          {club.avgClubSpeed > 0 ? club.avgClubSpeed : "—"}
                        </td>
                        <td className="text-right py-2.5 px-1 tabular-nums">
                          {club.avgBallSpeed}
                        </td>
                        <td className="text-right py-2.5 px-1 tabular-nums">
                          {club.avgSpinRate.toLocaleString()}
                        </td>
                        <td className="text-right py-2.5 px-1 tabular-nums">
                          {club.avgLaunchAngle}°
                        </td>
                        <td className={`text-right py-2.5 px-1 tabular-nums font-medium ${
                          Math.abs(offline) > 5 ? "text-amber-400" : ""
                        }`}>
                          {offlineStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Gapping Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Gapping</CardTitle>
              <div className="inline-flex rounded-md border overflow-hidden text-xs">
                <button
                  onClick={() => setGapMode("dispersion")}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    gapMode === "dispersion"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dispersion
                </button>
                <button
                  onClick={() => setGapMode("gapping")}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    gapMode === "gapping"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Gapping
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <GappingBarChart
              clubs={gappingData}
              height={Math.max(300, selectedSorted.length * 38)}
              mode={gapMode}
            />
          </CardContent>
        </Card>
      </div>

      {/* Trajectory Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <TrajectoryChart clubs={trajectoryData} height={320} />
        </CardContent>
      </Card>
    </div>
  );
}

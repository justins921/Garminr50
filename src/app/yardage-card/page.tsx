"use client";

import { useFetch } from "@/hooks/use-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, AlertTriangle } from "lucide-react";
import { ClubStats } from "@/types/analytics";

interface MatrixEntry {
  id: string;
  clubId: string;
  swingKey: string;
  swingLabel: string;
  avgCarry: number | null;
  avgTotal: number | null;
  minCarry: number | null;
  maxCarry: number | null;
  minTotal: number | null;
  maxTotal: number | null;
  avgSpinRate: number | null;
  shotCount: number;
  status: string;
  notes: string | null;
  club?: { name: string; loft: number | null } | null;
}

interface WedgeMatrix {
  id: string;
  name: string;
  system: string;
  entries: MatrixEntry[];
  swingKeys: Array<{ key: string; label: string }>;
}

export default function YardageCardPage() {
  const { data: clubStats, loading: clubsLoading } = useFetch<ClubStats[]>("/api/analytics?type=clubs");
  const { data: matrix, loading: matrixLoading } = useFetch<WedgeMatrix | null>("/api/wedge-matrix");

  const loading = clubsLoading || matrixLoading;

  // Full swing clubs sorted by total distance (longest first)
  const fullSwingClubs = (clubStats ?? [])
    .filter((c) => c.shotCount >= 3)
    .sort((a, b) => b.avgTotal - a.avgTotal);

  // Wedge matrix data grouped by club
  const hasMatrix = matrix && matrix.entries.length > 0;
  const matrixClubs = hasMatrix
    ? [...new Set(matrix!.entries.map((e) => e.clubId))].map((id) => {
        const entry = matrix!.entries.find((e) => e.clubId === id);
        return { id, name: entry?.club?.name ?? "Unknown", loft: entry?.club?.loft };
      }).sort((a, b) => (a.loft ?? 99) - (b.loft ?? 99))
    : [];

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6" />
          Yardage Card
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your complete distance reference — full swings and wedge partials
        </p>
      </div>

      {/* Full Swing Distances */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Full Swing Distances</CardTitle>
        </CardHeader>
        <CardContent>
          {fullSwingClubs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No club data yet — import shots or start a live session
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="py-2 px-2 text-left font-medium">Club</th>
                    <th className="py-2 px-2 text-right font-medium">Carry</th>
                    <th className="py-2 px-2 text-right font-medium">Total</th>
                    <th className="py-2 px-2 text-right font-medium hidden sm:table-cell">Spread</th>
                    <th className="py-2 px-2 text-right font-medium hidden md:table-cell">Spin</th>
                    <th className="py-2 px-2 text-right font-medium hidden md:table-cell">Launch</th>
                    <th className="py-2 px-2 text-right font-medium">Shots</th>
                  </tr>
                </thead>
                <tbody>
                  {fullSwingClubs.map((club) => (
                    <tr key={club.clubId} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                      <td className="py-2 px-2 font-medium">{club.clubName}</td>
                      <td className="py-2 px-2 text-right tabular-nums font-bold">{club.avgCarry}</td>
                      <td className="py-2 px-2 text-right tabular-nums font-bold">{club.avgTotal}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                        ±{club.stdDevCarry}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                        {club.avgSpinRate > 0 ? club.avgSpinRate.toLocaleString() : "—"}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                        {club.avgLaunchAngle > 0 ? `${club.avgLaunchAngle}°` : "—"}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Badge variant="secondary" className="text-[10px]">{club.shotCount}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wedge Partial Swings */}
      {hasMatrix && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Wedge Partial Swings</CardTitle>
              <Badge variant="outline" className="text-xs">
                {matrix!.system === "clock" ? "Clock System" : matrix!.system === "percentage" ? "Percentage" : "Feel-Based"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {matrixClubs.map((club) => {
                const entries = matrix!.entries
                  .filter((e) => e.clubId === club.id && e.avgCarry != null)
                  .sort((a, b) => {
                    const order = matrix!.swingKeys.map((sk) => sk.key);
                    return order.indexOf(a.swingKey) - order.indexOf(b.swingKey);
                  });

                if (entries.length === 0) return null;

                return (
                  <div key={club.id}>
                    <h3 className="font-semibold text-sm mb-2">{club.name}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b">
                            <th className="py-1.5 px-2 text-left font-medium">Position</th>
                            <th className="py-1.5 px-2 text-right font-medium">Carry</th>
                            <th className="py-1.5 px-2 text-right font-medium hidden sm:table-cell">Carry Range</th>
                            <th className="py-1.5 px-2 text-right font-medium">Total</th>
                            <th className="py-1.5 px-2 text-right font-medium hidden sm:table-cell">Total Range</th>
                            <th className="py-1.5 px-2 text-right font-medium hidden md:table-cell">Spin</th>
                            <th className="py-1.5 px-2 text-center font-medium">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry) => (
                            <tr key={entry.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                              <td className="py-2 px-2 font-medium">{entry.swingLabel}</td>
                              <td className="py-2 px-2 text-right tabular-nums font-bold">{entry.avgCarry}</td>
                              <td className="py-2 px-2 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                                {entry.minCarry}–{entry.maxCarry}
                              </td>
                              <td className="py-2 px-2 text-right tabular-nums font-bold">{entry.avgTotal}</td>
                              <td className="py-2 px-2 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                                {entry.minTotal != null && entry.maxTotal != null
                                  ? `${entry.minTotal}–${entry.maxTotal}`
                                  : "—"}
                              </td>
                              <td className="py-2 px-2 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                                {entry.avgSpinRate ? entry.avgSpinRate.toLocaleString() : "—"}
                              </td>
                              <td className="py-2 px-2 text-center">
                                {entry.notes ? (
                                  <span className="inline-flex items-center gap-1 text-amber-500">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="text-[10px] hidden sm:inline">{entry.notes}</span>
                                  </span>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasMatrix && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No wedge partial swing data yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Go to Wedge Matrix to set up your partial swing distances
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

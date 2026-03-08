"use client";

import { useState, useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DispersionCircleChart } from "@/components/charts/dispersion-circle-chart";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crosshair, CheckCircle2, Circle, ArrowRight, RotateCcw, Plus } from "lucide-react";
import { toast } from "sonner";

interface ClubItem {
  id: string;
  name: string;
  type: string;
  loft: number | null;
  _count: { shots: number };
}

interface BagMappingClub {
  id: string;
  clubId: string;
  status: string;
  avgCarry: number | null;
  avgTotal: number | null;
  minCarry: number | null;
  maxCarry: number | null;
  avgOffline: number | null;
  dispersionRadius: number | null;
  dispersionAngle: number | null;
  shotCount: number;
  club?: { id: string; name: string; type: string; loft: number | null };
}

interface BagMapping {
  id: string;
  name: string;
  minShots: number;
  clubs: BagMappingClub[];
}

export default function BagMappingPage() {
  const { data: allClubs } = useFetch<ClubItem[]>("/api/clubs");
  const { data: mapping, refetch: refetchMapping } = useFetch<BagMapping | null>("/api/bag-mapping");
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set());
  const [minShots, setMinShots] = useState(5);
  const [creating, setCreating] = useState(false);
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  const hasMapping = mapping && mapping.clubs.length > 0;

  const toggleClub = (id: string) => {
    setSelectedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createMapping = async () => {
    if (selectedClubs.size === 0) {
      toast.error("Select at least one club");
      return;
    }
    setCreating(true);
    try {
      await fetch("/api/bag-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubIds: Array.from(selectedClubs),
          minShots,
        }),
      });
      toast.success("Bag mapping created");
      refetchMapping();
    } catch {
      toast.error("Failed to create mapping");
    } finally {
      setCreating(false);
    }
  };

  const recalculateClub = async (bagMappingClubId: string) => {
    try {
      const res = await fetch("/api/bag-mapping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bagMappingClubId }),
      });
      if (res.ok) {
        toast.success("Club data updated");
        refetchMapping();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Not enough data");
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  const completedClubs = mapping?.clubs.filter((c) => c.status === "completed") ?? [];
  const pendingClubs = mapping?.clubs.filter((c) => c.status !== "completed") ?? [];
  const progress = mapping ? Math.round((completedClubs.length / mapping.clubs.length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crosshair className="w-6 h-6" />
            Bag Mapping
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Map each club in your bag with real distances and dispersion data
          </p>
        </div>
        {hasMapping && (
          <div className="text-right">
            <p className="text-sm font-medium">{progress}% Complete</p>
            <p className="text-xs text-muted-foreground">
              {completedClubs.length}/{mapping!.clubs.length} clubs mapped
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {hasMapping && (
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Setup: Choose clubs */}
      {!hasMapping && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Your Clubs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose which clubs are in your bag. You'll hit a minimum number of shots with each
              to establish your distances, dispersion circle, and dispersion arc.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {(allClubs ?? []).map((club) => (
                <button
                  key={club.id}
                  onClick={() => toggleClub(club.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedClubs.has(club.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <p className="font-medium text-sm">{club.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {club.type}{club.loft ? ` · ${club.loft}°` : ""}
                  </p>
                  {selectedClubs.has(club.id) && (
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-4">
              <div>
                <Label>Minimum shots per club</Label>
                <Input
                  type="number"
                  min={3}
                  max={20}
                  value={minShots}
                  onChange={(e) => setMinShots(parseInt(e.target.value) || 5)}
                  className="w-24"
                />
              </div>
              <Button onClick={createMapping} disabled={creating || selectedClubs.size === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Start Bag Mapping ({selectedClubs.size} clubs)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active mapping - club list */}
      {hasMapping && (
        <>
          {/* Summary cards for completed clubs */}
          {completedClubs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mapped Clubs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="py-2 px-2 text-left">Club</th>
                        <th className="py-2 px-2 text-right">Avg Carry</th>
                        <th className="py-2 px-2 text-right">Range</th>
                        <th className="py-2 px-2 text-right">Avg Total</th>
                        <th className="py-2 px-2 text-right">Dispersion</th>
                        <th className="py-2 px-2 text-right">Arc</th>
                        <th className="py-2 px-2 text-right">Shots</th>
                        <th className="py-2 px-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedClubs
                        .sort((a, b) => (b.avgCarry ?? 0) - (a.avgCarry ?? 0))
                        .map((mc) => (
                        <tr
                          key={mc.id}
                          className={`border-b hover:bg-accent/50 cursor-pointer transition-colors ${
                            expandedClub === mc.id ? "bg-accent/50" : ""
                          }`}
                          onClick={() => setExpandedClub(expandedClub === mc.id ? null : mc.id)}
                        >
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="font-medium">{mc.club?.name}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right font-bold tabular-nums">
                            {mc.avgCarry} yds
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">
                            {mc.minCarry}–{mc.maxCarry}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums">
                            {mc.avgTotal ?? "—"} yds
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums">
                            {mc.dispersionRadius} yd radius
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums">
                            {mc.dispersionAngle}°
                          </td>
                          <td className="py-2 px-2 text-right">
                            <Badge variant="secondary" className="text-xs">{mc.shotCount}</Badge>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                recalculateClub(mc.id);
                              }}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Expanded dispersion chart */}
                {expandedClub && (() => {
                  const mc = completedClubs.find((c) => c.id === expandedClub);
                  if (!mc || !mc.avgCarry || !mc.dispersionRadius) return null;
                  return (
                    <div className="mt-4 border-t pt-4">
                      <DispersionCircleChart
                        carries={[mc.avgCarry - 5, mc.avgCarry + 3, mc.avgCarry - 2, mc.avgCarry + 5, mc.avgCarry]}
                        offlines={[mc.avgOffline ?? 0, (mc.avgOffline ?? 0) + 3, (mc.avgOffline ?? 0) - 4, (mc.avgOffline ?? 0) + 1, mc.avgOffline ?? 0]}
                        avgCarry={mc.avgCarry}
                        avgOffline={mc.avgOffline ?? 0}
                        dispersionRadius={mc.dispersionRadius}
                        dispersionAngle={mc.dispersionAngle ?? 15}
                        clubName={mc.club?.name ?? "Unknown"}
                        height={350}
                      />
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Pending clubs */}
          {pendingClubs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Clubs to Map ({pendingClubs.length} remaining)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingClubs.map((mc) => (
                    <div
                      key={mc.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Circle className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{mc.club?.name ?? "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">
                            {mc.shotCount > 0
                              ? `${mc.shotCount}/${mapping!.minShots} shots`
                              : `Need ${mapping!.minShots} shots`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {mc.shotCount > 0 && (
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, (mc.shotCount / mapping!.minShots) * 100)}%` }}
                            />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => recalculateClub(mc.id)}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Calculate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">How to map your clubs:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1 text-xs">
                    <li>Start a live session or import shot data</li>
                    <li>Hit at least {mapping!.minShots} shots with each club</li>
                    <li>Click "Calculate" to compute distances and dispersion</li>
                    <li>Clubs with enough data will be automatically mapped</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

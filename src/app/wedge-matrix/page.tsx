"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { WedgeMatrixGrid } from "@/components/charts/wedge-matrix-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Target, CheckCircle2, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ClubItem {
  id: string;
  name: string;
  type: string;
  loft: number | null;
  _count: { shots: number };
}

interface MatrixEntry {
  id: string;
  clubId: string;
  swingKey: string;
  swingLabel: string;
  avgCarry: number | null;
  avgTotal: number | null;
  avgSpinRate: number | null;
  avgLaunchAngle: number | null;
  minCarry: number | null;
  maxCarry: number | null;
  shotCount: number;
  status: string;
  club?: { name: string; loft: number | null } | null;
}

interface WedgeMatrix {
  id: string;
  name: string;
  system: string;
  entries: MatrixEntry[];
  swingKeys: Array<{ key: string; label: string }>;
}

const SYSTEMS = [
  {
    id: "clock",
    name: "Clock System (Dave Pelz)",
    description: "Use arm positions on a clock face: 7:30, 9:00, 10:30, and full swing. Creates 4 distances per wedge.",
  },
  {
    id: "percentage",
    name: "Percentage System",
    description: "Use percentage of full swing: 25%, 50%, 75%, and 100%. Simple and intuitive for most golfers.",
  },
  {
    id: "feel",
    name: "Feel-Based System",
    description: "Bump & run, soft/finesse, three-quarter, and full swing. More intuitive for feel-oriented players.",
  },
];

export default function WedgeMatrixPage() {
  const { data: allClubs } = useFetch<ClubItem[]>("/api/clubs");
  const { data: matrix, refetch: refetchMatrix } = useFetch<WedgeMatrix | null>("/api/wedge-matrix");
  const [selectedSystem, setSelectedSystem] = useState("clock");
  const [selectedWedges, setSelectedWedges] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const wedgeClubs = (allClubs ?? []).filter((c) => c.type === "wedge");
  const hasMatrix = matrix && matrix.entries.length > 0;

  const completedEntries = matrix?.entries.filter((e) => e.status === "completed") ?? [];
  const totalEntries = matrix?.entries.length ?? 0;
  const progress = totalEntries > 0 ? Math.round((completedEntries.length / totalEntries) * 100) : 0;

  const toggleWedge = (id: string) => {
    setSelectedWedges((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createMatrix = async () => {
    if (selectedWedges.size === 0) {
      toast.error("Select at least one wedge");
      return;
    }
    setCreating(true);
    try {
      await fetch("/api/wedge-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: selectedSystem,
          clubIds: Array.from(selectedWedges),
        }),
      });
      toast.success("Wedge matrix created");
      refetchMatrix();
    } catch {
      toast.error("Failed to create matrix");
    } finally {
      setCreating(false);
    }
  };

  const recalculateEntry = async (entryId: string) => {
    try {
      const res = await fetch("/api/wedge-matrix", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      if (res.ok) {
        toast.success("Entry updated");
        refetchMatrix();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Not enough data");
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Wedge Matrix
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Build your personal wedge distance chart for scoring zone precision
          </p>
        </div>
        {hasMatrix && (
          <div className="text-right">
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {progress}% Complete
            </Badge>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedEntries.length}/{totalEntries} distances mapped
            </p>
          </div>
        )}
      </div>

      {/* Setup */}
      {!hasMatrix && (
        <>
          {/* System Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Choose Your System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {SYSTEMS.map((sys) => (
                <button
                  key={sys.id}
                  onClick={() => setSelectedSystem(sys.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    selectedSystem === sys.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{sys.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sys.description}</p>
                    </div>
                    {selectedSystem === sys.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Wedge Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Your Wedges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {wedgeClubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => toggleWedge(club.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedWedges.has(club.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <p className="font-medium text-sm">{club.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {club.loft ? `${club.loft}°` : club.type}
                    </p>
                    {selectedWedges.has(club.id) && (
                      <CheckCircle2 className="w-4 h-4 text-primary mt-1" />
                    )}
                  </button>
                ))}
              </div>

              {wedgeClubs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No wedges found. Add wedge clubs in Settings first.
                </p>
              )}

              <Button onClick={createMatrix} disabled={creating || selectedWedges.size === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Create Matrix ({selectedWedges.size} wedges x {SYSTEMS.find((s) => s.id === selectedSystem)?.name.includes("Clock") ? "4" : "4"} swings)
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Matrix Grid */}
      {hasMatrix && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {matrix!.name} — {SYSTEMS.find((s) => s.id === matrix!.system)?.name ?? matrix!.system}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Carry distance in yards
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <WedgeMatrixGrid
                entries={matrix!.entries}
                swingKeys={matrix!.swingKeys}
                onCellClick={(entry) => recalculateEntry(entry.id)}
              />
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3 text-sm">
                <p className="font-medium">How to fill in your matrix:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground mb-1">1. Hit shots</p>
                    <p>Start a live session or import data. Hit 3+ shots per wedge per swing length. Tag shots with the appropriate swing type.</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground mb-1">2. Calculate</p>
                    <p>Click any cell in the matrix to recalculate from your shot data. The system will average your carries with that club.</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground mb-1">3. Use on course</p>
                    <p>Reference your matrix when you're between 30-130 yards. Know exactly which wedge + swing gives you each distance.</p>
                  </div>
                </div>

                {matrix!.system === "clock" && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Clock System Guide</p>
                    <p><strong>7:30</strong> — Arms at hip height, shortest swing. <strong>9:00</strong> — Arms parallel to ground. <strong>10:30</strong> — Hands above trail shoulder. <strong>Full</strong> — Complete backswing.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

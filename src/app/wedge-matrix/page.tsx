"use client";

import { useState, useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { WedgeMatrixGrid } from "@/components/charts/wedge-matrix-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Target, CheckCircle2, Plus, RotateCcw, Upload, FileText } from "lucide-react";
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
  minTotal: number | null;
  maxTotal: number | null;
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

const SYSTEMS = [
  {
    id: "clock",
    name: "Clock System",
    description: "Use arm positions on a clock face: 7, 8, 9, and 10 o'clock. Creates 4 distances per wedge.",
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

const SWING_OPTIONS: Record<string, Array<{ key: string; label: string }>> = {
  clock: [
    { key: "7", label: "7 O'Clock" },
    { key: "8", label: "8 O'Clock" },
    { key: "9", label: "9 O'Clock" },
    { key: "10", label: "10 O'Clock" },
  ],
  percentage: [
    { key: "25", label: "25% Swing" },
    { key: "50", label: "50% Swing" },
    { key: "75", label: "75% Swing" },
    { key: "100", label: "Full Swing" },
  ],
  feel: [
    { key: "bump", label: "Bump & Run" },
    { key: "soft", label: "Soft / Finesse" },
    { key: "three_quarter", label: "Three-Quarter" },
    { key: "full", label: "Full Swing" },
  ],
};

export default function WedgeMatrixPage() {
  const { data: allClubs } = useFetch<ClubItem[]>("/api/clubs");
  const { data: matrix, refetch: refetchMatrix } = useFetch<WedgeMatrix | null>("/api/wedge-matrix");
  const [selectedSystem, setSelectedSystem] = useState("clock");
  const [selectedWedges, setSelectedWedges] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  // Upload state
  const [uploadClub, setUploadClub] = useState("");
  const [uploadSystem, setUploadSystem] = useState("clock");
  const [uploadPosition, setUploadPosition] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const wedgeClubs = (allClubs ?? []).filter((c) => c.type === "wedge");
  const hasMatrix = matrix && matrix.entries.length > 0;

  const completedEntries = matrix?.entries.filter((e) => e.status === "completed") ?? [];
  const totalEntries = matrix?.entries.length ?? 0;
  const progress = totalEntries > 0 ? Math.round((completedEntries.length / totalEntries) * 100) : 0;

  // If a matrix exists, use its system for upload defaults
  const activeSystem = hasMatrix ? matrix!.system : uploadSystem;
  const positionOptions = SWING_OPTIONS[activeSystem] ?? SWING_OPTIONS.clock;

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setUploadFile(dropped);
  }, []);

  const handleUpload = async () => {
    if (!uploadFile || !uploadClub || !uploadPosition) {
      toast.error("Select a club, position, and file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("clubId", uploadClub);
      formData.append("swingKey", uploadPosition);

      const res = await fetch("/api/wedge-matrix/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Import failed");
      } else {
        const club = (allClubs ?? []).find((c) => c.id === uploadClub);
        const pos = positionOptions.find((p) => p.key === uploadPosition);
        toast.success(`Imported ${data.shotCount} shots`, {
          description: `${club?.name ?? "Club"} — ${pos?.label ?? uploadPosition}`,
        });
        setUploadFile(null);
        refetchMatrix();
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
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
          <div className="text-right flex-shrink-0">
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {progress}% Complete
            </Badge>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedEntries.length}/{totalEntries} distances mapped
            </p>
          </div>
        )}
      </div>

      {/* Import Shot Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Shot Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV or JSON file of shot data for a specific club and swing position.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs mb-1.5 block">Club</Label>
              <Select value={uploadClub} onValueChange={(v) => setUploadClub(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select club..." /></SelectTrigger>
                <SelectContent>
                  {wedgeClubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.loft ? ` (${c.loft}°)` : ""}
                    </SelectItem>
                  ))}
                  {wedgeClubs.length === 0 && (allClubs ?? []).length > 0 && (
                    <>
                      {(allClubs ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.loft ? ` (${c.loft}°)` : ""}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {!hasMatrix && (
              <div>
                <Label className="text-xs mb-1.5 block">System</Label>
                <Select value={uploadSystem} onValueChange={(v) => setUploadSystem(v ?? "clock")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SYSTEMS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-xs mb-1.5 block">Position</Label>
              <Select value={uploadPosition} onValueChange={(v) => setUploadPosition(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select position..." /></SelectTrigger>
                <SelectContent>
                  {positionOptions.map((p) => (
                    <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {uploadFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm truncate">{uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setUploadFile(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium text-sm">Drop a CSV or JSON file here</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv,.json"
                  className="sr-only"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!uploadFile || !uploadClub || !uploadPosition || uploading}
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Importing..." : "Import to Matrix"}
          </Button>
        </CardContent>
      </Card>

      {/* Setup — only when no matrix exists */}
      {!hasMatrix && (
        <>
          <div className="relative flex items-center gap-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or set up manually</span>
            <div className="flex-1 border-t border-border" />
          </div>

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
                Create Matrix ({selectedWedges.size} wedges x 4 swings)
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
              <div className="flex items-center justify-between flex-wrap gap-2">
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
                    <p className="font-medium text-foreground mb-1">1. Upload shot data</p>
                    <p>Use the import section above to upload a CSV or JSON file for each club and swing position.</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground mb-1">2. Review</p>
                    <p>Each cell shows avg carry, range, spin, and shot count. Click a cell to recalculate from all shots for that club.</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground mb-1">3. Use on course</p>
                    <p>Reference your matrix when you're between 30-130 yards. Know exactly which wedge + swing gives you each distance.</p>
                  </div>
                </div>

                {matrix!.system === "clock" && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Clock System Guide</p>
                    <p><strong>7 O'Clock</strong> — Shortest swing, arms at hip height. <strong>8 O'Clock</strong> — Arms between hip and parallel. <strong>9 O'Clock</strong> — Arms parallel to ground. <strong>10 O'Clock</strong> — Hands above trail shoulder, longest partial swing.</p>
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

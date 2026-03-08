"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [environment, setEnvironment] = useState("indoor");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ sessionId: string; shotCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", file.name.endsWith(".json") ? "json" : "csv");
    formData.append("environment", environment);
    if (sessionName) formData.append("sessionName", sessionName);

    try {
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Import failed");
        toast.error("Import failed", { description: data.error });
      } else {
        setResult(data);
        toast.success(`Imported ${data.shotCount} shots`);
      }
    } catch (err) {
      setError("Network error");
      toast.error("Import failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="w-6 h-6" />
          Import Data
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Import shot data from CSV or JSON files exported from Garmin Golf
        </p>
      </div>

      {/* Drop Zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Drop a CSV or JSON file here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv,.json"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  style={{ position: "relative" }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Import Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Session Name (optional)</Label>
            <Input
              placeholder="e.g., Driver Session March 8"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
          </div>
          <div>
            <Label>Environment</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v ?? "indoor")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indoor">Indoor</SelectItem>
                <SelectItem value="outdoor">Outdoor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? "Importing..." : "Import File"}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="border-emerald-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <div>
                <p className="font-medium">Import Successful</p>
                <p className="text-sm text-muted-foreground">
                  {result.shotCount} shots imported
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => router.push(`/sessions/${result.sessionId}`)}
              >
                View Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <p className="font-medium text-red-500">Import Failed</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supported Formats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Supported Formats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Garmin Golf CSV Export</p>
            <p className="text-muted-foreground text-xs">
              Export from Garmin Golf app: Sessions &gt; Select session &gt; Share &gt; Export CSV
            </p>
          </div>
          <div>
            <p className="font-medium">JSON (Garmin Data Dump)</p>
            <p className="text-muted-foreground text-xs">
              Request your data from Garmin Account Settings. Shot data is in the JSON export.
            </p>
          </div>
          <div>
            <p className="font-medium">Generic CSV/JSON</p>
            <p className="text-muted-foreground text-xs">
              Any CSV/JSON with columns like: ball speed, carry distance, spin rate, club name, etc.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

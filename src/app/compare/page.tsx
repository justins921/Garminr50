"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { StatCard } from "@/components/common/stat-card";
import { DispersionChart } from "@/components/charts/dispersion-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitCompare } from "lucide-react";
import { SessionStats } from "@/types/analytics";

interface SessionItem {
  id: string;
  name: string;
  startedAt: string;
  _count: { shots: number };
}

export default function ComparePage() {
  const [sessionA, setSessionA] = useState<string>("");
  const [sessionB, setSessionB] = useState<string>("");

  const { data: sessions } = useFetch<SessionItem[]>("/api/sessions");
  const { data: statsA } = useFetch<SessionStats>(
    sessionA ? `/api/analytics?type=session&sessionId=${sessionA}` : null,
    [sessionA]
  );
  const { data: statsB } = useFetch<SessionStats>(
    sessionB ? `/api/analytics?type=session&sessionId=${sessionB}` : null,
    [sessionB]
  );
  const { data: shotsA } = useFetch<Array<{
    carryDistance: number | null;
    offlineDistance: number | null;
    ballSpeed: number | null;
    validity: string;
    club: { name: string } | null;
  }>>(sessionA ? `/api/shots?sessionId=${sessionA}&limit=200` : null, [sessionA]);

  const { data: shotsB } = useFetch<Array<{
    carryDistance: number | null;
    offlineDistance: number | null;
    ballSpeed: number | null;
    validity: string;
    club: { name: string } | null;
  }>>(sessionB ? `/api/shots?sessionId=${sessionB}&limit=200` : null, [sessionB]);

  const metrics = statsA && statsB ? [
    { name: "Valid Shots", a: statsA.validShotCount, b: statsB.validShotCount, unit: "" },
    { name: "Avg Carry", a: statsA.avgCarry, b: statsB.avgCarry, unit: "yds" },
    { name: "Avg Total", a: statsA.avgTotal, b: statsB.avgTotal, unit: "yds" },
    { name: "Avg Ball Speed", a: statsA.avgBallSpeed, b: statsB.avgBallSpeed, unit: "mph" },
    { name: "Avg Club Speed", a: statsA.avgClubSpeed, b: statsB.avgClubSpeed, unit: "mph" },
    { name: "Avg Spin", a: statsA.avgSpinRate, b: statsB.avgSpinRate, unit: "rpm" },
    { name: "Avg Launch", a: statsA.avgLaunchAngle, b: statsB.avgLaunchAngle, unit: "°" },
    { name: "Avg Smash", a: statsA.avgSmashFactor, b: statsB.avgSmashFactor, unit: "" },
    { name: "Avg Offline", a: Math.abs(statsA.avgOffline), b: Math.abs(statsB.avgOffline), unit: "yds" },
  ] : [];

  const dispA = (shotsA ?? [])
    .filter((s) => s.carryDistance != null && s.offlineDistance != null && s.validity === "valid")
    .map((s) => ({ x: s.offlineDistance!, y: s.carryDistance!, clubName: s.club?.name, ballSpeed: s.ballSpeed ?? undefined }));
  const dispB = (shotsB ?? [])
    .filter((s) => s.carryDistance != null && s.offlineDistance != null && s.validity === "valid")
    .map((s) => ({ x: s.offlineDistance!, y: s.carryDistance!, clubName: s.club?.name, ballSpeed: s.ballSpeed ?? undefined }));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitCompare className="w-6 h-6" />
          Compare Sessions
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Side-by-side session comparison
        </p>
      </div>

      {/* Session Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <label className="text-sm font-medium mb-2 block">Session A</label>
            <Select value={sessionA} onValueChange={(v) => setSessionA(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select session..." /></SelectTrigger>
              <SelectContent>
                {(sessions ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s._count.shots} shots)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <label className="text-sm font-medium mb-2 block">Session B</label>
            <Select value={sessionB} onValueChange={(v) => setSessionB(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select session..." /></SelectTrigger>
              <SelectContent>
                {(sessions ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s._count.shots} shots)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Metrics Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="py-2 px-2 text-left">Metric</th>
                  <th className="py-2 px-2 text-right">Session A</th>
                  <th className="py-2 px-2 text-right">Session B</th>
                  <th className="py-2 px-2 text-right">Diff</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => {
                  const diff = m.a - m.b;
                  return (
                    <tr key={m.name} className="border-b">
                      <td className="py-2 px-2 font-medium">{m.name}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{m.a} {m.unit}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{m.b} {m.unit}</td>
                      <td className={`py-2 px-2 text-right tabular-nums ${
                        diff > 0 ? "text-emerald-500" : diff < 0 ? "text-red-500" : ""
                      }`}>
                        {diff > 0 ? "+" : ""}{Math.round(diff * 10) / 10} {m.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Dispersion Comparison */}
      {(dispA.length > 0 || dispB.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Session A Dispersion</CardTitle>
            </CardHeader>
            <CardContent>
              <DispersionChart data={dispA} title="" height={300} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Session B Dispersion</CardTitle>
            </CardHeader>
            <CardContent>
              <DispersionChart data={dispB} title="" height={300} />
            </CardContent>
          </Card>
        </div>
      )}

      {!sessionA && !sessionB && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Select two sessions to compare</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

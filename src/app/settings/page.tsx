"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Wifi, WifiOff, Database, Crosshair } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useWebSocket } from "@/hooks/use-websocket";

export default function SettingsPage() {
  const { connected } = useWebSocket("ws://localhost:8921");
  const { data: clubs } = useFetch<Array<{ id: string; name: string; type: string; loft: number | null; _count: { shots: number } }>>("/api/clubs");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Settings
        </h1>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {connected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4" />}
            R50 Bridge Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Bridge Service</span>
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>The R50 Bridge captures shots from your Garmin Approach R50 in real time.</p>
            <p>To start: run <code className="bg-muted px-1 rounded">npm run bridge</code></p>
            <p>The bridge listens on port 921 (GSPro protocol) and 8921 (WebSocket).</p>
          </div>
        </CardContent>
      </Card>

      {/* Database */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>SQLite database at <code className="bg-muted px-1 rounded">prisma/dev.db</code></p>
          <p>Reset: <code className="bg-muted px-1 rounded">npm run db:reset</code></p>
          <p>Seed: <code className="bg-muted px-1 rounded">npm run db:seed</code></p>
        </CardContent>
      </Card>

      {/* Clubs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Crosshair className="w-4 h-4" />
            Clubs ({clubs?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {(clubs ?? []).map((club) => (
              <div key={club.id} className="flex items-center justify-between py-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{club.name}</span>
                  <span className="text-xs text-muted-foreground">{club.type}</span>
                  {club.loft && <span className="text-xs text-muted-foreground">{club.loft}°</span>}
                </div>
                <Badge variant="secondary" className="text-xs">{club._count.shots} shots</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

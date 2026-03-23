"use client";

import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { StatCard } from "@/components/common/stat-card";
import { DispersionChart } from "@/components/charts/dispersion-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Radio, Pause, Play, Square, Wifi, WifiOff, Power } from "lucide-react";
import { GSProShotMessage, GSPRO_CLUB_MAP } from "@/types/shot";
import { avg } from "@/analytics/stats";
import { toast } from "sonner";

interface LiveShot {
  shotNumber: number;
  clubName: string;
  ballSpeed: number;
  clubSpeed?: number;
  carryDistance?: number;
  totalDistance?: number;
  spinRate: number;
  launchAngle: number;
  launchDirection: number;
  offlineDistance: number;
  spinAxis?: number;
  apexHeight?: number;
  timestamp: string;
}

const BRIDGE_WS_URL = "ws://localhost:8921";

export default function LiveSessionPage() {
  const { connected, lastMessage, send } = useWebSocket(BRIDGE_WS_URL);
  const [shots, setShots] = useState<LiveShot[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [selectedClub, setSelectedClub] = useState("DR");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<string>("disconnected");
  const [bridgeStarting, setBridgeStarting] = useState(false);

  // Bridge control — start/stop from the browser
  const startBridge = useCallback(async () => {
    setBridgeStarting(true);
    try {
      const res = await fetch("/api/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (data.running) {
        toast.success("R50 Bridge started");
      } else {
        toast.error("Bridge failed to start", {
          description: data.logs?.slice(-1)[0] ?? "Check console for details",
        });
      }
    } catch {
      toast.error("Failed to start bridge");
    } finally {
      setBridgeStarting(false);
    }
  }, []);

  const stopBridge = useCallback(async () => {
    try {
      await fetch("/api/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      toast.info("R50 Bridge stopped");
    } catch {
      toast.error("Failed to stop bridge");
    }
  }, []);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "shot" && sessionActive && !sessionPaused) {
      const msg = lastMessage.data as GSProShotMessage;
      const clubName = (lastMessage.club as string) ?? GSPRO_CLUB_MAP[selectedClub] ?? selectedClub;

      const newShot: LiveShot = {
        shotNumber: msg.ShotNumber,
        clubName,
        ballSpeed: msg.BallData.Speed,
        clubSpeed: msg.ClubData?.Speed,
        carryDistance: msg.BallData.CarryDistance,
        spinRate: msg.BallData.TotalSpin,
        launchAngle: msg.BallData.VLA,
        launchDirection: msg.BallData.HLA,
        offlineDistance: msg.BallData.HLA * 2, // approximate
        spinAxis: msg.BallData.SpinAxis,
        timestamp: lastMessage.timestamp as string,
      };

      setShots((prev) => [...prev, newShot]);

      // Save to database
      if (sessionId) {
        fetch("/api/shots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            shotNumber: newShot.shotNumber,
            ballSpeed: newShot.ballSpeed,
            clubSpeed: newShot.clubSpeed,
            carryDistance: newShot.carryDistance,
            spinRate: newShot.spinRate,
            launchAngle: newShot.launchAngle,
            launchDirection: msg.BallData.HLA,
            spinAxis: msg.BallData.SpinAxis,
            offlineDistance: newShot.offlineDistance,
            source: "live_bridge",
            rawPayload: JSON.stringify(msg),
          }),
        }).catch(console.error);
      }

      toast.success(`Shot #${newShot.shotNumber} captured`, {
        description: `${clubName} · ${newShot.carryDistance ?? "?"} yds carry`,
        duration: 2000,
      });
    }

    if (lastMessage.type === "device_status") {
      setDeviceStatus(lastMessage.status as string);
    }
  }, [lastMessage, sessionActive, sessionPaused, selectedClub, sessionId]);

  const startSession = useCallback(async () => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Live Session ${new Date().toLocaleString()}`,
        source: "live_bridge",
        isLive: true,
      }),
    });
    const session = await res.json();
    setSessionId(session.id);
    setSessionActive(true);
    setSessionPaused(false);
    setShots([]);
    toast.success("Live session started");
  }, []);

  const stopSession = useCallback(async () => {
    if (sessionId) {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: false, endedAt: new Date().toISOString() }),
      });
    }
    setSessionActive(false);
    setSessionPaused(false);
    toast.info(`Session ended · ${shots.length} shots`);
  }, [sessionId, shots.length]);

  const handleClubChange = (club: string | null) => {
    if (!club) return;
    setSelectedClub(club);
    send({ type: "set_club", club });
  };

  // Stats calculations
  const validShots = shots.filter((s) => s.carryDistance != null);
  const carries = validShots.map((s) => s.carryDistance!);
  const ballSpeeds = validShots.map((s) => s.ballSpeed);
  const spins = validShots.map((s) => s.spinRate);

  const dispersionData = validShots.map((s) => ({
    x: s.offlineDistance,
    y: s.carryDistance!,
    clubName: s.clubName,
    ballSpeed: s.ballSpeed,
  }));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${sessionActive ? "bg-red-500 animate-pulse" : "bg-muted"}`} />
          <div>
            <h1 className="text-2xl font-bold">Live Session</h1>
            <p className="text-sm text-muted-foreground">
              {sessionActive ? `Recording · ${shots.length} shots` : "Start a session to capture shots"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {connected ? (
            <>
              <Wifi className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-500 hidden sm:inline">Bridge Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground hidden sm:inline">Bridge Offline</span>
            </>
          )}
          {deviceStatus === "connected" && (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">R50</Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-full sm:w-auto">
              <Select value={selectedClub} onValueChange={handleClubChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GSPRO_CLUB_MAP).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!sessionActive ? (
                <Button onClick={startSession} className="bg-emerald-600 hover:bg-emerald-700">
                  <Radio className="w-4 h-4 mr-2" />
                  Start Session
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setSessionPaused(!sessionPaused)}
                  >
                    {sessionPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                    {sessionPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button variant="destructive" onClick={stopSession}>
                    <Square className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                </>
              )}
            </div>

            {!connected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={startBridge}
                disabled={bridgeStarting}
                className="sm:ml-auto"
              >
                <Power className="w-4 h-4 mr-2" />
                {bridgeStarting ? "Starting..." : "Start Bridge"}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={stopBridge}
                className="sm:ml-auto text-muted-foreground"
              >
                <Power className="w-4 h-4 mr-2" />
                Stop Bridge
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <StatCard label="Shots" value={shots.length} accent={sessionActive} />
        <StatCard label="Avg Carry" value={carries.length ? Math.round(avg(carries)) : "—"} unit="yds" />
        <StatCard label="Avg Ball Speed" value={ballSpeeds.length ? Math.round(avg(ballSpeeds)) : "—"} unit="mph" />
        <StatCard label="Avg Spin" value={spins.length ? Math.round(avg(spins)) : "—"} unit="rpm" />
        <StatCard
          label="Last Shot"
          value={shots.length > 0 ? `${shots[shots.length - 1].carryDistance ?? "?"}` : "—"}
          unit={shots.length > 0 ? "yds" : ""}
          subtitle={shots.length > 0 ? shots[shots.length - 1].clubName : undefined}
        />
      </div>

      {/* Charts + Shot List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Live Dispersion</CardTitle>
          </CardHeader>
          <CardContent>
            <DispersionChart data={dispersionData} title="" height={350} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shot List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[380px] overflow-y-auto space-y-1">
              {shots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {sessionActive ? "Waiting for shots..." : "Start a session to begin"}
                </div>
              ) : (
                [...shots].reverse().map((shot, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6 text-right">#{shot.shotNumber}</span>
                      <span className="font-medium">{shot.clubName}</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground tabular-nums">
                      <span>{shot.carryDistance ?? "?"} yds</span>
                      <span>{Math.round(shot.ballSpeed)} mph</span>
                      <span className="hidden sm:inline">{Math.round(shot.spinRate)} rpm</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

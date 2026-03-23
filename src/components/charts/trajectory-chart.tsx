"use client";

import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface TrajectoryClub {
  clubName: string;
  avgCarry: number;
  avgLaunchAngle: number;
  apexHeight?: number;
  color: string;
}

interface Props {
  clubs: TrajectoryClub[];
  height?: number;
}

// Compute trajectory height at a given fraction t (0–1) of carry distance
function trajectoryHeight(t: number, apexFt: number): number {
  // Skew peak forward to ~55% of distance for realism
  const skew = 0.55;
  let height: number;
  if (t <= skew) {
    const tAdj = t / skew;
    height = apexFt * (1 - (1 - tAdj) * (1 - tAdj));
  } else {
    const tDown = (t - skew) / (1 - skew);
    height = apexFt * (1 - tDown * tDown);
  }
  return Math.max(0, height);
}

function estimateApex(carryYards: number, launchDeg: number, apexFt?: number): number {
  if (apexFt) return apexFt;
  const launchRad = (launchDeg * Math.PI) / 180;
  return carryYards * Math.sin(launchRad) * 0.35 * 3;
}

const CLUB_COLORS = [
  "#06b6d4", // cyan (driver)
  "#f59e0b", // amber
  "#a855f7", // purple
  "#6366f1", // indigo
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // orange
  "#84cc16", // lime
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // emerald
  "#e11d48", // rose
];

export function TrajectoryChart({ clubs, height = 300 }: Props) {
  const { mergedData, maxDistance, maxHeight } = useMemo(() => {
    if (clubs.length === 0) return { mergedData: [], maxDistance: 300, maxHeight: 140 };

    // Shared distance grid — every 2 yards from 0 to the longest club
    const maxCarry = Math.max(...clubs.map((c) => c.avgCarry));
    const step = 2;
    const numPoints = Math.ceil(maxCarry / step) + 1;

    // Pre-compute apex for each club
    const apexes = clubs.map((c) => estimateApex(c.avgCarry, c.avgLaunchAngle, c.apexHeight));

    let peakHeight = 0;
    const merged: Array<Record<string, number | undefined>> = [];

    for (let i = 0; i < numPoints; i++) {
      const d = i * step;
      const row: Record<string, number | undefined> = { distance: d };

      clubs.forEach((club, ci) => {
        if (d > club.avgCarry) {
          row[club.clubName] = undefined; // beyond this club's range
        } else {
          const t = d / club.avgCarry;
          const h = Math.round(trajectoryHeight(t, apexes[ci]) * 10) / 10;
          row[club.clubName] = h;
          if (h > peakHeight) peakHeight = h;
        }
      });

      merged.push(row);
    }

    const mDist = Math.ceil(maxCarry / 50) * 50;
    const mHeight = Math.ceil(peakHeight / 20) * 20;

    return { mergedData: merged, maxDistance: Math.max(mDist, 300), maxHeight: Math.max(mHeight, 100) };
  }, [clubs]);

  if (clubs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No trajectory data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={mergedData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          dataKey="distance"
          type="number"
          domain={[0, maxDistance]}
          tickCount={7}
          tick={{ fontSize: 11 }}
          label={{ value: "Distance (yds)", position: "bottom", offset: 2, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
        />
        <YAxis
          domain={[0, maxHeight]}
          tickCount={6}
          tick={{ fontSize: 11 }}
          label={{ value: "Height (ft)", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value, name) => [`${value} ft`, name]}
          labelFormatter={(label) => `${label} yds`}
        />
        {clubs.map((club) => (
          <Line
            key={club.clubName}
            type="monotone"
            dataKey={club.clubName}
            stroke={club.color}
            strokeWidth={2}
            dot={false}
            strokeOpacity={0.8}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export { CLUB_COLORS };

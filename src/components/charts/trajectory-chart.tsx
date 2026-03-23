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

// Generate a parabolic trajectory from launch angle, carry distance, and apex height
function generateTrajectory(
  carryYards: number,
  launchDeg: number,
  apexFt?: number
): Array<{ distance: number; height: number }> {
  const points: Array<{ distance: number; height: number }> = [];
  const n = 60;

  // Estimate apex height from launch angle if not provided
  // Rough model: apex ≈ carry * sin(launch) * 0.35 (in feet, carry in yards)
  const launchRad = (launchDeg * Math.PI) / 180;
  const estimatedApex = apexFt ?? carryYards * Math.sin(launchRad) * 0.35 * 3; // convert to feet

  for (let i = 0; i <= n; i++) {
    const t = i / n; // 0 to 1
    const distance = t * carryYards;
    // Parabolic arc: h(t) = 4 * apex * t * (1 - t)
    // Slightly skew peak forward for realism: peak at ~55% of distance
    const skew = 0.55;
    const tAdj = t / skew;
    let height: number;
    if (t <= skew) {
      height = estimatedApex * (1 - (1 - tAdj) * (1 - tAdj));
    } else {
      const tDown = (t - skew) / (1 - skew);
      height = estimatedApex * (1 - tDown * tDown);
    }
    height = Math.max(0, height);
    points.push({ distance: Math.round(distance), height: Math.round(height * 10) / 10 });
  }

  return points;
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

    // Generate trajectories for each club
    const trajectories = clubs.map((club) =>
      generateTrajectory(club.avgCarry, club.avgLaunchAngle, club.apexHeight)
    );

    // Merge all trajectories into one array keyed by distance
    const distanceSet = new Set<number>();
    for (const traj of trajectories) {
      for (const pt of traj) distanceSet.add(pt.distance);
    }

    const distances = Array.from(distanceSet).sort((a, b) => a - b);
    const merged = distances.map((d) => {
      const row: Record<string, number> = { distance: d };
      clubs.forEach((club, i) => {
        const traj = trajectories[i];
        const pt = traj.find((p) => p.distance === d);
        if (pt) row[club.clubName] = pt.height;
      });
      return row;
    });

    const mDist = Math.max(...clubs.map((c) => c.avgCarry), 300);
    const mHeight = Math.max(
      ...trajectories.flatMap((t) => t.map((p) => p.height)),
      100
    );

    return { mergedData: merged, maxDistance: Math.ceil(mDist / 50) * 50, maxHeight: Math.ceil(mHeight / 20) * 20 };
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
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export { CLUB_COLORS };

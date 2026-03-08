"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { DispersionPoint } from "@/types/analytics";

interface Props {
  data: DispersionPoint[];
  title?: string;
  height?: number;
}

export function DispersionChart({ data, title = "Shot Dispersion", height = 400 }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No dispersion data available
      </div>
    );
  }

  const maxOffline = Math.max(30, ...data.map((d) => Math.abs(d.x)));

  return (
    <div>
      {title && <h3 className="text-sm font-medium mb-2 text-muted-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            type="number"
            dataKey="x"
            name="Offline"
            unit=" yds"
            domain={[-maxOffline, maxOffline]}
            label={{ value: "← Left    Offline (yards)    Right →", position: "bottom", offset: 0, style: { fontSize: 11 } }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Carry"
            unit=" yds"
            label={{ value: "Carry (yards)", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
          />
          <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as DispersionPoint;
              return (
                <div className="bg-popover border rounded-lg p-2 text-xs shadow-lg">
                  <p className="font-medium">{d.clubName ?? "Unknown Club"}</p>
                  <p>Carry: {d.y} yds</p>
                  <p>Offline: {d.x > 0 ? `${d.x} R` : `${Math.abs(d.x)} L`}</p>
                  {d.ballSpeed && <p>Ball Speed: {d.ballSpeed} mph</p>}
                </div>
              );
            }}
          />
          <Scatter
            data={data}
            fill="hsl(var(--primary))"
            fillOpacity={0.7}
            r={5}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

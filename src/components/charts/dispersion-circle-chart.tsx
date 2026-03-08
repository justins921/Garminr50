"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";

interface Props {
  carries: number[];
  offlines: number[];
  avgCarry: number;
  avgOffline: number;
  dispersionRadius: number;
  dispersionAngle: number;
  clubName: string;
  height?: number;
}

export function DispersionCircleChart({
  carries,
  offlines,
  avgCarry,
  avgOffline,
  dispersionRadius,
  dispersionAngle,
  clubName,
  height = 400,
}: Props) {
  const data = carries.map((carry, i) => ({
    x: offlines[i] ?? 0,
    y: carry,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        No shot data available
      </div>
    );
  }

  // Compute bounds with padding for the dispersion ellipse
  const pad = Math.max(dispersionRadius * 1.5, 15);
  const xMin = Math.min(avgOffline - pad, ...data.map((d) => d.x - 5));
  const xMax = Math.max(avgOffline + pad, ...data.map((d) => d.x + 5));
  const yMin = Math.min(avgCarry - pad, ...data.map((d) => d.y - 5));
  const yMax = Math.max(avgCarry + pad, ...data.map((d) => d.y + 5));

  // Dispersion ellipse bounds (used for ReferenceArea visualization)
  const xRadius = dispersionRadius * 0.7; // lateral is typically tighter than depth
  const yRadius = dispersionRadius;

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary/70 inline-block" />
          Shots
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-emerald-500/60 inline-block" />
          Dispersion zone: {dispersionRadius} yd radius
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-500 inline-block rotate-45" />
          Avg: {avgCarry} yds carry, {avgOffline > 0 ? `${avgOffline} R` : avgOffline < 0 ? `${Math.abs(avgOffline)} L` : "center"}
        </span>
        <span>Arc: {dispersionAngle}°</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[xMin, xMax]}
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${Math.round(v)}`}
            label={{ value: "← Left    Offline (yards)    Right →", position: "bottom", offset: 10, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[yMin, yMax]}
            label={{ value: "Carry (yards)", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
          />

          {/* Target line */}
          <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" opacity={0.4} />

          {/* Dispersion zone as a shaded ellipse-approximation rectangle */}
          <ReferenceArea
            x1={avgOffline - xRadius}
            x2={avgOffline + xRadius}
            y1={avgCarry - yRadius}
            y2={avgCarry + yRadius}
            fill="hsl(142, 76%, 45%)"
            fillOpacity={0.08}
            stroke="hsl(142, 76%, 45%)"
            strokeOpacity={0.35}
            strokeDasharray="6 3"
          />

          {/* Average crosshair lines */}
          <ReferenceLine x={avgOffline} stroke="hsl(142, 76%, 45%)" strokeDasharray="3 3" opacity={0.5} />
          <ReferenceLine y={avgCarry} stroke="hsl(142, 76%, 45%)" strokeDasharray="3 3" opacity={0.5} />

          {/* Shot points */}
          <Scatter
            data={data}
            fill="hsl(var(--primary))"
            fillOpacity={0.8}
            r={6}
          />

          {/* Average center marker */}
          <Scatter
            data={[{ x: avgOffline, y: avgCarry }]}
            fill="hsl(142, 76%, 45%)"
            r={8}
            shape="diamond"
            legendType="none"
          />

          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as { x: number; y: number };
              const dist = Math.sqrt((d.x - avgOffline) ** 2 + (d.y - avgCarry) ** 2);
              return (
                <div className="bg-popover border rounded-lg p-2 text-xs shadow-lg">
                  <p className="font-medium">{clubName}</p>
                  <p>Carry: {Math.round(d.y)} yds</p>
                  <p>Offline: {d.x > 0 ? `${d.x.toFixed(1)} R` : `${Math.abs(d.x).toFixed(1)} L`}</p>
                  <p className="text-muted-foreground">{dist.toFixed(1)} yds from avg</p>
                </div>
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useEffect, useRef } from "react";

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

  const maxOffline = Math.max(30, ...data.map((d) => Math.abs(d.x)));
  const minCarry = data.length > 0 ? Math.min(...data.map((d) => d.y)) - 10 : 0;
  const maxCarry = data.length > 0 ? Math.max(...data.map((d) => d.y)) + 10 : 100;

  // SVG overlay for dispersion circle and arc
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        No shot data available
      </div>
    );
  }

  // Generate circle points for the dispersion ellipse
  const circlePoints: Array<{ x: number; y: number }> = [];
  const xRadius = dispersionRadius * 0.8; // lateral spread
  const yRadius = dispersionRadius; // depth spread
  for (let angle = 0; angle <= 360; angle += 5) {
    const rad = (angle * Math.PI) / 180;
    circlePoints.push({
      x: avgOffline + xRadius * Math.cos(rad),
      y: avgCarry + yRadius * Math.sin(rad),
    });
  }

  // Generate arc lines from origin showing dispersion angle
  const halfAngle = (dispersionAngle / 2) * (Math.PI / 180);
  const arcLength = avgCarry * 1.1;
  const arcLeft = { x: -Math.sin(halfAngle) * arcLength, y: Math.cos(halfAngle) * arcLength };
  const arcRight = { x: Math.sin(halfAngle) * arcLength, y: Math.cos(halfAngle) * arcLength };

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border-2 border-emerald-500 inline-block" />
          Dispersion Circle: {dispersionRadius} yd radius
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-amber-500 inline-block" />
          Arc: {dispersionAngle}°
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[-maxOffline, maxOffline]}
            label={{ value: "← Left    Offline (yards)    Right →", position: "bottom", offset: 10, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[minCarry, maxCarry]}
            label={{ value: "Carry (yards)", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
          />
          <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" opacity={0.5} />

          {/* Dispersion circle/ellipse */}
          <Scatter
            data={circlePoints}
            fill="none"
            stroke="hsl(142, 76%, 45%)"
            strokeWidth={2}
            strokeDasharray="4 2"
            line
            legendType="none"
            r={0}
          />

          {/* Arc lines */}
          <Scatter
            data={[{ x: 0, y: 0 }, arcLeft]}
            fill="none"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            line
            legendType="none"
            r={0}
          />
          <Scatter
            data={[{ x: 0, y: 0 }, arcRight]}
            fill="none"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            line
            legendType="none"
            r={0}
          />

          {/* Center point */}
          <Scatter
            data={[{ x: avgOffline, y: avgCarry }]}
            fill="hsl(142, 76%, 45%)"
            r={6}
            shape="cross"
          />

          {/* Shot points */}
          <Scatter
            data={data}
            fill="hsl(var(--primary))"
            fillOpacity={0.7}
            r={5}
          />

          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as { x: number; y: number };
              return (
                <div className="bg-popover border rounded-lg p-2 text-xs shadow-lg">
                  <p className="font-medium">{clubName}</p>
                  <p>Carry: {Math.round(d.y)} yds</p>
                  <p>Offline: {d.x > 0 ? `${d.x.toFixed(1)} R` : `${Math.abs(d.x).toFixed(1)} L`}</p>
                </div>
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { useState, useMemo, useCallback } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface DispersionPoint {
  x: number;
  y: number;
  clubName?: string;
  ballSpeed?: number;
  totalDistance?: number;
}

interface Props {
  data: DispersionPoint[];
  title?: string;
  height?: number;
}

// Distinct colors that work on dark & light backgrounds
const CLUB_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
  "#6366f1", // indigo
  "#84cc16", // lime
  "#e11d48", // rose
];

// Standard club order (longest to shortest)
const CLUB_ORDER = [
  "Driver", "3 Wood", "5 Wood", "4 Hybrid", "5 Hybrid",
  "3 Iron", "4 Iron", "5 Iron", "6 Iron", "7 Iron", "8 Iron", "9 Iron",
  "Pitching Wedge", "Gap Wedge", "Sand Wedge", "Lob Wedge",
];

function clubSortKey(name: string, avgCarry: number): number {
  const idx = CLUB_ORDER.indexOf(name);
  // Known clubs get their canonical order; unknown clubs sort by carry distance
  return idx >= 0 ? idx : 100 + (999 - avgCarry);
}

export function DispersionChart({ data, title = "Shot Dispersion", height = 400 }: Props) {
  const [mode, setMode] = useState<"carry" | "total">("carry");
  const [hiddenClubs, setHiddenClubs] = useState<Set<string>>(new Set());

  const { clubNames, colorMap, groupedData } = useMemo(() => {
    // Group shots by club and compute avg carry for sorting
    const groups = new Map<string, { shots: DispersionPoint[]; avgCarry: number }>();
    for (const d of data) {
      const name = d.clubName ?? "Unknown";
      const group = groups.get(name) ?? { shots: [], avgCarry: 0 };
      group.shots.push(d);
      groups.set(name, group);
    }
    for (const [, group] of groups) {
      group.avgCarry = group.shots.reduce((s, d) => s + d.y, 0) / group.shots.length;
    }

    // Sort by standard club order (longest to shortest)
    const names = Array.from(groups.keys()).sort(
      (a, b) => clubSortKey(a, groups.get(a)!.avgCarry) - clubSortKey(b, groups.get(b)!.avgCarry)
    );

    const cMap = new Map<string, string>();
    names.forEach((name, i) => cMap.set(name, CLUB_COLORS[i % CLUB_COLORS.length]));

    // Build display data with mode applied
    const grouped = new Map<string, DispersionPoint[]>();
    for (const name of names) {
      grouped.set(name, groups.get(name)!.shots.map((d) => ({
        ...d,
        y: mode === "total" && d.totalDistance != null ? d.totalDistance : d.y,
      })));
    }

    return { clubNames: names, colorMap: cMap, groupedData: grouped };
  }, [data, mode]);

  const toggleClub = useCallback((name: string) => {
    setHiddenClubs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const showAll = useCallback(() => setHiddenClubs(new Set()), []);
  const hideAll = useCallback(() => setHiddenClubs(new Set(clubNames)), [clubNames]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No dispersion data available
      </div>
    );
  }

  const visibleData = data.filter((d) => !hiddenClubs.has(d.clubName ?? "Unknown"));
  const maxOffline = Math.max(30, ...visibleData.map((d) => Math.abs(d.x)));
  const hasTotalData = data.some((d) => d.totalDistance != null);
  const yLabel = mode === "carry" ? "Carry (yards)" : "Total (yards)";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        {title && <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>}
        {hasTotalData && (
          <div className="inline-flex rounded-md border text-xs">
            <button
              onClick={() => setMode("carry")}
              className={`px-2.5 py-1 rounded-l-md transition-colors ${
                mode === "carry" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              Carry
            </button>
            <button
              onClick={() => setMode("total")}
              className={`px-2.5 py-1 rounded-r-md transition-colors ${
                mode === "total" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              Total
            </button>
          </div>
        )}
      </div>

      {/* Clickable club legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
        {clubNames.map((name) => {
          const isHidden = hiddenClubs.has(name);
          return (
            <button
              key={name}
              onClick={() => toggleClub(name)}
              className={`inline-flex items-center gap-1.5 text-xs py-0.5 transition-opacity ${
                isHidden ? "opacity-35" : "opacity-100"
              } hover:opacity-80`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: colorMap.get(name) }}
              />
              <span className={isHidden ? "line-through" : ""}>{name}</span>
            </button>
          );
        })}
        {clubNames.length > 3 && (
          <span className="text-xs text-muted-foreground ml-1">
            <button onClick={showAll} className="hover:underline">All</button>
            {" / "}
            <button onClick={hideAll} className="hover:underline">None</button>
          </span>
        )}
      </div>

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
            name={mode === "carry" ? "Carry" : "Total"}
            unit=" yds"
            label={{ value: yLabel, angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
          />
          <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as DispersionPoint;
              return (
                <div className="bg-popover border rounded-lg p-2 text-xs shadow-lg">
                  <p className="font-medium">{d.clubName ?? "Unknown Club"}</p>
                  <p>{mode === "carry" ? "Carry" : "Total"}: {d.y} yds</p>
                  <p>Offline: {d.x > 0 ? `${d.x} R` : `${Math.abs(d.x)} L`}</p>
                  {d.ballSpeed && <p>Ball Speed: {d.ballSpeed} mph</p>}
                </div>
              );
            }}
          />
          {clubNames
            .filter((name) => !hiddenClubs.has(name))
            .map((name) => (
              <Scatter
                key={name}
                name={name}
                data={groupedData.get(name) ?? []}
                fill={colorMap.get(name)}
                fillOpacity={0.75}
                r={5}
                legendType="none"
              />
            ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

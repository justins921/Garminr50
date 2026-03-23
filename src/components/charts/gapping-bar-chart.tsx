"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts";

interface GappingClub {
  clubName: string;
  avgTotal: number;
  avgCarry: number;
  color: string;
  gapToNext?: number;
}

interface Props {
  clubs: GappingClub[];
  height?: number;
  mode: "gapping" | "dispersion";
}

export function GappingBarChart({ clubs, height = 400, mode }: Props) {
  const chartData = useMemo(() => {
    return clubs.map((club) => ({
      ...club,
      value: mode === "gapping" ? club.avgTotal : club.avgCarry,
    }));
  }, [clubs, mode]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const maxVal = Math.max(...chartData.map((d) => d.value), 100);
  const domainMax = Math.ceil(maxVal / 50) * 50 + 25;

  return (
    <div className="flex">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 50, bottom: 5, left: 10 }}
            barSize={20}
            barGap={2}
          >
            <XAxis
              type="number"
              domain={[0, domainMax]}
              tickCount={7}
              tick={{ fontSize: 11 }}
              label={{ value: "Total Distance (yds)", position: "bottom", offset: 0, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
            />
            <YAxis
              type="category"
              dataKey="clubName"
              tick={{ fontSize: 12, fontWeight: 500 }}
              width={80}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} fillOpacity={0.85} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gap labels on the right side */}
      {mode === "gapping" && (
        <div className="w-16 flex flex-col justify-start pt-[5px] pr-1" style={{ height }}>
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-right mb-1">
            Gap
          </div>
          {chartData.map((club, idx) => (
            <div
              key={club.clubName}
              className="flex items-center justify-end"
              style={{ height: height / (chartData.length + 1) }}
            >
              {club.gapToNext != null && (
                <div className="flex items-center gap-0.5">
                  <div className="w-px h-6 bg-border" />
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      club.gapToNext <= 5
                        ? "text-amber-400"
                        : club.gapToNext >= 20
                        ? "text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {club.gapToNext} yds
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

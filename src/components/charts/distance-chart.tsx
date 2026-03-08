"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ErrorBar } from "recharts";

interface ClubDistance {
  clubName: string;
  avgCarry: number;
  avgTotal: number;
  stdDevCarry?: number;
  minCarry?: number;
  maxCarry?: number;
}

interface Props {
  data: ClubDistance[];
  title?: string;
  height?: number;
  showTotal?: boolean;
}

const COLORS = [
  "hsl(200, 80%, 55%)",
  "hsl(160, 70%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(260, 70%, 60%)",
  "hsl(180, 60%, 50%)",
  "hsl(45, 80%, 50%)",
  "hsl(120, 50%, 45%)",
  "hsl(300, 60%, 55%)",
  "hsl(15, 80%, 55%)",
  "hsl(220, 70%, 55%)",
  "hsl(80, 60%, 50%)",
  "hsl(350, 65%, 50%)",
];

export function DistanceChart({ data, title = "Club Distances", height = 350, showTotal = true }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No distance data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    error: d.stdDevCarry ? [d.stdDevCarry, d.stdDevCarry] : undefined,
  }));

  return (
    <div>
      {title && <h3 className="text-sm font-medium mb-2 text-muted-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 40, left: 20 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="clubName"
            angle={-35}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 11 }}
            height={60}
          />
          <YAxis
            label={{ value: "Distance (yards)", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
          />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as ClubDistance;
              return (
                <div className="bg-popover border rounded-lg p-2 text-xs shadow-lg">
                  <p className="font-medium">{label}</p>
                  <p>Avg Carry: {d.avgCarry} yds</p>
                  {d.avgTotal > 0 && <p>Avg Total: {d.avgTotal} yds</p>}
                  {d.stdDevCarry && <p>Std Dev: ±{d.stdDevCarry} yds</p>}
                  {d.minCarry != null && d.maxCarry != null && (
                    <p>Range: {d.minCarry} - {d.maxCarry} yds</p>
                  )}
                </div>
              );
            }}
          />
          <Bar dataKey="avgCarry" name="Carry" radius={[4, 4, 0, 0]}>
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
            {chartData[0]?.error && <ErrorBar dataKey="error" width={4} strokeWidth={1.5} />}
          </Bar>
          {showTotal && (
            <Bar dataKey="avgTotal" name="Total" radius={[4, 4, 0, 0]} fillOpacity={0.3}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

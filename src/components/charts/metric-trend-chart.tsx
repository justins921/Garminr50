"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrendPoint {
  label: string;
  value: number;
  value2?: number;
}

interface Props {
  data: TrendPoint[];
  title?: string;
  height?: number;
  unit?: string;
  color?: string;
  showSecondLine?: boolean;
  label2?: string;
}

export function MetricTrendChart({
  data,
  title,
  height = 250,
  unit = "",
  color = "hsl(var(--primary))",
  showSecondLine = false,
  label2,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No trend data available
      </div>
    );
  }

  return (
    <div>
      {title && <h3 className="text-sm font-medium mb-2 text-muted-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            domain={["auto", "auto"]}
            label={unit ? { value: unit, angle: -90, position: "insideLeft", style: { fontSize: 10 } } : undefined}
          />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload?.length) return null;
              return (
                <div className="bg-popover border rounded-lg p-2 text-xs shadow-lg">
                  <p className="font-medium">{label}</p>
                  {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }}>
                      {p.name}: {p.value} {unit}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            name={title ?? "Value"}
          />
          {showSecondLine && (
            <Line
              type="monotone"
              dataKey="value2"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={{ r: 2 }}
              name={label2 ?? "Comparison"}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

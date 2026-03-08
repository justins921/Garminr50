"use client";

import { ScoreLevel } from "@/analytics/optimizer";

interface MetricBarProps {
  name: string;
  value: number;
  unit: string;
  optimalRange: [number, number];
  score: ScoreLevel;
  suggestion: string;
}

const SCORE_COLORS: Record<ScoreLevel, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

const SCORE_TEXT_COLORS: Record<ScoreLevel, string> = {
  green: "text-emerald-500",
  yellow: "text-amber-500",
  red: "text-red-500",
};

export function MetricBar({ name, value, unit, optimalRange, score, suggestion }: MetricBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{name}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold tabular-nums ${SCORE_TEXT_COLORS[score]}`}>
            {value}{unit}
          </span>
          <span className={`w-2.5 h-2.5 rounded-full ${SCORE_COLORS[score]}`} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
          {/* Optimal zone indicator */}
          <div
            className="absolute h-full bg-emerald-500/20 rounded-full"
            style={{
              left: `${Math.max(0, (optimalRange[0] / (optimalRange[1] * 1.5)) * 100)}%`,
              width: `${Math.min(100, ((optimalRange[1] - optimalRange[0]) / (optimalRange[1] * 1.5)) * 100)}%`,
            }}
          />
          {/* Value indicator */}
          <div
            className={`absolute h-full w-1 rounded-full ${SCORE_COLORS[score]}`}
            style={{
              left: `${Math.min(95, Math.max(2, (value / (optimalRange[1] * 1.5)) * 100))}%`,
            }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{suggestion}</p>
    </div>
  );
}

interface OverallGaugeProps {
  score: number;
  grade: string;
}

export function OverallGauge({ score, grade }: OverallGaugeProps) {
  const color =
    score >= 80 ? "text-emerald-500" :
    score >= 60 ? "text-amber-500" :
    "text-red-500";

  const bgColor =
    score >= 80 ? "from-emerald-500/20 to-emerald-500/5" :
    score >= 60 ? "from-amber-500/20 to-amber-500/5" :
    "from-red-500/20 to-red-500/5";

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-b ${bgColor}`}>
      <span className={`text-5xl font-bold ${color}`}>{grade}</span>
      <span className="text-sm text-muted-foreground mt-1">Shot Score</span>
      <div className="w-full max-w-32 h-2 bg-muted rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground mt-1">{score}/100</span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { MetricBar, OverallGauge } from "@/components/charts/optimizer-gauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, TrendingUp, AlertTriangle, CheckCircle2, Target, Lightbulb, Dumbbell } from "lucide-react";
import { ShotOptimizerResult, DrillRecommendation } from "@/analytics/optimizer";

interface ClubItem {
  id: string;
  name: string;
  type: string;
  _count: { shots: number };
}

interface SessionItem {
  id: string;
  name: string;
  startedAt: string;
  _count: { shots: number };
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-red-500/30 bg-red-500/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  low: "border-muted",
};

const CATEGORY_ICONS: Record<string, typeof Target> = {
  accuracy: Target,
  contact: Zap,
  consistency: TrendingUp,
  distance: Dumbbell,
};

export default function OptimizerPage() {
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");

  const { data: clubs } = useFetch<ClubItem[]>("/api/clubs");
  const { data: sessions } = useFetch<SessionItem[]>("/api/sessions");

  const queryParams = new URLSearchParams();
  if (selectedClub) queryParams.set("clubId", selectedClub);
  if (selectedSession) queryParams.set("sessionId", selectedSession);
  const queryString = queryParams.toString();

  const { data: result, loading } = useFetch<ShotOptimizerResult>(
    queryString ? `/api/optimizer?${queryString}` : `/api/optimizer`,
    [selectedClub, selectedSession]
  );

  const clubsWithShots = (clubs ?? []).filter((c) => c._count.shots > 0);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Shot Optimizer
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Analyze your shots, identify weaknesses, and get drill recommendations
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-full sm:w-auto sm:min-w-48">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Club</label>
              <Select value={selectedClub} onValueChange={(v) => setSelectedClub(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All clubs" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All clubs</SelectItem>
                  {clubsWithShots.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c._count.shots} shots)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto sm:min-w-56">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Session</label>
              <Select value={selectedSession} onValueChange={(v) => setSelectedSession(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All sessions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sessions</SelectItem>
                  {(sessions ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s._count.shots} shots)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : !result || result.overallGrade === "N/A" ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Not enough shot data for analysis</p>
            <p className="text-sm text-muted-foreground mt-1">
              Hit at least 3 valid shots to get your shot score and recommendations
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score + Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OverallGauge score={result.overallScore} grade={result.overallGrade} />

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Metric Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.metrics.map((m) => (
                  <MetricBar key={m.name} {...m} />
                ))}
                {result.metrics.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No metric data available for analysis.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.strengths.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.weaknesses.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Insights */}
          {result.insights.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.insights.map((insight, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">-</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Drill Recommendations */}
          {result.drills.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Recommended Drills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.drills.map((drill, i) => {
                    const Icon = CATEGORY_ICONS[drill.category] ?? Target;
                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-lg border ${PRIORITY_COLORS[drill.priority]}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-medium text-sm">{drill.name}</h4>
                                <Badge
                                  variant={drill.priority === "high" ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {drill.priority}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {drill.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {drill.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                Targets: {drill.targetIssue}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

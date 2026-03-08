import { ClubStats } from "@/types/analytics";
import { avg, stdDev } from "./stats";

// Optimal ranges for key metrics by club type
const OPTIMAL_RANGES: Record<string, {
  smashFactor: [number, number];
  launchAngle: [number, number];
  spinRate: [number, number];
  attackAngle: [number, number];
}> = {
  driver: {
    smashFactor: [1.44, 1.52],
    launchAngle: [10, 14],
    spinRate: [2000, 2800],
    attackAngle: [0, 5],
  },
  wood: {
    smashFactor: [1.38, 1.48],
    launchAngle: [12, 16],
    spinRate: [3000, 4500],
    attackAngle: [-2, 2],
  },
  hybrid: {
    smashFactor: [1.34, 1.44],
    launchAngle: [14, 19],
    spinRate: [4000, 5500],
    attackAngle: [-3, 0],
  },
  iron: {
    smashFactor: [1.30, 1.40],
    launchAngle: [15, 23],
    spinRate: [5000, 7500],
    attackAngle: [-5, -1],
  },
  wedge: {
    smashFactor: [1.20, 1.35],
    launchAngle: [24, 36],
    spinRate: [7500, 11000],
    attackAngle: [-6, -2],
  },
};

export type ScoreLevel = "green" | "yellow" | "red";

export interface MetricScore {
  name: string;
  value: number;
  unit: string;
  optimalRange: [number, number];
  score: ScoreLevel;
  suggestion: string;
}

export interface ShotOptimizerResult {
  overallScore: number; // 0-100
  overallGrade: string; // A+ through F
  metrics: MetricScore[];
  strengths: string[];
  weaknesses: string[];
  drills: DrillRecommendation[];
  insights: string[];
}

export interface DrillRecommendation {
  name: string;
  category: string; // distance, accuracy, consistency, contact
  description: string;
  targetIssue: string;
  priority: "high" | "medium" | "low";
}

function scoreMetric(value: number, optimal: [number, number]): ScoreLevel {
  if (value >= optimal[0] && value <= optimal[1]) return "green";
  const range = optimal[1] - optimal[0];
  const margin = range * 0.3;
  if (value >= optimal[0] - margin && value <= optimal[1] + margin) return "yellow";
  return "red";
}

function metricSuggestion(name: string, value: number, optimal: [number, number]): string {
  if (value < optimal[0]) {
    return `${name} is below optimal (${optimal[0]}–${optimal[1]}). Work on increasing it.`;
  }
  if (value > optimal[1]) {
    return `${name} is above optimal (${optimal[0]}–${optimal[1]}). Work on reducing it.`;
  }
  return `${name} is in the optimal range.`;
}

interface ShotData {
  ballSpeed?: number | null;
  clubSpeed?: number | null;
  launchAngle?: number | null;
  spinRate?: number | null;
  smashFactor?: number | null;
  carryDistance?: number | null;
  totalDistance?: number | null;
  offlineDistance?: number | null;
  angleOfAttack?: number | null;
  clubPath?: number | null;
  faceAngle?: number | null;
  faceToPath?: number | null;
  shotShape?: string | null;
  shotResult?: string | null;
  validity: string;
}

export function analyzeShots(shots: ShotData[], clubType: string): ShotOptimizerResult {
  const valid = shots.filter((s) => s.validity === "valid");
  if (valid.length < 3) {
    return {
      overallScore: 0,
      overallGrade: "N/A",
      metrics: [],
      strengths: [],
      weaknesses: ["Not enough valid shots for analysis (need at least 3)"],
      drills: [],
      insights: ["Hit more shots to get a meaningful analysis."],
    };
  }

  const optimal = OPTIMAL_RANGES[clubType] ?? OPTIMAL_RANGES.iron;

  // Gather values
  const smashes = valid.map((s) => s.smashFactor).filter((v): v is number => v != null);
  const launches = valid.map((s) => s.launchAngle).filter((v): v is number => v != null);
  const spins = valid.map((s) => s.spinRate).filter((v): v is number => v != null);
  const attacks = valid.map((s) => s.angleOfAttack).filter((v): v is number => v != null);
  const carries = valid.map((s) => s.carryDistance).filter((v): v is number => v != null);
  const offlines = valid.map((s) => s.offlineDistance).filter((v): v is number => v != null);
  const paths = valid.map((s) => s.clubPath).filter((v): v is number => v != null);
  const faces = valid.map((s) => s.faceAngle).filter((v): v is number => v != null);
  const faceToPath = valid.map((s) => s.faceToPath).filter((v): v is number => v != null);

  // Score each metric
  const metrics: MetricScore[] = [];

  if (smashes.length > 0) {
    const v = avg(smashes);
    metrics.push({
      name: "Smash Factor",
      value: Math.round(v * 100) / 100,
      unit: "",
      optimalRange: optimal.smashFactor,
      score: scoreMetric(v, optimal.smashFactor),
      suggestion: metricSuggestion("Smash factor", v, optimal.smashFactor),
    });
  }

  if (launches.length > 0) {
    const v = avg(launches);
    metrics.push({
      name: "Launch Angle",
      value: Math.round(v * 10) / 10,
      unit: "°",
      optimalRange: optimal.launchAngle,
      score: scoreMetric(v, optimal.launchAngle),
      suggestion: metricSuggestion("Launch angle", v, optimal.launchAngle),
    });
  }

  if (spins.length > 0) {
    const v = avg(spins);
    metrics.push({
      name: "Spin Rate",
      value: Math.round(v),
      unit: "rpm",
      optimalRange: optimal.spinRate,
      score: scoreMetric(v, optimal.spinRate),
      suggestion: metricSuggestion("Spin rate", v, optimal.spinRate),
    });
  }

  if (attacks.length > 0) {
    const v = avg(attacks);
    metrics.push({
      name: "Angle of Attack",
      value: Math.round(v * 10) / 10,
      unit: "°",
      optimalRange: optimal.attackAngle,
      score: scoreMetric(v, optimal.attackAngle),
      suggestion: metricSuggestion("Angle of attack", v, optimal.attackAngle),
    });
  }

  // Consistency metrics
  if (carries.length >= 3) {
    const cv = stdDev(carries) / avg(carries);
    const consistencyScore = scoreMetric(cv * 100, [0, 8]); // < 8% CV is good
    metrics.push({
      name: "Distance Consistency",
      value: Math.round((1 - Math.min(cv, 0.2)) * 100),
      unit: "%",
      optimalRange: [92, 100],
      score: consistencyScore,
      suggestion: cv > 0.08
        ? "Your distance spread is too wide. Focus on consistent contact."
        : "Good distance consistency.",
    });
  }

  if (offlines.length >= 3) {
    const avgOff = Math.abs(avg(offlines));
    const dirScore = scoreMetric(avgOff, [0, 8]);
    metrics.push({
      name: "Directional Accuracy",
      value: Math.round(avgOff * 10) / 10,
      unit: "yds offline",
      optimalRange: [0, 8],
      score: dirScore,
      suggestion: avgOff > 8
        ? `You tend to miss ${avg(offlines) < 0 ? "left" : "right"} by ${Math.round(avgOff)} yards. Work on face angle at impact.`
        : "Good directional control.",
    });
  }

  // Calculate overall score
  const greenCount = metrics.filter((m) => m.score === "green").length;
  const yellowCount = metrics.filter((m) => m.score === "yellow").length;
  const totalMetrics = metrics.length || 1;
  const overallScore = Math.round(((greenCount * 100 + yellowCount * 60) / totalMetrics));

  const overallGrade =
    overallScore >= 90 ? "A+" :
    overallScore >= 80 ? "A" :
    overallScore >= 70 ? "B+" :
    overallScore >= 60 ? "B" :
    overallScore >= 50 ? "C+" :
    overallScore >= 40 ? "C" :
    overallScore >= 30 ? "D" : "F";

  // Identify strengths and weaknesses
  const strengths = metrics.filter((m) => m.score === "green").map((m) => m.name);
  const weaknesses = metrics.filter((m) => m.score === "red").map((m) => m.suggestion);

  // Generate drill recommendations
  const drills = generateDrills(valid, metrics, clubType, offlines, paths, faces, carries);

  // Generate insights
  const insights = generateInsights(valid, carries, offlines, spins, smashes, clubType);

  return {
    overallScore,
    overallGrade,
    metrics,
    strengths,
    weaknesses,
    drills,
    insights,
  };
}

function generateDrills(
  shots: ShotData[],
  metrics: MetricScore[],
  clubType: string,
  offlines: number[],
  paths: number[],
  faces: number[],
  carries: number[]
): DrillRecommendation[] {
  const drills: DrillRecommendation[] = [];

  // Check for slice/hook pattern
  const avgOffline = offlines.length > 0 ? avg(offlines) : 0;
  const avgPath = paths.length > 0 ? avg(paths) : 0;
  const avgFace = faces.length > 0 ? avg(faces) : 0;

  if (avgOffline > 10) {
    // Missing right (slice for RH)
    drills.push({
      name: "Headcover Gate Drill",
      category: "accuracy",
      description: "Place a headcover just outside the ball. Practice swinging without hitting it to train an inside-out path.",
      targetIssue: "Outside-in swing path causing right miss",
      priority: "high",
    });
    drills.push({
      name: "Step Drill",
      category: "accuracy",
      description: "Take your setup, then step your lead foot toward the target as you start your downswing. This promotes an inside-out path.",
      targetIssue: "Over-the-top move",
      priority: "high",
    });
  } else if (avgOffline < -10) {
    // Missing left (hook/pull for RH)
    drills.push({
      name: "Split Grip Drill",
      category: "accuracy",
      description: "Separate your hands on the grip by 2 inches. Make half swings focusing on keeping the clubface square through impact.",
      targetIssue: "Closed clubface at impact causing left miss",
      priority: "high",
    });
    drills.push({
      name: "Alignment Stick Drill",
      category: "accuracy",
      description: "Place an alignment stick on your target line. Practice swinging along the stick to straighten your path.",
      targetIssue: "Inside-out path with closed face",
      priority: "medium",
    });
  }

  // Check consistency
  if (carries.length >= 5) {
    const cv = stdDev(carries) / avg(carries);
    if (cv > 0.1) {
      drills.push({
        name: "Half Swing Impact Drill",
        category: "contact",
        description: "Make controlled half swings focusing only on solid contact. Place a tee 4 inches ahead of the ball — your divot should start at the tee.",
        targetIssue: "Inconsistent strike quality",
        priority: "high",
      });
      drills.push({
        name: "Feet Together Drill",
        category: "consistency",
        description: "Hit shots with your feet together. This removes lower body variables and helps you find a repeatable swing center.",
        targetIssue: "Inconsistent low point",
        priority: "medium",
      });
    }
  }

  // Check smash factor
  const smashMetric = metrics.find((m) => m.name === "Smash Factor");
  if (smashMetric?.score === "red" && smashMetric.value < (OPTIMAL_RANGES[clubType]?.smashFactor[0] ?? 1.3)) {
    drills.push({
      name: "Impact Tape Drill",
      category: "contact",
      description: "Apply impact tape or foot spray to your clubface. Hit 10 shots and check where contact is occurring. Center strikes maximize smash factor.",
      targetIssue: "Off-center contact reducing smash factor",
      priority: "high",
    });
    drills.push({
      name: "Tee Peg Contact Drill",
      category: "contact",
      description: "Place the ball on a low tee. Focus on sweeping the ball cleanly off the tee with irons to improve strike quality.",
      targetIssue: "Poor contact quality",
      priority: "medium",
    });
  }

  // Check spin
  const spinMetric = metrics.find((m) => m.name === "Spin Rate");
  if (spinMetric?.score === "red") {
    if (spinMetric.value > (OPTIMAL_RANGES[clubType]?.spinRate[1] ?? 7000)) {
      drills.push({
        name: "Forward Shaft Lean Drill",
        category: "distance",
        description: "At address, press your hands slightly ahead of the ball. Maintain this lean through impact. This de-lofts the club and reduces spin.",
        targetIssue: "Excessive spin reducing carry distance",
        priority: "medium",
      });
    }
  }

  // Check launch angle
  const launchMetric = metrics.find((m) => m.name === "Launch Angle");
  if (launchMetric?.score === "red") {
    if (clubType === "driver" && launchMetric.value < 10) {
      drills.push({
        name: "Tee Height Adjustment",
        category: "distance",
        description: "Tee the ball higher so half the ball is above the crown. This promotes hitting up on the ball for a higher launch with less spin.",
        targetIssue: "Launch angle too low for driver",
        priority: "medium",
      });
    }
  }

  // Always include a general drill if list is short
  if (drills.length < 2) {
    drills.push({
      name: "Progressive Power Drill",
      category: "consistency",
      description: "Hit 3 shots at 50% power, 3 at 75%, and 3 at 100%. Compare carry distances. Your best results often come at 85-90% effort.",
      targetIssue: "Finding optimal swing tempo",
      priority: "low",
    });
  }

  return drills;
}

function generateInsights(
  shots: ShotData[],
  carries: number[],
  offlines: number[],
  spins: number[],
  smashes: number[],
  clubType: string
): string[] {
  const insights: string[] = [];

  if (carries.length >= 5) {
    const sorted = [...carries].sort((a, b) => b - a);
    const best5 = avg(sorted.slice(0, 5));
    const overall = avg(carries);
    const gap = Math.round(best5 - overall);
    if (gap > 10) {
      insights.push(
        `Your best 5 shots average ${Math.round(best5)} yards vs your overall ${Math.round(overall)} yards — a ${gap}-yard gap. Consistency work will close this gap.`
      );
    }
  }

  if (offlines.length >= 5) {
    const leftMisses = offlines.filter((o) => o < -5).length;
    const rightMisses = offlines.filter((o) => o > 5).length;
    const total = offlines.length;
    if (leftMisses > total * 0.4) {
      insights.push(`${Math.round(leftMisses / total * 100)}% of your shots miss left. This is your primary miss pattern.`);
    } else if (rightMisses > total * 0.4) {
      insights.push(`${Math.round(rightMisses / total * 100)}% of your shots miss right. This is your primary miss pattern.`);
    }
  }

  // Mishit analysis
  const mishits = shots.filter((s) => s.shotResult && s.shotResult !== "good");
  if (mishits.length > 0 && shots.length > 0) {
    const mishitRate = Math.round(mishits.length / shots.length * 100);
    if (mishitRate > 20) {
      insights.push(`${mishitRate}% mishit rate. Focus on contact drills before working on distance or direction.`);
    }

    const resultCounts = new Map<string, number>();
    mishits.forEach((s) => {
      const r = s.shotResult ?? "unknown";
      resultCounts.set(r, (resultCounts.get(r) ?? 0) + 1);
    });
    const topMishit = [...resultCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topMishit && topMishit[1] >= 3) {
      insights.push(`Most common mishit: "${topMishit[0]}" (${topMishit[1]} times). Address this pattern first.`);
    }
  }

  if (smashes.length >= 5 && clubType === "driver") {
    const avgSmash = avg(smashes);
    if (avgSmash < 1.4) {
      insights.push(`Your driver smash factor (${avgSmash.toFixed(2)}) suggests off-center hits. Tour average is 1.48+.`);
    } else if (avgSmash >= 1.48) {
      insights.push(`Excellent driver smash factor (${avgSmash.toFixed(2)}). You're finding the center consistently.`);
    }
  }

  return insights;
}

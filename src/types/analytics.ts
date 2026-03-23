export interface ClubStats {
  clubId: string;
  clubName: string;
  clubType: string;
  shotCount: number;
  avgCarry: number;
  avgTotal: number;
  medianCarry: number;
  medianTotal: number;
  stdDevCarry: number;
  stdDevTotal: number;
  avgBallSpeed: number;
  avgClubSpeed: number;
  avgLaunchAngle: number;
  avgSpinRate: number;
  avgSmashFactor: number;
  avgOffline: number;
  dispersionWidth: number;  // yards, left-right spread
  dispersionDepth: number;  // yards, short-long spread
  consistencyScore: number; // 0-100
  bestCarry: number;
  best5Carry: number;
  best10Carry: number;
  missTendency: "left" | "right" | "straight";
  avgApexHeight: number; // feet
}

export interface SessionStats {
  sessionId: string;
  sessionName: string;
  shotCount: number;
  validShotCount: number;
  clubsUsed: string[];
  avgCarry: number;
  avgTotal: number;
  avgBallSpeed: number;
  avgClubSpeed: number;
  avgSpinRate: number;
  avgLaunchAngle: number;
  avgSmashFactor: number;
  avgOffline: number;
  duration: number; // minutes
}

export interface GappingData {
  clubs: Array<{
    clubName: string;
    avgCarry: number;
    avgTotal: number;
    minCarry: number;
    maxCarry: number;
    gapToNext?: number;
    overlapWithNext?: number;
  }>;
}

export interface TrendPoint {
  date: string;
  value: number;
  sessionId?: string;
}

export interface DispersionPoint {
  x: number; // offline distance (yards, left = negative)
  y: number; // carry distance (yards)
  clubName?: string;
  shotNumber?: number;
  validity?: string;
  ballSpeed?: number;
}

export interface ComparisonResult {
  label1: string;
  label2: string;
  metrics: Array<{
    name: string;
    value1: number;
    value2: number;
    unit: string;
    better: "higher" | "lower" | "closer_to_zero";
  }>;
}

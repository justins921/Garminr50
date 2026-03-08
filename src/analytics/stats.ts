import { ClubStats, DispersionPoint, GappingData, SessionStats } from "@/types/analytics";

interface ShotRow {
  id: string;
  clubId?: string | null;
  clubName?: string;
  clubType?: string;
  ballSpeed?: number | null;
  clubSpeed?: number | null;
  launchAngle?: number | null;
  spinRate?: number | null;
  smashFactor?: number | null;
  carryDistance?: number | null;
  totalDistance?: number | null;
  offlineDistance?: number | null;
  apexHeight?: number | null;
  validity: string;
  timestamp: string | Date;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map((v) => Math.pow(v - avg, 2));
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

export function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function topN(values: number[], n: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => b - a);
  const take = sorted.slice(0, Math.min(n, sorted.length));
  return avg(take);
}

// Consistency score: 100 = perfectly consistent, 0 = wildly inconsistent
// Based on coefficient of variation of carry distance
function consistencyScore(carries: number[]): number {
  if (carries.length < 3) return 0;
  const mean = avg(carries);
  if (mean === 0) return 0;
  const cv = stdDev(carries) / mean;
  // CV of 0 = 100 score, CV of 0.15+ = 0 score
  return Math.max(0, Math.min(100, Math.round((1 - cv / 0.15) * 100)));
}

export function computeClubStats(
  clubId: string,
  clubName: string,
  clubType: string,
  shots: ShotRow[]
): ClubStats {
  const valid = shots.filter((s) => s.validity === "valid");
  const carries = valid.map((s) => s.carryDistance).filter((v): v is number => v != null);
  const totals = valid.map((s) => s.totalDistance).filter((v): v is number => v != null);
  const offlines = valid.map((s) => s.offlineDistance).filter((v): v is number => v != null);
  const ballSpeeds = valid.map((s) => s.ballSpeed).filter((v): v is number => v != null);
  const clubSpeeds = valid.map((s) => s.clubSpeed).filter((v): v is number => v != null);
  const launchAngles = valid.map((s) => s.launchAngle).filter((v): v is number => v != null);
  const spinRates = valid.map((s) => s.spinRate).filter((v): v is number => v != null);
  const smashFactors = valid.map((s) => s.smashFactor).filter((v): v is number => v != null);

  const avgOffline = avg(offlines);

  return {
    clubId,
    clubName,
    clubType,
    shotCount: valid.length,
    avgCarry: Math.round(avg(carries) * 10) / 10,
    avgTotal: Math.round(avg(totals) * 10) / 10,
    medianCarry: Math.round(median(carries) * 10) / 10,
    medianTotal: Math.round(median(totals) * 10) / 10,
    stdDevCarry: Math.round(stdDev(carries) * 10) / 10,
    stdDevTotal: Math.round(stdDev(totals) * 10) / 10,
    avgBallSpeed: Math.round(avg(ballSpeeds) * 10) / 10,
    avgClubSpeed: Math.round(avg(clubSpeeds) * 10) / 10,
    avgLaunchAngle: Math.round(avg(launchAngles) * 10) / 10,
    avgSpinRate: Math.round(avg(spinRates)),
    avgSmashFactor: Math.round(avg(smashFactors) * 100) / 100,
    avgOffline: Math.round(avgOffline * 10) / 10,
    dispersionWidth: offlines.length > 0
      ? Math.round((Math.max(...offlines) - Math.min(...offlines)) * 10) / 10
      : 0,
    dispersionDepth: carries.length > 0
      ? Math.round((Math.max(...carries) - Math.min(...carries)) * 10) / 10
      : 0,
    consistencyScore: consistencyScore(carries),
    bestCarry: carries.length > 0 ? Math.max(...carries) : 0,
    best5Carry: Math.round(topN(carries, 5) * 10) / 10,
    best10Carry: Math.round(topN(carries, 10) * 10) / 10,
    missTendency: avgOffline < -2 ? "left" : avgOffline > 2 ? "right" : "straight",
  };
}

export function computeSessionStats(
  sessionId: string,
  sessionName: string,
  shots: ShotRow[]
): SessionStats {
  const valid = shots.filter((s) => s.validity === "valid");
  const carries = valid.map((s) => s.carryDistance).filter((v): v is number => v != null);
  const totals = valid.map((s) => s.totalDistance).filter((v): v is number => v != null);
  const ballSpeeds = valid.map((s) => s.ballSpeed).filter((v): v is number => v != null);
  const clubSpeeds = valid.map((s) => s.clubSpeed).filter((v): v is number => v != null);
  const spinRates = valid.map((s) => s.spinRate).filter((v): v is number => v != null);
  const launchAngles = valid.map((s) => s.launchAngle).filter((v): v is number => v != null);
  const smashFactors = valid.map((s) => s.smashFactor).filter((v): v is number => v != null);
  const offlines = valid.map((s) => s.offlineDistance).filter((v): v is number => v != null);

  const timestamps = shots.map((s) => new Date(s.timestamp).getTime());
  const duration = timestamps.length > 1
    ? (Math.max(...timestamps) - Math.min(...timestamps)) / 60000
    : 0;

  const clubNames = new Set(shots.map((s) => s.clubName).filter(Boolean) as string[]);

  return {
    sessionId,
    sessionName,
    shotCount: shots.length,
    validShotCount: valid.length,
    clubsUsed: Array.from(clubNames),
    avgCarry: Math.round(avg(carries) * 10) / 10,
    avgTotal: Math.round(avg(totals) * 10) / 10,
    avgBallSpeed: Math.round(avg(ballSpeeds) * 10) / 10,
    avgClubSpeed: Math.round(avg(clubSpeeds) * 10) / 10,
    avgSpinRate: Math.round(avg(spinRates)),
    avgLaunchAngle: Math.round(avg(launchAngles) * 10) / 10,
    avgSmashFactor: Math.round(avg(smashFactors) * 100) / 100,
    avgOffline: Math.round(avg(offlines) * 10) / 10,
    duration: Math.round(duration),
  };
}

export function computeGapping(
  clubStats: ClubStats[]
): GappingData {
  // Sort by average carry distance descending
  const sorted = [...clubStats]
    .filter((c) => c.shotCount >= 3)
    .sort((a, b) => b.avgCarry - a.avgCarry);

  const clubs = sorted.map((club, idx) => {
    const next = idx < sorted.length - 1 ? sorted[idx + 1] : undefined;
    const gapToNext = next ? Math.round((club.avgCarry - next.avgCarry) * 10) / 10 : undefined;

    // Check overlap: if this club's min carry is less than next club's max carry
    let overlapWithNext: number | undefined;
    if (next) {
      const thisMin = club.avgCarry - club.stdDevCarry;
      const nextMax = next.avgCarry + next.stdDevCarry;
      if (thisMin < nextMax) {
        overlapWithNext = Math.round((nextMax - thisMin) * 10) / 10;
      }
    }

    return {
      clubName: club.clubName,
      avgCarry: club.avgCarry,
      avgTotal: club.avgTotal,
      minCarry: Math.round((club.avgCarry - club.stdDevCarry) * 10) / 10,
      maxCarry: Math.round((club.avgCarry + club.stdDevCarry) * 10) / 10,
      gapToNext,
      overlapWithNext,
    };
  });

  return { clubs };
}

export function toDispersionPoints(shots: ShotRow[]): DispersionPoint[] {
  return shots
    .filter((s) => s.carryDistance != null && s.offlineDistance != null)
    .map((s) => ({
      x: s.offlineDistance!,
      y: s.carryDistance!,
      clubName: s.clubName,
      shotNumber: undefined,
      validity: s.validity,
      ballSpeed: s.ballSpeed ?? undefined,
    }));
}

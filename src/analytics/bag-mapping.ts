import { avg, stdDev, median } from "./stats";

interface ShotForMapping {
  carryDistance?: number | null;
  totalDistance?: number | null;
  offlineDistance?: number | null;
  ballSpeed?: number | null;
  validity: string;
}

export interface BagMappingResult {
  avgCarry: number;
  avgTotal: number;
  minCarry: number;  // outliers removed
  maxCarry: number;  // outliers removed
  avgOffline: number;
  dispersionRadius: number;
  dispersionAngle: number; // degrees of arc
  shotCount: number;
  allCarries: number[];
  allOfflines: number[];
  filteredCarries: number[]; // outliers removed
  filteredOfflines: number[];
}

// Remove outliers using IQR method
function removeOutliers(values: number[]): number[] {
  if (values.length < 4) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return values.filter((v) => v >= lower && v <= upper);
}

export function computeBagMapping(shots: ShotForMapping[]): BagMappingResult | null {
  const valid = shots.filter((s) => s.validity === "valid");
  const carries = valid.map((s) => s.carryDistance).filter((v): v is number => v != null);
  const totals = valid.map((s) => s.totalDistance).filter((v): v is number => v != null);
  const offlines = valid.map((s) => s.offlineDistance).filter((v): v is number => v != null);

  if (carries.length < 3) return null;

  const filteredCarries = removeOutliers(carries);
  const filteredOfflines = removeOutliers(offlines);

  // Dispersion radius: average distance from center of grouping
  const centerX = avg(filteredOfflines);
  const centerY = avg(filteredCarries);
  const distances = filteredCarries.map((carry, i) => {
    const off = filteredOfflines[i] ?? 0;
    return Math.sqrt(Math.pow(off - centerX, 2) + Math.pow(carry - centerY, 2));
  });
  const dispersionRadius = Math.round(avg(distances) * 10) / 10;

  // Dispersion arc: angular spread in degrees from target line
  let dispersionAngle = 0;
  if (filteredCarries.length > 0 && filteredOfflines.length > 0) {
    const avgCarryDist = avg(filteredCarries);
    if (avgCarryDist > 0) {
      // Calculate the angle subtended by the offline spread at the average carry distance
      const offlineSpread = filteredOfflines.length > 0
        ? Math.max(...filteredOfflines) - Math.min(...filteredOfflines)
        : 0;
      dispersionAngle = Math.round(
        (Math.atan2(offlineSpread / 2, avgCarryDist) * 180 / Math.PI) * 2 * 10
      ) / 10;
    }
  }

  return {
    avgCarry: Math.round(avg(filteredCarries) * 10) / 10,
    avgTotal: totals.length > 0 ? Math.round(avg(removeOutliers(totals)) * 10) / 10 : 0,
    minCarry: Math.round(Math.min(...filteredCarries) * 10) / 10,
    maxCarry: Math.round(Math.max(...filteredCarries) * 10) / 10,
    avgOffline: Math.round(avg(filteredOfflines) * 10) / 10,
    dispersionRadius,
    dispersionAngle,
    shotCount: valid.length,
    allCarries: carries,
    allOfflines: offlines,
    filteredCarries,
    filteredOfflines,
  };
}

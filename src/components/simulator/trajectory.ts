import * as THREE from "three";

export interface ShotInput {
  ballSpeed: number;       // mph
  launchAngle: number;     // degrees vertical
  launchDirection: number; // degrees horizontal (negative = left, positive = right)
  spinRate: number;        // rpm
  spinAxis?: number;       // degrees
  carryDistance?: number;   // yards (from R50, used as ground truth)
  apexHeight?: number;     // yards
  offlineDistance?: number; // yards
}

export interface SimulatorConfig {
  screenDistanceFt: number;   // distance from tee to impact screen in feet
  screenWidthFt: number;      // screen width in feet
  screenHeightFt: number;     // screen height in feet
  teeHeightFt: number;        // tee height above floor in feet
}

export const DEFAULT_SIM_CONFIG: SimulatorConfig = {
  screenDistanceFt: 12,
  screenWidthFt: 14,
  screenHeightFt: 9,
  teeHeightFt: 0,
};

const YDS_TO_M = 0.9144;
const FT_TO_M = 0.3048;
const MPH_TO_MS = 0.44704;
const DEG_TO_RAD = Math.PI / 180;

/**
 * Compute a 3D ball trajectory from R50 shot data.
 * Returns an array of THREE.Vector3 points in meters.
 * X = lateral (right positive), Y = up, Z = forward (downrange positive).
 *
 * We use the R50's reported carry/apex/offline as ground truth and fit
 * a physics-plausible curve through those constraints rather than trying
 * to simulate drag/magnus from first principles.
 */
export function computeTrajectory(shot: ShotInput, numPoints = 120): THREE.Vector3[] {
  // Use R50 reported distances as ground truth when available
  const carryYds = shot.carryDistance ?? estimateCarry(shot.ballSpeed, shot.launchAngle);
  const carryM = carryYds * YDS_TO_M;

  // Apex height: use reported or estimate from launch angle and carry
  const apexYds = shot.apexHeight ?? estimateApex(carryYds, shot.launchAngle);
  const apexM = apexYds * YDS_TO_M;

  // Offline distance: use reported or estimate from launch direction
  const offlineYds = shot.offlineDistance ?? (carryYds * Math.tan(shot.launchDirection * DEG_TO_RAD));
  const offlineM = offlineYds * YDS_TO_M;

  // Build the trajectory as a parametric curve t ∈ [0, 1]
  // Forward (Z): linear progression to carry distance
  // Vertical (Y): parabolic arc peaking at apex (apex occurs around t=0.55 for typical shots)
  // Lateral (X): gradual curve to offline distance (approximating spin-induced curve)
  const points: THREE.Vector3[] = [];
  const apexT = 0.55; // apex occurs at ~55% of flight

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;

    // Forward distance
    const z = carryM * t;

    // Vertical: parabolic through (0,0), (apexT, apexM), (1, 0)
    // y = a*t^2 + b*t where y(apexT)=apexM and y(1)=0
    // From y(1)=0: a + b = 0 → b = -a
    // From y(apexT) = a*apexT^2 - a*apexT = apexM
    // a*(apexT^2 - apexT) = apexM → a = apexM / (apexT^2 - apexT)
    const a = apexM / (apexT * apexT - apexT);
    const b = -a;
    const y = Math.max(0, a * t * t + b * t);

    // Lateral: S-curve using cubic easing for natural ball curve shape
    // Ball starts straight, then curves increasingly
    const x = offlineM * (t * t * (3 - 2 * t)); // smoothstep

    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

/**
 * Get the ball position at the screen impact point.
 * Returns the index into the trajectory array closest to the screen distance.
 */
export function getScreenImpactIndex(
  trajectory: THREE.Vector3[],
  screenDistanceFt: number
): number {
  const screenM = screenDistanceFt * FT_TO_M;
  for (let i = 0; i < trajectory.length; i++) {
    if (trajectory[i].z >= screenM) return i;
  }
  return 0;
}

/** Estimate carry distance from ball speed and launch angle when not reported */
function estimateCarry(ballSpeedMph: number, launchAngleDeg: number): number {
  const v0 = ballSpeedMph * MPH_TO_MS;
  const angle = launchAngleDeg * DEG_TO_RAD;
  // Simplified with drag factor (~0.55 efficiency for a golf ball)
  const range = (v0 * v0 * Math.sin(2 * angle)) / 9.81;
  return (range * 0.55) / YDS_TO_M;
}

/** Estimate apex height from carry and launch angle */
function estimateApex(carryYds: number, launchAngleDeg: number): number {
  // Apex is roughly carry * sin(launch) * 0.3 for typical golf shots
  return carryYds * Math.sin(launchAngleDeg * DEG_TO_RAD) * 0.3;
}

/**
 * Convert simulator config distances to meters for the 3D scene.
 */
export function configToMeters(config: SimulatorConfig) {
  return {
    screenDistance: config.screenDistanceFt * FT_TO_M,
    screenWidth: config.screenWidthFt * FT_TO_M,
    screenHeight: config.screenHeightFt * FT_TO_M,
    teeHeight: config.teeHeightFt * FT_TO_M,
  };
}

// Normalized shot schema — all ingestion sources produce this format.
export interface NormalizedShot {
  // Identity
  shotNumber: number;
  timestamp: string; // ISO 8601
  clubName?: string;

  // Ball data
  ballSpeed?: number;       // mph
  launchAngle?: number;     // degrees vertical (VLA)
  launchDirection?: number; // degrees horizontal (HLA)
  spinRate?: number;        // rpm total
  backSpin?: number;        // rpm
  sideSpin?: number;        // rpm
  spinAxis?: number;        // degrees

  // Distance
  carryDistance?: number;   // yards
  totalDistance?: number;   // yards
  offlineDistance?: number; // yards (negative = left, positive = right)
  apexHeight?: number;     // yards

  // Club data
  clubSpeed?: number;      // mph
  smashFactor?: number;
  angleOfAttack?: number;  // degrees
  clubPath?: number;       // degrees
  faceAngle?: number;      // degrees
  faceToPath?: number;     // degrees
  dynamicLoft?: number;    // degrees

  // Meta
  shotShape?: string;
  shotResult?: string;
  validity?: "valid" | "invalid" | "warmup" | "excluded";
  source: ShotSource;
  rawPayload?: string;     // JSON stringified original data
}

export type ShotSource =
  | "live_bridge"
  | "csv_import"
  | "json_import"
  | "manual"
  | "garmin_api";

export interface ShotFilter {
  clubId?: string;
  sessionId?: string;
  dateFrom?: string;
  dateTo?: string;
  validity?: string;
  environment?: string;
  source?: ShotSource;
  sessionType?: string;
  tags?: string[];
  minCarry?: number;
  maxCarry?: number;
  minBallSpeed?: number;
  maxBallSpeed?: number;
}

// GSPro Open Connect v1 protocol types — used by the R50 bridge
export interface GSProShotMessage {
  DeviceID: string;
  Units: string;
  ShotNumber: number;
  APIversion: string;
  BallData: {
    Speed: number;
    SpinAxis: number;
    TotalSpin: number;
    BackSpin?: number;
    SideSpin?: number;
    HLA: number;       // Horizontal Launch Angle
    VLA: number;       // Vertical Launch Angle
    CarryDistance?: number;
  };
  ClubData?: {
    Speed?: number;
    AngleOfAttack?: number;
    FaceToTarget?: number;
    Lie?: number;
    Loft?: number;
    Path?: number;
    SpeedAtImpact?: number;
    VerticalFaceImpact?: number;
    HorizontalFaceImpact?: number;
    ClosureRate?: number;
  };
  ShotDataOptions: {
    ContainsBallData: boolean;
    ContainsClubData: boolean;
    LaunchMonitorIsReady?: boolean;
    LaunchMonitorBallDetected?: boolean;
    IsHeartBeat?: boolean;
  };
}

export interface GSProResponse {
  Code: number;
  Message: string;
  Player?: {
    Handed: string;
    Club: string;
  };
}

// Club mapping from GSPro short codes to display names
export const GSPRO_CLUB_MAP: Record<string, string> = {
  DR: "Driver",
  W2: "2 Wood",
  W3: "3 Wood",
  W4: "4 Wood",
  W5: "5 Wood",
  W7: "7 Wood",
  W9: "9 Wood",
  H2: "2 Hybrid",
  H3: "3 Hybrid",
  H4: "4 Hybrid",
  H5: "5 Hybrid",
  H6: "6 Hybrid",
  I1: "1 Iron",
  I2: "2 Iron",
  I3: "3 Iron",
  I4: "4 Iron",
  I5: "5 Iron",
  I6: "6 Iron",
  I7: "7 Iron",
  I8: "8 Iron",
  I9: "9 Iron",
  PW: "Pitching Wedge",
  GW: "Gap Wedge",
  SW: "Sand Wedge",
  LW: "Lob Wedge",
  PT: "Putter",
};

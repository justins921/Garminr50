import { NormalizedShot, GSProShotMessage, GSPRO_CLUB_MAP } from "@/types/shot";
import { ShotSourceAdapter } from "./base-source";

// Converts GSPro Open Connect v1 protocol messages from the R50 bridge
// into our normalized shot format.
export class GSProShotSource implements ShotSourceAdapter {
  readonly name = "Live R50 Bridge (GSPro Protocol)";
  readonly sourceType = "live_bridge";

  private currentClub: string = "Unknown";

  setCurrentClub(gsproCode: string) {
    this.currentClub = GSPRO_CLUB_MAP[gsproCode] ?? gsproCode;
  }

  validate(input: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const msg = input as GSProShotMessage;

    if (!msg?.ShotDataOptions?.ContainsBallData) {
      errors.push("Shot message must contain ball data");
    }
    if (!msg?.BallData?.Speed && msg.BallData?.Speed !== 0) {
      errors.push("Ball speed is required");
    }
    if (msg?.ShotDataOptions?.IsHeartBeat) {
      errors.push("Message is a heartbeat, not a shot");
    }

    return { valid: errors.length === 0, errors };
  }

  async parse(input: unknown): Promise<NormalizedShot[]> {
    const msg = input as GSProShotMessage;

    // Skip heartbeats
    if (msg.ShotDataOptions?.IsHeartBeat) return [];

    const ball = msg.BallData;
    const club = msg.ClubData;

    // Calculate back/side spin from total spin and axis if not provided
    let backSpin = ball.BackSpin;
    let sideSpin = ball.SideSpin;
    if (backSpin === undefined && ball.TotalSpin && ball.SpinAxis !== undefined) {
      const axisRad = (ball.SpinAxis * Math.PI) / 180;
      backSpin = Math.round(ball.TotalSpin * Math.cos(axisRad));
      sideSpin = Math.round(ball.TotalSpin * Math.sin(axisRad));
    }

    const shot: NormalizedShot = {
      shotNumber: msg.ShotNumber,
      timestamp: new Date().toISOString(),
      clubName: this.currentClub,

      // Ball data
      ballSpeed: ball.Speed,
      launchAngle: ball.VLA,
      launchDirection: ball.HLA,
      spinRate: ball.TotalSpin,
      backSpin,
      sideSpin,
      spinAxis: ball.SpinAxis,
      carryDistance: ball.CarryDistance,

      // Club data (if available)
      clubSpeed: club?.Speed ?? club?.SpeedAtImpact,
      angleOfAttack: club?.AngleOfAttack,
      clubPath: club?.Path,
      faceAngle: club?.FaceToTarget,
      dynamicLoft: club?.Loft,

      // Calculate derived metrics
      smashFactor:
        ball.Speed && club?.Speed ? parseFloat((ball.Speed / club.Speed).toFixed(2)) : undefined,

      validity: "valid",
      source: "live_bridge",
      rawPayload: JSON.stringify(msg),
    };

    return [shot];
  }
}

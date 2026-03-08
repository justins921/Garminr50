import { NormalizedShot } from "@/types/shot";
import { ShotSourceAdapter } from "./base-source";

// Handles JSON import from Garmin data dumps and generic shot data
export class JsonShotSource implements ShotSourceAdapter {
  readonly name = "JSON Import";
  readonly sourceType = "json_import";

  validate(input: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (typeof input !== "string") {
      errors.push("Input must be a JSON string");
      return { valid: false, errors };
    }
    try {
      const parsed = JSON.parse(input);
      if (!Array.isArray(parsed) && typeof parsed !== "object") {
        errors.push("JSON must be an array of shots or an object with a shots array");
        return { valid: false, errors };
      }
    } catch {
      errors.push("Invalid JSON format");
      return { valid: false, errors };
    }
    return { valid: true, errors: [] };
  }

  async parse(input: unknown): Promise<NormalizedShot[]> {
    const raw = JSON.parse(input as string);
    const items: Record<string, unknown>[] = Array.isArray(raw)
      ? raw
      : raw.shots ?? raw.data ?? [raw];

    return items.map((item, idx) => this.normalizeItem(item, idx + 1));
  }

  private normalizeItem(item: Record<string, unknown>, shotNum: number): NormalizedShot {
    return {
      shotNumber: this.getNum(item, ["shotNumber", "shot_number", "number"]) ?? shotNum,
      timestamp: this.getStr(item, ["timestamp", "date", "time", "dateTime"]) ?? new Date().toISOString(),
      clubName: this.getStr(item, ["club", "clubName", "club_name", "clubType", "club_type"]),
      ballSpeed: this.getNum(item, ["ballSpeed", "ball_speed", "BallSpeed"]),
      launchAngle: this.getNum(item, ["launchAngle", "launch_angle", "VLA", "vla"]),
      launchDirection: this.getNum(item, ["launchDirection", "launch_direction", "HLA", "hla"]),
      spinRate: this.getNum(item, ["spinRate", "spin_rate", "totalSpin", "TotalSpin"]),
      backSpin: this.getNum(item, ["backSpin", "back_spin", "BackSpin"]),
      sideSpin: this.getNum(item, ["sideSpin", "side_spin", "SideSpin"]),
      spinAxis: this.getNum(item, ["spinAxis", "spin_axis", "SpinAxis"]),
      carryDistance: this.getNum(item, ["carryDistance", "carry_distance", "carry", "CarryDistance"]),
      totalDistance: this.getNum(item, ["totalDistance", "total_distance", "total", "TotalDistance"]),
      offlineDistance: this.getNum(item, ["offlineDistance", "offline", "offline_distance", "deviation"]),
      apexHeight: this.getNum(item, ["apexHeight", "apex_height", "apex", "ApexHeight"]),
      clubSpeed: this.getNum(item, ["clubSpeed", "club_speed", "ClubSpeed", "clubHeadSpeed"]),
      smashFactor: this.getNum(item, ["smashFactor", "smash_factor", "SmashFactor"]),
      angleOfAttack: this.getNum(item, ["angleOfAttack", "angle_of_attack", "attackAngle", "AngleOfAttack"]),
      clubPath: this.getNum(item, ["clubPath", "club_path", "ClubPath", "path"]),
      faceAngle: this.getNum(item, ["faceAngle", "face_angle", "FaceAngle", "faceToTarget"]),
      faceToPath: this.getNum(item, ["faceToPath", "face_to_path", "FaceToPath"]),
      dynamicLoft: this.getNum(item, ["dynamicLoft", "dynamic_loft", "DynamicLoft"]),
      shotShape: this.getStr(item, ["shotShape", "shot_shape", "shape"]),
      shotResult: this.getStr(item, ["shotResult", "shot_result", "result"]),
      validity: "valid",
      source: "json_import",
      rawPayload: JSON.stringify(item),
    };
  }

  private getNum(obj: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const val = obj[key];
      if (val !== undefined && val !== null && val !== "") {
        const num = typeof val === "number" ? val : parseFloat(String(val));
        if (!isNaN(num)) return num;
      }
    }
    return undefined;
  }

  private getStr(obj: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const val = obj[key];
      if (val !== undefined && val !== null && val !== "") return String(val);
    }
    return undefined;
  }
}

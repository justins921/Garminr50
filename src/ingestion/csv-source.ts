import { NormalizedShot } from "@/types/shot";
import { ShotSourceAdapter } from "./base-source";

// Known CSV column mappings for Garmin Golf app exports
const COLUMN_MAP: Record<string, keyof NormalizedShot> = {
  "club": "clubName",
  "club name": "clubName",
  "club type": "clubName",
  "ball speed": "ballSpeed",
  "ball speed (mph)": "ballSpeed",
  "club speed": "clubSpeed",
  "club head speed": "clubSpeed",
  "club speed (mph)": "clubSpeed",
  "launch angle": "launchAngle",
  "launch direction": "launchDirection",
  "spin rate": "spinRate",
  "total spin": "spinRate",
  "back spin": "backSpin",
  "backspin": "backSpin",
  "side spin": "sideSpin",
  "sidespin": "sideSpin",
  "spin axis": "spinAxis",
  "carry distance": "carryDistance",
  "carry": "carryDistance",
  "carry (yards)": "carryDistance",
  "carry distance (yards)": "carryDistance",
  "total distance": "totalDistance",
  "total": "totalDistance",
  "total (yards)": "totalDistance",
  "total distance (yards)": "totalDistance",
  "offline": "offlineDistance",
  "offline distance": "offlineDistance",
  "carry deviation": "offlineDistance",
  "total deviation": "offlineDistance",
  "apex": "apexHeight",
  "apex height": "apexHeight",
  "smash factor": "smashFactor",
  "angle of attack": "angleOfAttack",
  "attack angle": "angleOfAttack",
  "club path": "clubPath",
  "face angle": "faceAngle",
  "face to path": "faceToPath",
  "dynamic loft": "dynamicLoft",
  "shot shape": "shotShape",
};

export class CsvShotSource implements ShotSourceAdapter {
  readonly name = "CSV Import";
  readonly sourceType = "csv_import";

  validate(input: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (typeof input !== "string") {
      errors.push("Input must be a CSV string");
      return { valid: false, errors };
    }
    const lines = input.trim().split("\n");
    if (lines.length < 2) {
      errors.push("CSV must have at least a header row and one data row");
      return { valid: false, errors };
    }
    return { valid: true, errors: [] };
  }

  async parse(input: unknown): Promise<NormalizedShot[]> {
    const csv = input as string;
    const lines = csv.trim().split("\n");
    const headers = this.parseRow(lines[0]).map((h) => h.toLowerCase().trim());

    // Build column index mapping
    const columnMap = new Map<number, keyof NormalizedShot>();
    headers.forEach((header, idx) => {
      const mapped = COLUMN_MAP[header];
      if (mapped) columnMap.set(idx, mapped);
    });

    const shots: NormalizedShot[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseRow(lines[i]);
      if (values.every((v) => !v.trim())) continue; // skip empty rows

      const shot: NormalizedShot = {
        shotNumber: i,
        timestamp: new Date().toISOString(),
        source: "csv_import",
        rawPayload: JSON.stringify(
          Object.fromEntries(headers.map((h, idx) => [h, values[idx]]))
        ),
      };

      columnMap.forEach((field, idx) => {
        const raw = values[idx]?.trim();
        if (!raw || raw === "" || raw === "-") return;

        if (field === "clubName" || field === "shotShape") {
          (shot as unknown as Record<string, unknown>)[field] = raw;
        } else {
          const num = parseFloat(raw);
          if (!isNaN(num)) {
            (shot as unknown as Record<string, unknown>)[field] = num;
          }
        }
      });

      // Try to find a date/time column
      const dateIdx = headers.findIndex((h) =>
        ["date", "time", "timestamp", "date/time"].includes(h)
      );
      if (dateIdx >= 0 && values[dateIdx]) {
        const parsed = new Date(values[dateIdx]);
        if (!isNaN(parsed.getTime())) {
          shot.timestamp = parsed.toISOString();
        }
      }

      shots.push(shot);
    }

    return shots;
  }

  private parseRow(row: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of row) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}

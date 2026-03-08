import { NormalizedShot } from "@/types/shot";
import { ShotSourceAdapter } from "./base-source";

// Known CSV column mappings for Garmin Golf / R50 exports and common launch monitor CSVs.
// Keys are lowercase header names.
const COLUMN_MAP: Record<string, keyof NormalizedShot> = {
  // Club identification
  "club": "clubName",
  "club name": "clubName",

  // Ball speed
  "ball speed": "ballSpeed",
  "ball speed (mph)": "ballSpeed",

  // Club speed
  "club speed": "clubSpeed",
  "club head speed": "clubSpeed",
  "club speed (mph)": "clubSpeed",

  // Launch
  "launch angle": "launchAngle",
  "launch direction": "launchDirection",

  // Spin
  "spin rate": "spinRate",
  "total spin": "spinRate",
  "back spin": "backSpin",
  "backspin": "backSpin",
  "side spin": "sideSpin",
  "sidespin": "sideSpin",
  "spin axis": "spinAxis",

  // Carry
  "carry distance": "carryDistance",
  "carry": "carryDistance",
  "carry (yards)": "carryDistance",
  "carry distance (yards)": "carryDistance",

  // Total
  "total distance": "totalDistance",
  "total": "totalDistance",
  "total (yards)": "totalDistance",
  "total distance (yards)": "totalDistance",

  // Offline — Garmin exports "Carry Deviation Distance" and "Total Deviation Distance"
  "offline": "offlineDistance",
  "offline distance": "offlineDistance",
  "carry deviation distance": "offlineDistance",

  // Apex
  "apex": "apexHeight",
  "apex height": "apexHeight",

  // Club delivery
  "smash factor": "smashFactor",
  "angle of attack": "angleOfAttack",
  "attack angle": "angleOfAttack",
  "club path": "clubPath",
  "face angle": "faceAngle",
  "club face": "faceAngle",
  "face to path": "faceToPath",
  "dynamic loft": "dynamicLoft",

  // Meta
  "shot shape": "shotShape",
};

// Garmin exports include a units row like: [mph],[deg],[Yards],...
// Detect and skip it.
function isUnitsRow(values: string[]): boolean {
  const unitPattern = /^\[.*\]$/;
  const unitCount = values.filter((v) => unitPattern.test(v.trim())).length;
  const nonEmpty = values.filter((v) => v.trim()).length;
  return nonEmpty > 0 && unitCount / nonEmpty > 0.3;
}

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

    // Find special column indices
    const dateIdx = headers.findIndex((h) =>
      ["date", "time", "timestamp", "date/time"].includes(h)
    );
    const spinRateTypeIdx = headers.indexOf("spin rate type");
    const noteIdx = headers.indexOf("note");
    const tagIdx = headers.indexOf("tag");

    const shots: NormalizedShot[] = [];
    let shotNum = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseRow(lines[i]);

      // Skip empty rows and unit header rows (Garmin format)
      if (values.every((v) => !v.trim())) continue;
      if (isUnitsRow(values)) continue;

      shotNum++;

      const shot: NormalizedShot = {
        shotNumber: shotNum,
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

      // Parse timestamp from date column
      if (dateIdx >= 0 && values[dateIdx]) {
        const parsed = new Date(values[dateIdx]);
        if (!isNaN(parsed.getTime())) {
          shot.timestamp = parsed.toISOString();
        }
      }

      // Mark shots with estimated spin as lower confidence (store in rawPayload)
      if (spinRateTypeIdx >= 0) {
        const spinType = values[spinRateTypeIdx]?.trim();
        if (spinType && spinType.toLowerCase() !== "measured") {
          // Keep the shot valid but annotate spin as estimated
          const raw = JSON.parse(shot.rawPayload ?? "{}");
          raw._spinRateType = spinType;
          shot.rawPayload = JSON.stringify(raw);
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

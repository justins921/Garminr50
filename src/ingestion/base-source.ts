import { NormalizedShot } from "@/types/shot";

// All ingestion sources implement this interface.
// Each source normalizes raw data into NormalizedShot format.
export interface ShotSourceAdapter {
  readonly name: string;
  readonly sourceType: string;

  // Parse raw input and return normalized shots
  parse(input: unknown): Promise<NormalizedShot[]>;

  // Validate that input is in expected format
  validate(input: unknown): { valid: boolean; errors: string[] };
}

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { CsvShotSource } from "@/ingestion/csv-source";
import { JsonShotSource } from "@/ingestion/json-source";
import { NormalizedShot } from "@/types/shot";

export async function POST(req: NextRequest) {
  try {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const format = formData.get("format") as string | null;
  const sessionName = formData.get("sessionName") as string | null;
  const environment = formData.get("environment") as string ?? "indoor";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const content = await file.text();
  const isJson = format === "json" || file.name.endsWith(".json");
  const source = isJson ? new JsonShotSource() : new CsvShotSource();

  // Validate
  const validation = source.validate(content);
  if (!validation.valid) {
    return NextResponse.json({ error: "Invalid file", details: validation.errors }, { status: 400 });
  }

  // Parse
  let shots: NormalizedShot[];
  try {
    shots = await source.parse(content);
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse file", details: String(err) }, { status: 400 });
  }

  if (shots.length === 0) {
    return NextResponse.json({ error: "No shots found in file" }, { status: 400 });
  }

  // Create session
  const session = await prisma.session.create({
    data: {
      name: sessionName ?? `Import: ${file.name}`,
      environment,
      source: isJson ? "json_import" : "csv_import",
    },
  });

  // Resolve clubs by name — auto-create any that don't exist yet
  const clubMap = new Map<string, string>();
  const existingClubs = await prisma.club.findMany();
  for (const c of existingClubs) {
    clubMap.set(c.name.toLowerCase(), c.id);
  }

  // Find club names from shots that don't exist in DB and create them
  const uniqueClubNames = new Set(
    shots.map((s) => s.clubName).filter((n): n is string => !!n)
  );
  const CLUB_TYPE_MAP: Record<string, { type: string; sortOrder: number }> = {
    driver: { type: "driver", sortOrder: 1 },
    "2 wood": { type: "wood", sortOrder: 2 },
    "3 wood": { type: "wood", sortOrder: 3 },
    "4 wood": { type: "wood", sortOrder: 4 },
    "5 wood": { type: "wood", sortOrder: 5 },
    "7 wood": { type: "wood", sortOrder: 6 },
    "2 hybrid": { type: "hybrid", sortOrder: 7 },
    "3 hybrid": { type: "hybrid", sortOrder: 8 },
    "4 hybrid": { type: "hybrid", sortOrder: 9 },
    "5 hybrid": { type: "hybrid", sortOrder: 10 },
    "3 iron": { type: "iron", sortOrder: 11 },
    "4 iron": { type: "iron", sortOrder: 12 },
    "5 iron": { type: "iron", sortOrder: 13 },
    "6 iron": { type: "iron", sortOrder: 14 },
    "7 iron": { type: "iron", sortOrder: 15 },
    "8 iron": { type: "iron", sortOrder: 16 },
    "9 iron": { type: "iron", sortOrder: 17 },
    "pitching wedge": { type: "wedge", sortOrder: 18 },
    "gap wedge": { type: "wedge", sortOrder: 19 },
    "sand wedge": { type: "wedge", sortOrder: 20 },
    "lob wedge": { type: "wedge", sortOrder: 21 },
    putter: { type: "putter", sortOrder: 22 },
  };

  for (const name of uniqueClubNames) {
    const key = name.toLowerCase();
    if (!clubMap.has(key)) {
      const info = CLUB_TYPE_MAP[key] ?? { type: "iron", sortOrder: 50 };
      const club = await prisma.club.create({
        data: { name, type: info.type, sortOrder: info.sortOrder },
      });
      clubMap.set(key, club.id);
    }
  }

  // Create shots
  const created = await prisma.$transaction(
    shots.map((shot, idx) => {
      const clubId = shot.clubName
        ? clubMap.get(shot.clubName.toLowerCase()) ?? null
        : null;

      return prisma.shot.create({
        data: {
          sessionId: session.id,
          clubId,
          shotNumber: shot.shotNumber ?? idx + 1,
          timestamp: shot.timestamp ? new Date(shot.timestamp) : new Date(),
          ballSpeed: shot.ballSpeed,
          clubSpeed: shot.clubSpeed,
          launchAngle: shot.launchAngle,
          launchDirection: shot.launchDirection,
          spinRate: shot.spinRate,
          backSpin: shot.backSpin,
          sideSpin: shot.sideSpin,
          spinAxis: shot.spinAxis,
          carryDistance: shot.carryDistance,
          totalDistance: shot.totalDistance,
          offlineDistance: shot.offlineDistance,
          apexHeight: shot.apexHeight,
          smashFactor: shot.smashFactor,
          angleOfAttack: shot.angleOfAttack,
          clubPath: shot.clubPath,
          faceAngle: shot.faceAngle,
          faceToPath: shot.faceToPath,
          dynamicLoft: shot.dynamicLoft,
          shotShape: shot.shotShape,
          shotResult: shot.shotResult,
          validity: shot.validity ?? "valid",
          source: shot.source,
          rawPayload: shot.rawPayload,
        },
      });
    })
  );

  // Log import
  await prisma.importLog.create({
    data: {
      source: isJson ? "json" : "csv",
      filename: file.name,
      status: "completed",
      shotCount: created.length,
    },
  });

  return NextResponse.json({
    sessionId: session.id,
    shotCount: created.length,
    sessionName: session.name,
    clubsCreated: uniqueClubNames.size,
  });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: "Import failed", details: String(err) },
      { status: 500 }
    );
  }
}

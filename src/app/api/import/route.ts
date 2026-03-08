import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { CsvShotSource } from "@/ingestion/csv-source";
import { JsonShotSource } from "@/ingestion/json-source";
import { NormalizedShot } from "@/types/shot";

export async function POST(req: NextRequest) {
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

  // Resolve clubs by name
  const clubMap = new Map<string, string>();
  const existingClubs = await prisma.club.findMany();
  for (const c of existingClubs) {
    clubMap.set(c.name.toLowerCase(), c.id);
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
  });
}

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { CsvShotSource } from "@/ingestion/csv-source";
import { JsonShotSource } from "@/ingestion/json-source";
import { NormalizedShot } from "@/types/shot";
import { avg } from "@/analytics/stats";
import { requireUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const clubId = formData.get("clubId") as string | null;
    const swingKey = formData.get("swingKey") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!clubId || !swingKey) {
      return NextResponse.json(
        { error: "clubId and swingKey are required" },
        { status: 400 }
      );
    }

    // Parse file
    const content = await file.text();
    const isJson = file.name.endsWith(".json");
    const source = isJson ? new JsonShotSource() : new CsvShotSource();

    const validation = source.validate(content);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid file", details: validation.errors },
        { status: 400 }
      );
    }

    let shots: NormalizedShot[];
    try {
      shots = await source.parse(content);
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to parse file", details: String(err) },
        { status: 400 }
      );
    }

    if (shots.length === 0) {
      return NextResponse.json({ error: "No shots found in file" }, { status: 400 });
    }

    // Get or create the active wedge matrix
    let matrix = await prisma.wedgeMatrix.findFirst({
      where: { isActive: true, userId },
      include: { entries: true },
    });

    if (!matrix) {
      // Auto-create a clock system matrix with this club
      matrix = await prisma.wedgeMatrix.create({
        data: {
          userId,
          name: "My Wedge Matrix",
          system: "clock",
          entries: {
            create: ["7", "8", "9", "10"].map((key) => ({
              clubId,
              swingKey: key,
              swingLabel:
                key === "7" ? "7 O'Clock" :
                key === "8" ? "8 O'Clock" :
                key === "9" ? "9 O'Clock" :
                "10 O'Clock",
            })),
          },
        },
        include: { entries: true },
      });
    }

    // Find or create the entry for this club + swingKey
    let entry = matrix.entries.find(
      (e) => e.clubId === clubId && e.swingKey === swingKey
    );

    if (!entry) {
      // Add this club/position to the existing matrix
      const swingLabels: Record<string, string> = {
        "7": "7 O'Clock", "8": "8 O'Clock", "9": "9 O'Clock", "10": "10 O'Clock",
        "25": "25% Swing", "50": "50% Swing", "75": "75% Swing", "100": "Full Swing",
        bump: "Bump & Run", soft: "Soft / Finesse", three_quarter: "Three-Quarter", full: "Full Swing",
      };

      entry = await prisma.wedgeMatrixEntry.create({
        data: {
          wedgeMatrixId: matrix.id,
          clubId,
          swingKey,
          swingLabel: swingLabels[swingKey] ?? swingKey,
        },
      });
    }

    // Create a session for these shots so they're tracked
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    const session = await prisma.session.create({
      data: {
        userId,
        name: `Wedge Import: ${club?.name ?? "Unknown"} — ${entry.swingLabel}`,
        environment: "indoor",
        source: "wedge_matrix_import",
      },
    });

    // Create shot records
    const created = await prisma.$transaction(
      shots.map((shot, idx) =>
        prisma.shot.create({
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
            source: "wedge_matrix_import",
            rawPayload: shot.rawPayload,
          },
        })
      )
    );

    // Calculate stats from the imported shots and update the entry
    const carries = created
      .map((s) => s.carryDistance)
      .filter((v): v is number => v != null);
    const totals = created
      .map((s) => s.totalDistance)
      .filter((v): v is number => v != null);
    const spins = created
      .map((s) => s.spinRate)
      .filter((v): v is number => v != null);
    const launches = created
      .map((s) => s.launchAngle)
      .filter((v): v is number => v != null);

    if (carries.length === 0) {
      return NextResponse.json({
        sessionId: session.id,
        shotCount: created.length,
        warning: "No carry distance data found — entry not updated",
      });
    }

    const updated = await prisma.wedgeMatrixEntry.update({
      where: { id: entry.id },
      data: {
        avgCarry: Math.round(avg(carries) * 10) / 10,
        avgTotal: totals.length > 0 ? Math.round(avg(totals) * 10) / 10 : null,
        avgSpinRate: spins.length > 0 ? Math.round(avg(spins)) : null,
        avgLaunchAngle: launches.length > 0 ? Math.round(avg(launches) * 10) / 10 : null,
        minCarry: Math.round(Math.min(...carries) * 10) / 10,
        maxCarry: Math.round(Math.max(...carries) * 10) / 10,
        shotCount: carries.length,
        sessionId: session.id,
        status: carries.length >= 3 ? "completed" : "in_progress",
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      shotCount: created.length,
      entry: updated,
      clubName: club?.name,
    });
  } catch (err) {
    const msg = String(err);
    if (msg.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Wedge matrix import error:", err);
    return NextResponse.json(
      { error: "Import failed", details: msg },
      { status: 500 }
    );
  }
}

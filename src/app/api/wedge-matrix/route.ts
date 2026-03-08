import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { avg } from "@/analytics/stats";
import { DEMO_MODE, MOCK_WEDGE_MATRIX } from "@/lib/mock-data";

const SWING_KEYS: Record<string, Array<{ key: string; label: string }>> = {
  clock: [
    { key: "7:30", label: "7:30 Position" },
    { key: "9:00", label: "9:00 Position" },
    { key: "10:30", label: "10:30 Position" },
    { key: "full", label: "Full Swing" },
  ],
  percentage: [
    { key: "25", label: "25% Swing" },
    { key: "50", label: "50% Swing" },
    { key: "75", label: "75% Swing" },
    { key: "100", label: "Full Swing" },
  ],
  feel: [
    { key: "bump", label: "Bump & Run" },
    { key: "soft", label: "Soft / Finesse" },
    { key: "three_quarter", label: "Three-Quarter" },
    { key: "full", label: "Full Swing" },
  ],
};

export async function GET() {
  if (DEMO_MODE) return NextResponse.json(MOCK_WEDGE_MATRIX);

  const matrix = await prisma.wedgeMatrix.findFirst({
    where: { isActive: true },
    include: {
      entries: {
        orderBy: [{ clubId: "asc" }, { swingKey: "asc" }],
      },
    },
  });

  if (!matrix) return NextResponse.json(null);

  // Enrich with club details
  const clubIds = [...new Set(matrix.entries.map((e) => e.clubId))];
  const clubs = await prisma.club.findMany({ where: { id: { in: clubIds } } });
  const clubMap = new Map(clubs.map((c) => [c.id, c]));

  return NextResponse.json({
    ...matrix,
    swingKeys: SWING_KEYS[matrix.system] ?? SWING_KEYS.clock,
    entries: matrix.entries.map((e) => ({
      ...e,
      club: clubMap.get(e.clubId),
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { system = "clock", clubIds, name = "My Wedge Matrix" } = body;

  if (!clubIds || !Array.isArray(clubIds) || clubIds.length === 0) {
    return NextResponse.json({ error: "clubIds required (wedge club IDs)" }, { status: 400 });
  }

  const swingKeys = SWING_KEYS[system] ?? SWING_KEYS.clock;

  // Deactivate existing
  await prisma.wedgeMatrix.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const matrix = await prisma.wedgeMatrix.create({
    data: {
      name,
      system,
      entries: {
        create: clubIds.flatMap((clubId: string) =>
          swingKeys.map((sk) => ({
            clubId,
            swingKey: sk.key,
            swingLabel: sk.label,
          }))
        ),
      },
    },
    include: { entries: true },
  });

  return NextResponse.json(matrix, { status: 201 });
}

// Update a matrix entry after hitting shots
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { entryId, sessionId } = body;

  if (!entryId) {
    return NextResponse.json({ error: "entryId required" }, { status: 400 });
  }

  const entry = await prisma.wedgeMatrixEntry.findUnique({
    where: { id: entryId },
  });
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get shots for this club from the session
  const where: Record<string, unknown> = { clubId: entry.clubId, validity: "valid" };
  if (sessionId) where.sessionId = sessionId;

  const shots = await prisma.shot.findMany({ where: where as any });

  const carries = shots.map((s) => s.carryDistance).filter((v): v is number => v != null);
  const totals = shots.map((s) => s.totalDistance).filter((v): v is number => v != null);
  const spins = shots.map((s) => s.spinRate).filter((v): v is number => v != null);
  const launches = shots.map((s) => s.launchAngle).filter((v): v is number => v != null);

  if (carries.length === 0) {
    return NextResponse.json({ error: "No valid shots with carry data" }, { status: 400 });
  }

  const updated = await prisma.wedgeMatrixEntry.update({
    where: { id: entryId },
    data: {
      avgCarry: Math.round(avg(carries) * 10) / 10,
      avgTotal: totals.length > 0 ? Math.round(avg(totals) * 10) / 10 : null,
      avgSpinRate: spins.length > 0 ? Math.round(avg(spins)) : null,
      avgLaunchAngle: launches.length > 0 ? Math.round(avg(launches) * 10) / 10 : null,
      minCarry: Math.round(Math.min(...carries) * 10) / 10,
      maxCarry: Math.round(Math.max(...carries) * 10) / 10,
      shotCount: carries.length,
      sessionId,
      status: carries.length >= 3 ? "completed" : "in_progress",
    },
  });

  return NextResponse.json(updated);
}

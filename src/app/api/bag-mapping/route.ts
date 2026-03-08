import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { computeBagMapping } from "@/analytics/bag-mapping";
import { DEMO_MODE, MOCK_BAG_MAPPING } from "@/lib/mock-data";

export async function GET() {
  if (DEMO_MODE) return NextResponse.json(MOCK_BAG_MAPPING);

  const mapping = await prisma.bagMapping.findFirst({
    where: { isActive: true },
    include: {
      clubs: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!mapping) {
    return NextResponse.json(null);
  }

  // Enrich with club details
  const clubIds = mapping.clubs.map((c) => c.clubId);
  const clubs = await prisma.club.findMany({
    where: { id: { in: clubIds } },
  });
  const clubMap = new Map(clubs.map((c) => [c.id, c]));

  const enriched = {
    ...mapping,
    clubs: mapping.clubs.map((mc) => ({
      ...mc,
      club: clubMap.get(mc.clubId),
    })),
  };

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clubIds, minShots = 5, name = "My Bag" } = body;

  if (!clubIds || !Array.isArray(clubIds) || clubIds.length === 0) {
    return NextResponse.json({ error: "clubIds required" }, { status: 400 });
  }

  // Deactivate existing mappings
  await prisma.bagMapping.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const mapping = await prisma.bagMapping.create({
    data: {
      name,
      minShots,
      clubs: {
        create: clubIds.map((clubId: string) => ({
          clubId,
          status: "pending",
        })),
      },
    },
    include: { clubs: true },
  });

  return NextResponse.json(mapping, { status: 201 });
}

// Update a specific club's mapping data after shots are recorded
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { bagMappingClubId, sessionId } = body;

  if (!bagMappingClubId) {
    return NextResponse.json({ error: "bagMappingClubId required" }, { status: 400 });
  }

  const mappingClub = await prisma.bagMappingClub.findUnique({
    where: { id: bagMappingClubId },
  });
  if (!mappingClub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get shots for this club from the session
  const where: Record<string, unknown> = { clubId: mappingClub.clubId, validity: "valid" };
  if (sessionId) where.sessionId = sessionId;

  const shots = await prisma.shot.findMany({ where: where as any });

  const result = computeBagMapping(shots);
  if (!result) {
    return NextResponse.json({ error: "Not enough valid shots" }, { status: 400 });
  }

  const mapping = await prisma.bagMapping.findUnique({
    where: { id: mappingClub.bagMappingId },
  });

  const isCompleted = result.shotCount >= (mapping?.minShots ?? 5);

  const updated = await prisma.bagMappingClub.update({
    where: { id: bagMappingClubId },
    data: {
      avgCarry: result.avgCarry,
      avgTotal: result.avgTotal,
      minCarry: result.minCarry,
      maxCarry: result.maxCarry,
      avgOffline: result.avgOffline,
      dispersionRadius: result.dispersionRadius,
      dispersionAngle: result.dispersionAngle,
      shotCount: result.shotCount,
      sessionId,
      status: isCompleted ? "completed" : "in_progress",
    },
  });

  return NextResponse.json({ ...updated, mapping: result });
}

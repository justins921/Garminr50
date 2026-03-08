import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE, MOCK_SHOTS } from "@/lib/mock-data";
import { requireUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (DEMO_MODE) {
    const sp = req.nextUrl.searchParams;
    const sessionId = sp.get("sessionId");
    const clubId = sp.get("clubId");
    const limit = parseInt(sp.get("limit") ?? "500");
    let shots = [...MOCK_SHOTS];
    if (sessionId) shots = shots.filter(s => s.sessionId === sessionId);
    if (clubId) shots = shots.filter(s => s.clubId === clubId);
    return NextResponse.json(shots.slice(0, limit));
  }

  try {
    const userId = await requireUserId();
    const sp = req.nextUrl.searchParams;
    const sessionId = sp.get("sessionId");
    const clubId = sp.get("clubId");
    const validity = sp.get("validity");
    const limit = parseInt(sp.get("limit") ?? "500");

    const shots = await prisma.shot.findMany({
      where: {
        session: { userId },
        ...(sessionId ? { sessionId } : {}),
        ...(clubId ? { clubId } : {}),
        ...(validity ? { validity } : {}),
      },
      include: { club: true, session: true },
      orderBy: { timestamp: "desc" },
      take: Math.min(limit, 1000),
    });

    return NextResponse.json(shots);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();

    // Support batch insert
    const shots = Array.isArray(body) ? body : [body];

    // Verify session ownership
    if (shots.length > 0 && shots[0].sessionId) {
      const session = await prisma.session.findFirst({
        where: { id: shots[0].sessionId, userId },
      });
      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
    }

    const created = await prisma.$transaction(
      shots.map((shot) =>
        prisma.shot.create({
          data: {
            sessionId: shot.sessionId,
            clubId: shot.clubId,
            shotNumber: shot.shotNumber,
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
            source: shot.source ?? "manual",
            rawPayload: shot.rawPayload,
          },
        })
      )
    );

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

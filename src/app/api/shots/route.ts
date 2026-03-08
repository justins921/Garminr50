import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sessionId = sp.get("sessionId");
  const clubId = sp.get("clubId");
  const validity = sp.get("validity");
  const limit = parseInt(sp.get("limit") ?? "500");

  const shots = await prisma.shot.findMany({
    where: {
      ...(sessionId ? { sessionId } : {}),
      ...(clubId ? { clubId } : {}),
      ...(validity ? { validity } : {}),
    },
    include: { club: true, session: true },
    orderBy: { timestamp: "desc" },
    take: Math.min(limit, 1000),
  });

  return NextResponse.json(shots);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Support batch insert
  const shots = Array.isArray(body) ? body : [body];

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
}

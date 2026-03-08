import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE, MOCK_SESSIONS } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  if (DEMO_MODE) return NextResponse.json(MOCK_SESSIONS);

  const searchParams = req.nextUrl.searchParams;
  const environment = searchParams.get("environment");
  const sessionType = searchParams.get("sessionType");

  const sessions = await prisma.session.findMany({
    where: {
      ...(environment ? { environment } : {}),
      ...(sessionType ? { sessionType } : {}),
    },
    include: {
      _count: { select: { shots: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = await prisma.session.create({
    data: {
      name: body.name ?? `Session ${new Date().toLocaleDateString()}`,
      environment: body.environment ?? "indoor",
      sessionType: body.sessionType ?? "practice",
      source: body.source ?? "manual",
      isLive: body.isLive ?? false,
      location: body.location,
      notes: body.notes,
    },
  });
  return NextResponse.json(session, { status: 201 });
}

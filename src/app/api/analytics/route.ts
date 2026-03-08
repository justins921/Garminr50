import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { computeClubStats, computeSessionStats, computeGapping } from "@/analytics/stats";
import { DEMO_MODE, MOCK_CLUB_STATS, MOCK_OVERVIEW, getMockGapping } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type"); // "clubs" | "session" | "gapping" | "overview"
  const sessionId = sp.get("sessionId");
  const clubId = sp.get("clubId");

  if (DEMO_MODE) {
    if (type === "clubs") return NextResponse.json(MOCK_CLUB_STATS);
    if (type === "gapping") return NextResponse.json(getMockGapping());
    if (type === "club" && clubId) {
      const stat = MOCK_CLUB_STATS.find(s => s.clubId === clubId);
      return stat ? NextResponse.json(stat) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(MOCK_OVERVIEW);
  }

  if (type === "session" && sessionId) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const shots = await prisma.shot.findMany({
      where: { sessionId },
      include: { club: true },
      orderBy: { shotNumber: "asc" },
    });

    const stats = computeSessionStats(
      session.id,
      session.name,
      shots.map((s) => ({
        ...s,
        clubName: s.club?.name,
        clubType: s.club?.type,
        timestamp: s.timestamp.toISOString(),
      }))
    );

    return NextResponse.json(stats);
  }

  if (type === "clubs" || type === "gapping") {
    const clubs = await prisma.club.findMany({ where: { isActive: true } });
    const where = sessionId ? { sessionId, validity: "valid" } : { validity: "valid" };

    const allStats = await Promise.all(
      clubs.map(async (club) => {
        const shots = await prisma.shot.findMany({
          where: { ...where, clubId: club.id },
          include: { club: true },
        });
        if (shots.length === 0) return null;

        return computeClubStats(
          club.id,
          club.name,
          club.type,
          shots.map((s) => ({
            ...s,
            clubName: s.club?.name,
            clubType: s.club?.type,
            timestamp: s.timestamp.toISOString(),
          }))
        );
      })
    );

    const stats = allStats.filter(Boolean);

    if (type === "gapping") {
      return NextResponse.json(computeGapping(stats as any));
    }

    return NextResponse.json(stats);
  }

  if (type === "club" && clubId) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

    const shots = await prisma.shot.findMany({
      where: { clubId, validity: "valid" },
      include: { club: true },
      orderBy: { timestamp: "desc" },
    });

    const stats = computeClubStats(
      club.id,
      club.name,
      club.type,
      shots.map((s) => ({
        ...s,
        clubName: s.club?.name,
        clubType: s.club?.type,
        timestamp: s.timestamp.toISOString(),
      }))
    );

    return NextResponse.json(stats);
  }

  // Overview - aggregate stats
  const totalShots = await prisma.shot.count({ where: { validity: "valid" } });
  const totalSessions = await prisma.session.count();
  const recentSessions = await prisma.session.findMany({
    take: 5,
    orderBy: { startedAt: "desc" },
    include: { _count: { select: { shots: true } } },
  });

  return NextResponse.json({
    totalShots,
    totalSessions,
    recentSessions,
  });
}

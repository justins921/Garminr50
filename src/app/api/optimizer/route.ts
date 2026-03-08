import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { analyzeShots } from "@/analytics/optimizer";
import { DEMO_MODE, MOCK_SHOTS } from "@/lib/mock-data";
import { requireUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (DEMO_MODE) {
    const sp = req.nextUrl.searchParams;
    const clubId = sp.get("clubId");
    const sessionId = sp.get("sessionId");

    let shots = MOCK_SHOTS;
    if (clubId) shots = shots.filter((s) => s.clubId === clubId);
    if (sessionId) shots = shots.filter((s) => s.sessionId === sessionId);

    if (shots.length === 0) {
      return NextResponse.json({
        overallScore: 0,
        overallGrade: "N/A",
        metrics: [],
        strengths: [],
        weaknesses: ["No shots found for analysis"],
        drills: [],
        insights: [],
      });
    }

    const clubType = shots[0]?.club?.type ?? "iron";
    return NextResponse.json(analyzeShots(shots, clubType));
  }

  try {
    const userId = await requireUserId();
    const sp = req.nextUrl.searchParams;
    const clubId = sp.get("clubId");
    const sessionId = sp.get("sessionId");

    const where: Record<string, unknown> = { session: { userId } };
    if (clubId) where.clubId = clubId;
    if (sessionId) where.sessionId = sessionId;

    const shots = await prisma.shot.findMany({
      where: where as any,
      include: { club: true },
      orderBy: { timestamp: "desc" },
      take: 200,
    });

    if (shots.length === 0) {
      return NextResponse.json({
        overallScore: 0,
        overallGrade: "N/A",
        metrics: [],
        strengths: [],
        weaknesses: ["No shots found for analysis"],
        drills: [],
        insights: [],
      });
    }

    // Determine club type for optimal ranges
    const clubType = shots[0]?.club?.type ?? "iron";

    const result = analyzeShots(shots, clubType);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

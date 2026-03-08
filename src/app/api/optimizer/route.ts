import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { analyzeShots } from "@/analytics/optimizer";
import { DEMO_MODE, MOCK_OPTIMIZER_RESULT } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  if (DEMO_MODE) return NextResponse.json(MOCK_OPTIMIZER_RESULT);

  const sp = req.nextUrl.searchParams;
  const clubId = sp.get("clubId");
  const sessionId = sp.get("sessionId");

  const where: Record<string, unknown> = {};
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
}

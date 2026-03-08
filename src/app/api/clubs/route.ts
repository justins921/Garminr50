import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE, MOCK_CLUBS } from "@/lib/mock-data";
import { requireUserId } from "@/lib/auth";

export async function GET() {
  if (DEMO_MODE) return NextResponse.json(MOCK_CLUBS);

  try {
    const userId = await requireUserId();
    const clubs = await prisma.club.findMany({
      where: { isActive: true, userId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { shots: true } } },
    });
    return NextResponse.json(clubs);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const club = await prisma.club.create({
      data: {
        userId,
        name: body.name,
        type: body.type,
        loft: body.loft,
        brand: body.brand,
        model: body.model,
        shaft: body.shaft,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return NextResponse.json(club, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

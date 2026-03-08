import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const clubs = await prisma.club.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { shots: true } } },
  });
  return NextResponse.json(clubs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const club = await prisma.club.create({
    data: {
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
}

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE, getMockSessionDetail } from "@/lib/mock-data";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (DEMO_MODE) {
    const detail = getMockSessionDetail(id);
    if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(detail);
  }

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      shots: {
        include: { club: true },
        orderBy: { shotNumber: "asc" },
      },
      tags: { include: { tag: true } },
    },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const session = await prisma.session.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(session);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

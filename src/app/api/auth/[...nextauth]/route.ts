// Auth disabled — local single-user mode
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "auth_disabled" });
}

export async function POST() {
  return NextResponse.json({ status: "auth_disabled" });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const record = await prisma.notlarimDefter.findUnique({
      where: { userId: session.user.id },
      select: { data: true },
    });

    return NextResponse.json(record?.data ?? null);
  } catch (err) {
    console.error("GET /api/notlarim/defter:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();

    await prisma.notlarimDefter.upsert({
      where:  { userId: session.user.id },
      update: { data, updatedAt: new Date() },
      create: { userId: session.user.id, data },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/notlarim/defter:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

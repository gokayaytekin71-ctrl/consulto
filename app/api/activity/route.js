

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null;

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return null;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const path = typeof body?.path === "string" ? body.path.slice(0, 500) : null;
    const type = typeof body?.type === "string" ? body.type.slice(0, 50) : "ACTIVE";

    const userAgent = request.headers.get("user-agent")?.slice(0, 1000) || null;
    const ip = getClientIp(request);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          lastSeenAt: new Date(),
        },
      }),
      prisma.userActivityLog.create({
        data: {
          userId: session.user.id,
          type,
          path,
          userAgent,
          ip,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ACTIVITY_LOG_ERROR", error);
    return NextResponse.json(
      { ok: false, error: "ACTIVITY_LOG_ERROR" },
      { status: 500 }
    );
  }
}
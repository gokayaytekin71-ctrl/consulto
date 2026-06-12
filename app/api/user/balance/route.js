import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json(
      {
        error: "UNAUTHORIZED",
        tokenBalance: 0,
        requireLogin: true,
      },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        tokenBalance: true,
      },
    });

    return Response.json(
      {
        ok: true,
        tokenBalance: user?.tokenBalance ?? 0,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/user/balance error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        tokenBalance: 0,
      },
      { status: 500 }
    );
  }
}
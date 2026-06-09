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
        message: "Çalışma alanlarını görmek için oturum açmalısınız.",
        requireLogin: true,
      },
      { status: 401 }
    );
  }

  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        _count: {
          select: {
            messages: true,
            notes: true,
            files: true,
            decisions: true,
          },
        },
      },
    });

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
        workspaces,
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
    console.error("GET /api/workspaces error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Çalışma alanları alınırken hata oluştu.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json(
      {
        error: "UNAUTHORIZED",
        message: "Çalışma alanı oluşturmak için oturum açmalısınız.",
        requireLogin: true,
      },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: "BAD_REQUEST",
        message: "Geçersiz JSON gövdesi.",
      },
      { status: 400 }
    );
  }

  const title = String(body?.title || "").trim();
  const subtitle = String(body?.subtitle || "Yeni oluşturulan çalışma").trim();

  if (!title) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Çalışma alanı adı zorunludur.",
      },
      { status: 400 }
    );
  }

  try {
    const workspace = await prisma.workspace.create({
      data: {
        userId: session.user.id,
        title,
        subtitle: subtitle || "Yeni oluşturulan çalışma",
        status: "Aktif",
      },
      include: {
        _count: {
          select: {
            messages: true,
            notes: true,
            files: true,
            decisions: true,
          },
        },
      },
    });

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
        workspace,
        tokenBalance: user?.tokenBalance ?? 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/workspaces error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Çalışma alanı oluşturulurken hata oluştu.",
      },
      { status: 500 }
    );
  }
}
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      response: Response.json(
        {
          error: "UNAUTHORIZED",
          message: "Bu işlem için oturum açmalısınız.",
          requireLogin: true,
        },
        { status: 401 }
      ),
    };
  }

  return { session, response: null };
}

async function getOwnedWorkspace(workspaceId, userId) {
  if (!workspaceId) return null;

  return prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      userId,
    },
    select: {
      id: true,
    },
  });
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(_request, { params }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const workspaceId = params?.id;

  if (!workspaceId) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Çalışma alanı id değeri zorunludur.",
      },
      { status: 400 }
    );
  }

  try {
    const workspace = await getOwnedWorkspace(workspaceId, session.user.id);

    if (!workspace) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Çalışma alanı bulunamadı.",
        },
        { status: 404 }
      );
    }

    const decisions = await prisma.workspaceDecision.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        karar: {
          select: {
            id: true,
            fileName: true,
            type: true,
            code: true,
            aiSummary: true,
            keywords: true,
          },
        },
      },
    });

    return Response.json(
      {
        ok: true,
        decisions,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/workspaces/[id]/decisions error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Kaydedilen kararlar alınırken hata oluştu.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const workspaceId = params?.id;

  if (!workspaceId) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Çalışma alanı id değeri zorunludur.",
      },
      { status: 400 }
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

  const kararId = cleanString(body?.kararId) || null;
  const slug = cleanString(body?.slug) || null;
  const court = cleanString(body?.court || body?.type) || null;
  const code = cleanString(body?.code) || null;
  const tag = cleanString(body?.tag) || null;
  const source = cleanString(body?.source) || "AI";

  if (!kararId && !slug && !court && !code) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Kaydedilecek karar için kararId, slug, court veya code alanlarından en az biri gereklidir.",
      },
      { status: 400 }
    );
  }

  try {
    const workspace = await getOwnedWorkspace(workspaceId, session.user.id);

    if (!workspace) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Çalışma alanı bulunamadı.",
        },
        { status: 404 }
      );
    }

    let connectedKararId = kararId;

    if (connectedKararId) {
      const karar = await prisma.karar.findUnique({
        where: {
          id: connectedKararId,
        },
        select: {
          id: true,
        },
      });

      if (!karar) connectedKararId = null;
    }

    let decision;

    if (connectedKararId) {
      decision = await prisma.workspaceDecision.upsert({
        where: {
          workspaceId_kararId: {
            workspaceId,
            kararId: connectedKararId,
          },
        },
        update: {
          slug,
          court,
          code,
          tag,
          source,
        },
        create: {
          workspaceId,
          kararId: connectedKararId,
          slug,
          court,
          code,
          tag,
          source,
        },
        include: {
          karar: {
            select: {
              id: true,
              fileName: true,
              type: true,
              code: true,
              aiSummary: true,
              keywords: true,
            },
          },
        },
      });
    } else {
      const exists = await prisma.workspaceDecision.findFirst({
        where: {
          workspaceId,
          kararId: null,
          slug,
          code,
        },
        select: {
          id: true,
        },
      });

      if (exists) {
        decision = await prisma.workspaceDecision.update({
          where: {
            id: exists.id,
          },
          data: {
            court,
            tag,
            source,
          },
          include: {
            karar: {
              select: {
                id: true,
                fileName: true,
                type: true,
                code: true,
                aiSummary: true,
                keywords: true,
              },
            },
          },
        });
      } else {
        decision = await prisma.workspaceDecision.create({
          data: {
            workspaceId,
            kararId: null,
            slug,
            court,
            code,
            tag,
            source,
          },
          include: {
            karar: {
              select: {
                id: true,
                fileName: true,
                type: true,
                code: true,
                aiSummary: true,
                keywords: true,
              },
            },
          },
        });
      }
    }

    await prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return Response.json(
      {
        ok: true,
        decision,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/workspaces/[id]/decisions error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Karar kaydedilirken hata oluştu.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const workspaceId = params?.id;

  if (!workspaceId) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Çalışma alanı id değeri zorunludur.",
      },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const decisionId = cleanString(url.searchParams.get("decisionId"));
  const kararId = cleanString(url.searchParams.get("kararId"));
  const slug = cleanString(url.searchParams.get("slug"));

  if (!decisionId && !kararId && !slug) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Silmek için decisionId, kararId veya slug gereklidir.",
      },
      { status: 400 }
    );
  }

  try {
    const workspace = await getOwnedWorkspace(workspaceId, session.user.id);

    if (!workspace) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Çalışma alanı bulunamadı.",
        },
        { status: 404 }
      );
    }

    const existing = await prisma.workspaceDecision.findFirst({
      where: {
        workspaceId,
        ...(decisionId ? { id: decisionId } : {}),
        ...(kararId ? { kararId } : {}),
        ...(slug ? { slug } : {}),
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Kaydedilen karar bulunamadı.",
        },
        { status: 404 }
      );
    }

    await prisma.workspaceDecision.delete({
      where: {
        id: existing.id,
      },
    });

    await prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return Response.json(
      {
        ok: true,
        message: "Karar çalışma alanından kaldırıldı.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/workspaces/[id]/decisions error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Karar kaldırılırken hata oluştu.",
      },
      { status: 500 }
    );
  }
}

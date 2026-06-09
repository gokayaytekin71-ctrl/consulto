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
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
        notes: {
          orderBy: {
            createdAt: "desc",
          },
        },
        files: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            workspaceId: true,
            name: true,
            type: true,
            size: true,
            url: true,
            storageKey: true,
            createdAt: true,
            aiSummary: true,
            detailedSummary: true,
            documentType: true,
            documentClass: true,
            legalKeywords: true,
            detectedStatutes: true,
            keyFacts: true,
            keyDates: true,
            parties: true,
            evidenceList: true,
            claimsOrAccusations: true,
            fields: true,
            risks: true,
            defenseIssues: true,
            searchSummary: true,
            aiProfile: true,
            profiledAt: true,
          },
        },
        decisions: {
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
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Çalışma alanı bulunamadı.",
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        ok: true,
        workspace,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/workspaces/[id] error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Çalışma alanı alınırken hata oluştu.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
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

  const data = {};

  if (typeof body?.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return Response.json(
        {
          error: "VALIDATION_ERROR",
          message: "Çalışma alanı adı boş olamaz.",
        },
        { status: 400 }
      );
    }
    data.title = title;
  }

  if (typeof body?.subtitle === "string") {
    data.subtitle = body.subtitle.trim() || null;
  }

  if (typeof body?.status === "string") {
    data.status = body.status.trim() || "Aktif";
  }

  if (!Object.keys(data).length) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Güncellenecek alan bulunamadı.",
      },
      { status: 400 }
    );
  }

  try {
    const exists = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!exists) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Çalışma alanı bulunamadı.",
        },
        { status: 404 }
      );
    }

    const workspace = await prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data,
    });

    return Response.json(
      {
        ok: true,
        workspace,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/workspaces/[id] error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Çalışma alanı güncellenirken hata oluştu.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
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
    const exists = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!exists) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Çalışma alanı bulunamadı.",
        },
        { status: 404 }
      );
    }

    await prisma.workspace.delete({
      where: {
        id: workspaceId,
      },
    });

    return Response.json(
      {
        ok: true,
        message: "Çalışma alanı silindi.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/workspaces/[id] error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Çalışma alanı silinirken hata oluştu.",
      },
      { status: 500 }
    );
  }
}

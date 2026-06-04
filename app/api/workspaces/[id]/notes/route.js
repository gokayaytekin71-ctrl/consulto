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

    const notes = await prisma.workspaceNote.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(
      {
        ok: true,
        notes,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/workspaces/[id]/notes error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Notlar alınırken hata oluştu.",
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

  const content = String(body?.content || body?.text || "").trim();
  const type = String(body?.type || "Kullanıcı Notu").trim() || "Kullanıcı Notu";

  if (!content) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Not içeriği boş olamaz.",
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

    const note = await prisma.workspaceNote.create({
      data: {
        workspaceId,
        type,
        content,
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
        note,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/workspaces/[id]/notes error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Not oluşturulurken hata oluştu.",
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
  const noteId = url.searchParams.get("noteId");

  if (!noteId) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Silmek için noteId gereklidir.",
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

    const note = await prisma.workspaceNote.findFirst({
      where: {
        id: noteId,
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!note) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Not bulunamadı.",
        },
        { status: 404 }
      );
    }

    await prisma.workspaceNote.delete({
      where: {
        id: note.id,
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
        message: "Not silindi.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/workspaces/[id]/notes error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Not silinirken hata oluştu.",
      },
      { status: 500 }
    );
  }
}
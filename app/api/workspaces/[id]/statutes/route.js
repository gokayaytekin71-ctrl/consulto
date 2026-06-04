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

    const statutes = await prisma.workspaceStatute.findMany({
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
        statutes,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/workspaces/[id]/statutes error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Kaydedilen mevzuatlar alınırken hata oluştu.",
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

  const mevzuatAdi = cleanString(body?.mevzuatAdi || body?.mevzuat_adi || body?.name);
  const madde = cleanString(body?.madde || body?.article) || null;
  const baslik = cleanString(body?.baslik || body?.title) || null;
  const note = cleanString(body?.note) || null;
  const content = cleanString(body?.content || body?.metin) || null;

  if (!mevzuatAdi) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Mevzuat adı zorunludur.",
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

    const statute = await prisma.workspaceStatute.upsert({
      where: {
        workspaceId_mevzuatAdi_madde: {
          workspaceId,
          mevzuatAdi,
          madde,
        },
      },
      update: {
        baslik,
        note,
        content,
      },
      create: {
        workspaceId,
        mevzuatAdi,
        madde,
        baslik,
        note,
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
        statute,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/workspaces/[id]/statutes error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Mevzuat kaydedilirken hata oluştu.",
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
  const statuteId = cleanString(url.searchParams.get("statuteId"));
  const mevzuatAdi = cleanString(url.searchParams.get("mevzuatAdi"));
  const madde = cleanString(url.searchParams.get("madde")) || null;

  if (!statuteId && !mevzuatAdi) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Silmek için statuteId veya mevzuatAdi gereklidir.",
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

    const statute = await prisma.workspaceStatute.findFirst({
      where: {
        workspaceId,
        ...(statuteId ? { id: statuteId } : {}),
        ...(!statuteId && mevzuatAdi ? { mevzuatAdi, madde } : {}),
      },
      select: {
        id: true,
      },
    });

    if (!statute) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Kaydedilen mevzuat bulunamadı.",
        },
        { status: 404 }
      );
    }

    await prisma.workspaceStatute.delete({
      where: {
        id: statute.id,
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
        message: "Mevzuat çalışma alanından kaldırıldı.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/workspaces/[id]/statutes error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Mevzuat kaldırılırken hata oluştu.",
      },
      { status: 500 }
    );
  }
}

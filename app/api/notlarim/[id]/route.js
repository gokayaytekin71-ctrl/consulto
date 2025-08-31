// app/api/notlarim/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "../../../../lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, folderId } = await request.json();

    if (title !== undefined && typeof title !== "string") {
      return NextResponse.json({ error: "Invalid title." }, { status: 400 });
    }

    // Directly update only if the note belongs to the user
    const result = await prisma.note.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(folderId !== undefined && { folderId }),
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    // Fetch the updated record
    const updated = await prisma.note.findUnique({ where: { id: params.id } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/notlarim/[id] — Sunucu hatası:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Attempt to delete only if the note belongs to the user
    const result = await prisma.note.deleteMany({
      where: { id: params.id, userId: session.user.id },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/notlarim/[id] — Sunucu hatası:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
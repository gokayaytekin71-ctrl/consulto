// app/api/notlarim/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const folderId = url.searchParams.get("folderId") || null;

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        folderId: folderId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (err) {
    console.error("GET /api/notlarim error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, folderId } = await request.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Invalid content." }, { status: 400 });
    }
    if (title && typeof title !== "string") {
      return NextResponse.json({ error: "Invalid title." }, { status: 400 });
    }

    const data = {
      userId: session.user.id,
      title: title ? title.trim() : null,
      content: content.trim(),
      ...(folderId && { folderId }),
    };
    const newNote = await prisma.note.create({ data });

    return NextResponse.json(newNote, { status: 201 });
  } catch (err) {
    console.error("POST /api/notlarim error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
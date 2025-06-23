// app/api/notlarim/folders/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "../../../../lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folders = await prisma.folder.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(folders);
  } catch (err) {
    console.error("GET /api/notlarim/folders — Server error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Folder name cannot be empty" }, { status: 400 });
    }

    const newFolder = await prisma.folder.create({
      data: { name: name.trim(), userId: session.user.id },
    });

    return NextResponse.json(newFolder, { status: 201 });
  } catch (err) {
    console.error("POST /api/notlarim/folders — Server error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
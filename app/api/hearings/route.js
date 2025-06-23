import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const token = await getToken({ req: request });
  const userId = token?.id || null;

  if (!userId) {
    return NextResponse.json({ error: "Yetki yok" }, { status: 401 });
  }

  const hearings = await prisma.hearing.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(hearings);
}

export async function POST(request) {
  const body = await request.json();
  const { date, content } = body;

  const token = await getToken({ req: request });
  const userId = token?.id || null;

  if (!date || !content) {
    return NextResponse.json({ error: "Eksik veri" }, { status: 400 });
  }

  const hearing = await prisma.hearing.create({
    data: {
      userId,
      date: new Date(date),
      content,
    },
  });

  return NextResponse.json(hearing);
}

export async function PUT(request) {
  const body = await request.json();
  const { date, oldContent, newContent } = body;

  const token = await getToken({ req: request });
  const userId = token?.id || null;

  if (!date || !oldContent || !newContent || !userId || newContent.trim() === "") {
    return NextResponse.json({ error: "Eksik veri veya yetki" }, { status: 400 });
  }

  const updated = await prisma.hearing.updateMany({
    where: {
      userId,
      content: oldContent.trim(),
      date: {
        gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
    },
    data: {
      content: newContent,
    },
  });

  return NextResponse.json({ updatedCount: updated.count });
}
export async function DELETE(request) {
  const body = await request.json();
  const { date, content } = body;

  const token = await getToken({ req: request });
  const userId = token?.id || null;

  if (!date || !content || !userId) {
    return NextResponse.json({ error: "Eksik veri veya yetki" }, { status: 400 });
  }

  const deleted = await prisma.hearing.deleteMany({
    where: {
      userId,
      content: content.trim(),
      date: {
        gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
    },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ warning: "Kayıt bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ deletedCount: deleted.count });
}
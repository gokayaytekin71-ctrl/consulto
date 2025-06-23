export async function GET(request) {
  const token = await getToken({ req: request });
  const userId = token?.id || null;

  if (!userId) {
    return NextResponse.json({ error: "Yetki yok" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function PUT(request) {
  const body = await request.json();
  const { date, oldContent, newContent } = body;

  const token = await getToken({ req: request });
  const userId = token?.id || null;

  if (!date || !oldContent || !newContent || !userId || newContent.trim() === "") {
    return NextResponse.json({ error: "Eksik veya geçersiz veri" }, { status: 400 });
  }

  const updated = await prisma.task.updateMany({
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

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const body = await request.json();
  const { date, content } = body;

  const token = await getToken({ req: request });
  const userId = token?.id || null;

  if (!date || !content || !userId) {
    return NextResponse.json({ error: "Eksik veri veya yetki" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      userId,
      date: new Date(date),
      content,
    },
  });

  return NextResponse.json(task);
}
export async function DELETE(request) {
  const body = await request.json();
  const { date, content } = body;

  const token = await getToken({ req: request });
  const userId = token?.id || null;

  if (!date || !content || !userId) {
    return NextResponse.json({ error: "Eksik veri veya yetki" }, { status: 400 });
  }

  const deleted = await prisma.task.deleteMany({
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
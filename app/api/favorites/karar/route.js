import { getToken } from "next-auth/jwt";
import prisma from '@/lib/prisma'; // Daha sağlam bir yol için path alias kullanıldı
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

const secret = process.env.NEXTAUTH_SECRET;

// Favori kararları, tüm detaylarıyla birlikte getirir
export async function GET(request) {
  const token = await getToken({ req: request, secret });
  if (!token?.id) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const favorites = await prisma.favoriteKarar.findMany({
      where: { userId: token.id },
      orderBy: { createdAt: "desc" },
      // ÖNEMLİ DEĞİŞİKLİK: İlişkili Karar verisini de sorguya dahil et
      include: {
        karar: true, 
      },
    });
    return NextResponse.json(favorites, { status: 200 });
  } catch (err) {
    console.error("GET /api/favorites/karar Hatası:", err);
    return NextResponse.json({ error: "Favori kararlar listelenirken bir sunucu hatası oluştu." }, { status: 500 });
  }
}

// Favoriye ekleme/kaldırma (toggle) işlemini yapar
export async function POST(request) {
  const token = await getToken({ req: request, secret });
  if (!token?.id) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const userId = token.id;

  try {
    const { kararId } = await request.json();
    if (!kararId) {
      return NextResponse.json({ error: "kararId gerekli." }, { status: 400 });
    }

    const key = { userId, kararId };
    const existing = await prisma.favoriteKarar.findUnique({ where: { userId_kararId: key } });

    if (existing) {
      await prisma.favoriteKarar.delete({ where: { userId_kararId: key } });
      return NextResponse.json({ message: "Favorilerden kaldırıldı.", isFavorited: false }, { status: 200 });
    } else {
      const created = await prisma.favoriteKarar.create({ data: key });
      return NextResponse.json({ message: "Favorilere eklendi.", isFavorited: true, favorite: created }, { status: 201 });
    }
  } catch (err) {
    // Veritabanı unique kuralı hatasını yakala
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: "Bu karar zaten favorilerinizde." }, { status: 409 }); // 409 Conflict
    }
    console.error("POST /api/favorites/karar Hatası:", err);
    return NextResponse.json({ error: "İşlem sırasında bir sunucu hatası oluştu." }, { status: 500 });
  }
}
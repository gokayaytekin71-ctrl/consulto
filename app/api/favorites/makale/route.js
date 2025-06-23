import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

// GET: Kullanıcının favori makalelerini getirir
export async function GET(request) {
  const token = await getToken({ req: request, secret });
  if (!token?.id) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const favorites = await prisma.favoriteMakale.findMany({
      where: { userId: token.id },
      include: {
        makale: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("Favori makaleler alınırken hata:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

// POST: Favori ekle/kaldır
export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret });
    if (!token?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    // Expecting body: { itemId: <doi> }
    const { itemId: doi } = await request.json();
    // Find the existing Makale by DOI
    const makale = await prisma.makale.findFirst({
      where: { doi },
    });
    if (!makale) {
      return NextResponse.json({ error: "Makale bulunamadı." }, { status: 404 });
    }
    const makaleId = makale.id;

    const existing = await prisma.favoriteMakale.findUnique({
      where: {
        userId_makaleId: {
          userId: token.id,
          makaleId,
        },
      },
    });

    if (existing) {
      await prisma.favoriteMakale.delete({
        where: {
          userId_makaleId: {
            userId: token.id,
            makaleId,
          },
        },
      });
      return NextResponse.json(
        { message: "Favorilerden kaldırıldı.", isFavorited: false, removed: true },
        { status: 200 }
      );
    } else {
      await prisma.favoriteMakale.create({
        data: {
          userId: token.id,
          makaleId,
        },
      });
      return NextResponse.json(
        { message: "Favorilere eklendi.", isFavorited: true, added: true },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Favori makale ekleme/kaldırma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
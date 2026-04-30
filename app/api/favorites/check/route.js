// app/api/favorites/check/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route"; // authOptions yolunu projene göre düzelt
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ isFavorited: false }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    
    if (!type || !id) {
        return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    let favorite = null;

    if (type === "karar") {
        favorite = await prisma.favoriteKarar.findUnique({
            where: { userId_kararId: { userId: session.user.id, kararId: id } }
        });
    } 
    // makale ve mevzuat tiplerini de kendi prisma şemana göre buraya ekleyebilirsin
    // else if (type === "makale") { ... }

    return NextResponse.json({ isFavorited: !!favorite });

  } catch (error) {
    console.error("Favori kontrol hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
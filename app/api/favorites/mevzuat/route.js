import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { getStatuteNameMap } from '@/veri/mevzuat/statutes'; // 1. Adımdaki fonksiyonu import et

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    // 1. Sunucu tarafında tüm mevzuatların ad listesini al
    const statuteNames = await getStatuteNameMap();

    // 2. Kullanıcının favorilerini veritabanından çek
    const userFavorites = await prisma.favoriteMevzuat.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Favori listesini, mevzuat adlarıyla zenginleştir
    const enrichedFavorites = userFavorites.map(fav => ({
      ...fav,
      // statuteNames Map'inden ilgili adı bul, bulamazsan key'i kullan
      name: statuteNames.get(fav.mevzuatKey) || fav.mevzuatKey,
    }));

    // 4. Zenginleştirilmiş listeyi istemciye gönder
    return NextResponse.json(enrichedFavorites);

  } catch (error) {
    console.error('API favori mevzuat hatası:', error);
    return NextResponse.json({ error: 'Favoriler alınırken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const { mevzuatKey, maddeNo } = await request.json();

    // Toggle favorite: if exists, remove; otherwise add
    const existing = await prisma.favoriteMevzuat.findUnique({
      where: {
        userId_mevzuatKey_maddeNo: {
          userId: session.user.id,
          mevzuatKey,
          maddeNo: maddeNo || null,
        },
      },
    });

    if (existing) {
      await prisma.favoriteMevzuat.delete({
        where: {
          userId_mevzuatKey_maddeNo: {
            userId: session.user.id,
            mevzuatKey,
            maddeNo: maddeNo || null,
          },
        },
      });
      return NextResponse.json({ removed: true });
    } else {
      const created = await prisma.favoriteMevzuat.create({
        data: {
          userId: session.user.id,
          mevzuatKey,
          maddeNo: maddeNo || null,
        },
      });
      return NextResponse.json({ added: true, favorite: created });
    }
  } catch (error) {
    console.error('API favori mevzuat POST hatası:', error);
    return NextResponse.json({ error: 'Favori ekleme/kaldırma hatası.' }, { status: 500 });
  }
}
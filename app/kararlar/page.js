// app/kararlar/page.js

import dynamic from "next/dynamic";
import LoadingOverlay from "@/components/LoadingOverlay";
import prisma from '../../lib/prisma';
const KararListesiIstemciBileseni = dynamic(
  () => import('./KararListesiIstemciBileseni.jsx'),
  { loading: () => <LoadingOverlay />, ssr: false }
);

const ITEMS_PER_PAGE = 9;

async function getPaginatedKararlar(query, page) {
  const whereClause = query
    ? {
        OR: [
          { content: { contains: query, mode: 'insensitive' } },
          { keywords: { contains: query, mode: 'insensitive' } },
        ],
      }
    : {};

  try {
    const totalItems = await prisma.karar.count({ where: whereClause });
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const kararlar = await prisma.karar.findMany({
      where: whereClause,
      take: ITEMS_PER_PAGE,
      skip: (page - 1) * ITEMS_PER_PAGE,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        fileName: true,
        type: true,
        code: true,
        aiSummary: true,
        keywords: true,
        contentLength: true,
      },
    });

    const processedKararlar = kararlar.map((k) => ({
      id: k.id,
      linkId: k.fileName.replace(/\.txt$/, ''),
      type: k.type || 'Tip Belirtilmemiş',
      code: k.code || 'No Belirtilmemiş',
      aiSummary: k.aiSummary || '(Özet bulunamadı)',
      keywords: k.keywords || null,
      contentLength: k.contentLength || 0,
    }));

    return {
      kararlar: processedKararlar,
      toplamSayfa: totalPages,
      mevcutSayfa: page,
      toplamKarar: totalItems,
    };
  } catch (error) {
    console.error('Veritabanından kararları çekerken hata:', error);
    return { kararlar: [], toplamSayfa: 0, mevcutSayfa: page, toplamKarar: 0 };
  }
}

export default async function KararlarPage({ searchParams }) {
  // 1) `searchParams.q` ve `searchParams.page` doğrudan okunuyor.
  //    Eğer array ise ilk elemanı, değilse kendisi (ya da boş string/1).
  const rawQ = searchParams.q;
  const query = Array.isArray(rawQ) ? rawQ[0] : rawQ || '';

  const rawPage = searchParams.page;
  const pageNumber = parseInt(
    Array.isArray(rawPage) ? rawPage[0] : rawPage || '1',
    10
  );

  // 2) Veritabanından filtrlenmiş listeyi çek:
  const data = await getPaginatedKararlar(query, pageNumber);

  // 3) Client component'e gereken prop’ları geç:
  return (
    <KararListesiIstemciBileseni
      kararlar={data.kararlar}
      toplamSayfa={data.toplamSayfa}
      mevcutSayfa={data.mevcutSayfa}
      mevcutAramaSorgusu={query}
      toplamKarar={data.toplamKarar}
    />
  );
}
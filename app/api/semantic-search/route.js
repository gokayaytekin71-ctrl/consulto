// app/api/semantic-search/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { semanticSearchWithSnippets } from '@/lib/weaviate';

// Slug ve ID fonksiyonlarını buraya ekle (buildKararIdFromRecord vb.)

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json([]);

  try {
    const raw = await semanticSearchWithSnippets(q, 60);

    // 1. Prisma sorgu listesi (Hem fileName hem Type+Code çiftleri ile ara)
    const fileNames = raw.map(r => r.fileName).filter(Boolean);
    const typeCodePairs = raw.filter(r => r.type && r.code).map(r => ({ type: r.type, code: r.code }));

    // 2. Prisma lookup (Daha kapsamlı arama)
    const dbRows = await prisma.karar.findMany({
      where: {
        OR: [
          { fileName: { in: fileNames } },
          { OR: typeCodePairs }
        ]
      },
      select: { type: true, code: true, fileName: true, aiSummary: true }
    });

    // 3. Eşleştirme Map'leri (Hız için)
    const nameMap = new Map(dbRows.map(r => [r.fileName, r]));
    const pairMap = new Map(dbRows.map(r => [`${r.type}|${r.code}`, r]));

    // 4. Verileri Birleştir (Buradaki fallback hayat kurtarır)
    const enriched = raw.map(r => {
      // Önce fileName ile bulmaya çalış, olmazsa type+code ile dene
      const dbMatch = nameMap.get(r.fileName) || pairMap.get(`${r.type}|${r.code}`);
      
      return {
        ...r,
        // ÖNCELİK: Prisma (DB), YOKSA: Weaviate (Python), O DA YOKSA: Fallback
        typeLabel: dbMatch?.type || r.type || "Yargıtay Kararı",
        code: dbMatch?.code || r.code || "Karar No Belirtilmemiş",
        aiSummary: dbMatch?.aiSummary || null,
        slug: buildKararIdFromRecord(dbMatch || r)
      };
    });

    return NextResponse.json(enriched);
  } catch (e) {
    console.error('API Hatası:', e);
    return NextResponse.json({ error: 'Arama başarısız.' }, { status: 500 });
  }
}
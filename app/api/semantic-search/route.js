// app/api/semantic-search/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { semanticSearchWithSnippets } from '@/lib/weaviate';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json([]);

  try {
    // Weaviate’den daha çok karar çek (örn. 60)
    const raw = await semanticSearchWithSnippets(q, 60);

    // Dosya adlarını topla (Weaviate tarafında ‘fileName’ gönderiyorsun)
    const names = [...new Set(raw.map(r => r.fileName).filter(Boolean))];

    // BenimDB’den topluca type/code al
    const rows = await prisma.karar.findMany({
      where: { fileName: { in: names } },
      select: { fileName: true, type: true, code: true }
    });
    const map = new Map(rows.map(r => [r.fileName, r]));

    // Zenginleştir + tekilleştir (aynı karar bir kere)
    const enriched = raw.map(r => {
      const m = map.get(r.fileName);
      return {
        ...r,
        type: m?.type ?? r.type,   // DB > fallback
        code: m?.code ?? r.code
      };
    });

    const uniqueByFile = Array.from(
      new Map(enriched.map(r => [r.fileName || r.id, r])).values()
    );

    return NextResponse.json(uniqueByFile);
  } catch (e) {
    console.error('API Semantik Arama Hatası:', e);
    return NextResponse.json({ error: 'Semantik arama hatası.' }, { status: 500 });
  }
}
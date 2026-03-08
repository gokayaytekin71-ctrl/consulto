// app/api/semantic-search/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { semanticSearchWithSnippets } from '@/lib/weaviate';

// --- Senin Link Üretim Fonksiyonların (Eksiksiz) ---
function slugifyType(t = "") {
  const map = { ç:"c", Ç:"C", ğ:"g", Ğ:"G", ı:"i", İ:"I", ö:"o", Ö:"O", ş:"s", Ş:"S", ü:"u", Ü:"U" };
  return String(t || "").replace(/[·.]/g, " ").replace(/[çÇğĞıİöÖşŞüÜ]/g, (m) => map[m] || m)
    .replace(/[^a-zA-Z0-9\s-]/g, " ").trim().replace(/\s+/g, "-").replace(/-+/g, "-") || "Mahkeme";
}

function codeToSegment(code = "") {
  const s = String(code || "").replace(/\s+/g, " ").trim();
  const m = s.match(/(\d{4})[\/\-]([0-9A-Za-z\-()\/]+)\s*E.*?(\d{4})[\/\-]([0-9A-Za-z\-()\/]+)\s*K/i);
  if (!m) return s.replace(/[^0-9A-Za-z/_\-()]/g, "").replace(/\//g, "-") || "code";
  return `${m[1]}-${m[2].replace(/\//g, "-")}E_${m[3]}-${m[4].replace(/\//g, "-")}K`;
}

function buildKararIdFromRecord(k) {
  if (k?.type && k?.code) return `${slugifyType(k.type)}__${codeToSegment(k.code)}`;
  return (k?.fileName || "").replace(/\.txt$/i, "") || "karar-detay";
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json([]);

  try {
    const raw = await semanticSearchWithSnippets(q, 60);

    // 1. Prisma için arama çiftlerini (type + code) hazırla
    const pairs = raw.filter(r => r.type && r.code).map(r => ({ type: r.type, code: r.code }));

    // 2. Prisma'da bu kararları topluca bul
    const dbRows = await prisma.karar.findMany({
      where: { OR: pairs },
      select: { type: true, code: true, fileName: true, aiSummary: true }
    });

    // 3. Hızlı eşleştirme Map'i oluştur
    const dbMap = new Map(dbRows.map(r => [`${r.type}|${r.code}`, r]));

    // 4. Verileri birleştir (Fallback mantığı ile)
    const enriched = raw.map(r => {
      const dbMatch = dbMap.get(`${r.type}|${r.code}`);
      
      return {
        ...r,
        // Prisma'da varsa oradakini, yoksa Weaviate'tekini kullan (Asla "Belirtilmemiş" yazmaz)
        typeLabel: dbMatch?.type || r.type || "Yargıtay Kararı",
        code: dbMatch?.code || r.code,
        aiSummary: dbMatch?.aiSummary || null,
        // Link üretimi
        slug: buildKararIdFromRecord(dbMatch || r)
      };
    });

    return NextResponse.json(enriched);
  } catch (e) {
    console.error('API Hatası:', e);
    return NextResponse.json({ error: 'Arama başarısız.' }, { status: 500 });
  }
}
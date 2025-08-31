import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import FavoriteButton from '@/components/FavoriteButton';
import HighlightedKararBody from '@/components/HighlightedKararBody';
import BackButton from '@/components/BackButton'; // Geri butonu import edildi
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- URL helpers: use type + code as primary, keep filename as legacy fallback ---
function slugifyType(t = "") {
  const map = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };
  const cleared = String(t || "")
    .replace(/[·.]/g, " ") // remove dots/center dot
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (m) => map[m] || m)
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  return cleared || "mahkeme";
}

function codeToSegment(code = "") {
  // Accept variants like "2022/11296 E. 2022/17927 K.", "2022/11296 E., 2022/17927 K.",
  // and older HGK formats like "2007/2-2 E. 2007/10 K." or with letters.
  const s = String(code || "").replace(/\s+/g, " ").trim();
  const m = s.match(/(\d{4})[\/\-]([0-9A-Za-z\-]+)\s*E.*?(\d{4})[\/\-]([0-9A-Za-z\-]+)\s*K/i);
  if (!m) {
    // fallback: keep only safe chars, convert slashes to dashes
    return s.replace(/[^0-9A-Za-z\/-]/g, "").replace(/[\/]/g, "-") || "code";
  }
  const eYear = m[1], eNo = m[2], kYear = m[3], kNo = m[4];
  return `${eYear}-${eNo}E_${kYear}-${kNo}K`;
}

function segmentToCode(seg = "") {
  // Inverse of codeToSegment
  // Supports eNo/kNo containing hyphens or letters, e.g. "2007-2-2E_2007-10K"
  const m = String(seg || "").match(/^(\d{4})-([0-9A-Za-z\-]+)E_(\d{4})-([0-9A-Za-z\-]+)K$/i);
  if (!m) return "";
  return `${m[1]}/${m[2]} E. ${m[3]}/${m[4]} K.`;
}

function buildKararIdFromRecord(k) {
  // Prefer type+code; fallback to fileName (without .txt)
  const type = (k?.type || "").trim();
  const code = (k?.code || "").trim();
  if (type && code) {
    return `${slugifyType(type)}__${codeToSegment(code)}`;
  }
  const fn = (k?.fileName || "").replace(/\.txt$/i, "");
  return fn || "";
}

function parseParamsId(paramsId = "") {
  // Support new scheme: "<slugified-type>__<YYYY-NNNNE_YYYY-NNNNK>"
  // Also support legacy: "<fileName-without-ext>"
  const id = String(paramsId || "");
  if (id.includes("__")) {
    const [typeSeg, codeSeg] = id.split("__");
    const code = segmentToCode(codeSeg);
    return { typeSeg, code, mode: "type+code" };
  }
  // legacy
  return { fileNameBase: id, mode: "filename" };
}

export async function generateStaticParams() {
  const kararlar = await prisma.karar.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    select: { fileName: true, type: true, code: true },
  });
  return kararlar
    .map(k => ({ id: buildKararIdFromRecord(k) }))
    .filter(k => k.id);
}

export default async function KararDetayPage({ params }) {
  const { id: kararSlug } = params;
  const parsed = parseParamsId(kararSlug);

  let karar = null;
  if (parsed.mode === "type+code" && parsed.code) {
    // Try tolerant lookup: parse code parts and use contains; also fuzzy match type
    const m = parsed.code.match(/(\d{4})\/([0-9A-Za-z-]+)\s*E.*?(\d{4})\/([0-9A-Za-z-]+)/i);
    // Build tolerant variants for type matching:
    // - "1 hukuk dairesi"
    // - "1. hukuk dairesi"
    // - "yargıtay 1. hukuk dairesi"
    // - also keep the raw slug segment with hyphens as a last resort
    const rawTypeSeg = String(parsed.typeSeg || "").trim();
    const tBase = rawTypeSeg.replace(/-/g, " ").replace(/\./g, "").trim(); // "1 hukuk dairesi"
    const tWithDot = tBase.replace(/^(\d+)\s+/, "$1. "); // "1. hukuk dairesi"
    const tWithPrefix = /^yargıtay/i.test(tBase) ? tBase : `yargıtay ${tWithDot}`; // "yargıtay 1. hukuk dairesi"
    const typeCandidates = Array.from(
      new Set(
        [tBase, tWithDot, tWithPrefix, rawTypeSeg]
          .map(s => s.trim())
          .filter(Boolean)
      )
    );
    const typeFilters = typeCandidates.map(s => ({ type: { contains: s, mode: "insensitive" } }));

    if (m) {
      const [, eYear, eNo, kYear, kNo] = m;
      karar = await prisma.karar.findFirst({
        where: {
          AND: [
            { code: { contains: `${eYear}/${eNo}` } },
            { code: { contains: `${kYear}/${kNo}` } },
            ...(typeFilters.length ? [{ OR: typeFilters }] : []),
          ],
        },
      });
      if (!karar) {
        // retry without type constraint (code fragments are usually unique)
        karar = await prisma.karar.findFirst({
          where: {
            AND: [
              { code: { contains: `${eYear}/${eNo}` } },
              { code: { contains: `${kYear}/${kNo}` } },
            ],
          },
        });
      }
    } else {
      // fallback to strict equality if parsing failed
      const eqTry = await prisma.karar.findFirst({
        where: {
          AND: [
            { code: { equals: parsed.code } },
            ...(typeFilters.length ? [{ OR: typeFilters }] : []),
          ],
        },
      });
      karar = eqTry;
      if (!karar) {
        karar = await prisma.karar.findFirst({
          where: {
            AND: [
              { code: { contains: parsed.code.replace(/\s+/g, " ").trim() } },
              ...(typeFilters.length ? [{ OR: typeFilters }] : []),
            ],
          },
        });
      }
      if (!karar) {
        // final retry: only by code contains
        karar = await prisma.karar.findFirst({
          where: { code: { contains: parsed.code.replace(/\s+/g, " ").trim() } },
        });
      }
    }
  }
  if (!karar && parsed.mode === "filename") {
    karar = await prisma.karar.findUnique({
      where: { fileName: `${parsed.fileNameBase}.txt` },
    });
  }
  // As a final fallback, if nothing matched and we have a legacy-looking id, try again by fileName
  if (!karar && kararSlug) {
    karar = await prisma.karar.findFirst({
      where: { fileName: `${kararSlug}.txt` },
    });
  }

  if (!karar) {
    notFound();
  }

  // If user arrived via legacy filename-based URL but this record has type+code,
  // redirect to canonical type+code URL for consistency.
  if (parsed.mode === "filename" && karar?.type && karar?.code) {
    const canonicalId = buildKararIdFromRecord(karar);
    if (canonicalId && canonicalId !== kararSlug) {
      redirect(`/kararlar/${canonicalId}`);
    }
  }

  const session = await getServerSession(authOptions);
  let isInitiallyFavorited = false;
  if (session?.user?.id) {
    const favorite = await prisma.favoriteKarar.findUnique({
      where: { userId_kararId: { userId: session.user.id, kararId: karar.id } },
    });
    isInitiallyFavorited = !!favorite;
  }

  const type = karar.type || 'Başlık Yok';
  const code = karar.code || 'Esas/Karar No Yok';
  const aiSummary = karar.aiSummary || 'Bu karar için yapay zeka özeti oluşturulamadı.';
  const keywordsFromKarar = typeof karar.keywords === 'string'
    ? karar.keywords.split(',').map(kw => kw.trim()).filter(Boolean)
    : [];

  const prevKarar = await prisma.karar.findFirst({
    where: { createdAt: { lt: karar.createdAt } },
    orderBy: { createdAt: 'desc' },
    select: { fileName: true, type: true, code: true },
  });
  const nextKarar = await prisma.karar.findFirst({
    where: { createdAt: { gt: karar.createdAt } },
    orderBy: { createdAt: 'asc' },
    select: { fileName: true, type: true, code: true },
  });
  const prevId = prevKarar ? buildKararIdFromRecord(prevKarar) : null;
  const nextId = nextKarar ? buildKararIdFromRecord(nextKarar) : null;

  const aiSummaryIconPath = "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.197-.398a2.25 2.25 0 001.423-1.423L16.5 15.75l.398 1.197a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.197.398a2.25 2.25 0 00-1.423 1.423z";

  const summaryKeywords = [
    { phrase: "Konu:", style: "text-sky-400 font-bold" },
    { phrase: "Gerekçe ve Sonuç:", style: "text-sky-400 font-bold" },
    { phrase: "HGK Gerekçesi ve Sonuç:", style: "text-sky-400 font-bold" },
    { phrase: "HGK Gerekçesi:", style: "text-indigo-400 font-bold" },
    { phrase: "Uyuşmazlık:", style: "text-sky-400 font-bold" },
  ];

  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderAiSummary = (summaryText) => {
    const sortedKeywords = [...summaryKeywords].sort((a, b) => b.phrase.length - a.phrase.length);
    const lines = (summaryText || "").split(/\r?\n/).filter(line => line.trim() !== '');

    return lines.map((line, index) => {
      for (const keywordObj of sortedKeywords) {
        const escapedPhrase = escapeRegExp(keywordObj.phrase);
        const keywordRegex = new RegExp(`^\\s*(${escapedPhrase})(?:\\s|\\b|$)`, 'i');
        const match = line.match(keywordRegex);

        if (match) {
          const matchedText = match[1];
          const restOfLine = line.substring(match[0].length);
          return (
            <p key={index}>
              <span className={keywordObj.style}>{matchedText}</span>
              <span className="text-slate-300"> {restOfLine}</span>
            </p>
          );
        }
      }
      return <p key={index} className="text-slate-300">{line}</p>;
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-gray-100 py-16 px-4 sm:px-6 lg:px-8 relative">
       {prevId && ( <Link href={`/kararlar/${prevId}`} className="fixed top-1/2 left-2 sm:left-4 transform -translate-y-1/2 z-20 p-3 bg-slate-700/50 hover:bg-slate-600/80 backdrop-blur-sm rounded-full text-white shadow-lg transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Önceki Karar"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /> </svg> </Link> )}
       {nextId && ( <Link href={`/kararlar/${nextId}`} className="fixed top-1/2 right-2 sm:right-4 transform -translate-y-1/2 z-20 p-3 bg-slate-700/50 hover:bg-slate-600/80 backdrop-blur-sm rounded-full text-white shadow-lg transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Sonraki Karar"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"> <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /> </svg> </Link> )}

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl shadow-2xl backdrop-blur-sm animate-fade-in-up">
          
          <header className="p-6 md:p-8 border-b border-slate-700/60">
            
            <BackButton className="mb-6" />

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-100 leading-tight">
                {type}
                <span className="block text-lg text-blue-300 font-medium mt-1">{code}</span>
              </h1>
              <div className="flex-shrink-0">
                <FavoriteButton itemId={karar.id} itemType="karar" initialIsFavorited={isInitiallyFavorited} />
              </div>
            </div>
            {keywordsFromKarar.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {keywordsFromKarar.map((kw, idx) => (
                  <Link key={idx} href={`/kararlar?q=${encodeURIComponent(kw)}&page=1`} className="bg-sky-900/70 text-sky-300 px-3 py-1 rounded-full text-xs font-medium hover:bg-sky-800/90 transition-colors cursor-pointer">
                    {kw}
                  </Link>
                ))}
              </div>
            )}
          </header>

          <div className="divide-y divide-slate-700/60">
            <section className="p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-200 flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={aiSummaryIconPath} />
                </svg>
                Yapay Zeka Özeti
              </h2>
              <div className="text-lg leading-relaxed space-y-3 prose prose-invert max-w-none">
                {renderAiSummary(aiSummary)}
              </div>
            </section>

            <section className="p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Karar Metni</h2>
              <article className="[&_p]:text-slate-300 text-base lg:text-lg leading-relaxed space-y-4">
                <HighlightedKararBody fullContent={karar.content || ""} />
              </article>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getKararlarFromDB } from "@/lib/data";
import BasicFilter from "@/components/BasicFilter";
import SectionRow from "@/components/SectionRow";
import SearchResults from "@/components/SearchResults";

// ——— Logic Helpers ———
function orderBySlugList(rows, slugs) {
  const map = new Map(rows.map((r) => [r.fileName?.replace(/\.txt$/, ""), r]));
  return slugs.map((s) => map.get(s)).filter(Boolean);
}

function parseEsasText(s = "") {
  const m = String(s || "").match(/(\d{4})\s*[\/-]\s*(\d+)\s*Esas/i);
  return m ? { year: m[1], no: m[2] } : null;
}
function parseKararText(s = "") {
  const m = String(s || "").match(/(\d{4})\s*[\/-]\s*(\d+)\s*Karar/i);
  return m ? { year: m[1], no: m[2] } : null;
}
function buildIbkPdfPath(karar_code = "", birlesme_no = "") {
  const e = parseEsasText(karar_code);
  const k = parseKararText(birlesme_no);
  if (!e || !k) return null;
  const file = `ibk_${e.year}-${e.no}E_${k.year}-${k.no}K.pdf`;
  return `/ibk/${file}`;
}

// ——— Data Fetching ———
async function getFeaturedDecisions() {
  const featuredSlugs = [
    "Hukuk_Genel_Kurulu_2020-603E_2024-224K",
    "Hukuk_Genel_Kurulu_2022-1099E_2024-355K",
    "Hukuk_Genel_Kurulu_2022-1241E_2024-9K",
    "Hukuk_Genel_Kurulu_2014-1026E_2015-1765K",
  ];
  const files = featuredSlugs.map((s) => `${s}.txt`);
  const rows = await prisma.karar.findMany({
    where: { fileName: { in: files } },
    select: { id: true, fileName: true, type: true, code: true, aiSummary: true, keywords: true, contentLength: true },
  });
  return orderBySlugList(rows, featuredSlugs);
}

async function getNewDecisions() {
  return prisma.karar.findMany({
    take: 48,
    orderBy: { createdAt: "desc" },
    where: {
      NOT: {
        OR: [
          { type: { contains: "Birleş", mode: "insensitive" } },
          { type: { contains: "Birles", mode: "insensitive" } },
          { type: { contains: "İçtihad", mode: "insensitive" } },
          { type: { contains: "Ictihad", mode: "insensitive" } },
          { type: { contains: "İBGK", mode: "insensitive" } },
          { type: { contains: "IBGK", mode: "insensitive" } },
          { type: { contains: "İBK", mode: "insensitive" } },
          { type: { contains: "IBK", mode: "insensitive" } },
          { code: { contains: "İBK", mode: "insensitive" } },
          { code: { contains: "IBK", mode: "insensitive" } },
          { fileName: { contains: "İçtihad", mode: "insensitive" } },
          { fileName: { contains: "Ictihad", mode: "insensitive" } },
          { fileName: { contains: "Birleştirme", mode: "insensitive" } },
          { fileName: { contains: "Birles", mode: "insensitive" } },
          { fileName: { contains: "İBGK", mode: "insensitive" } },
          { fileName: { contains: "IBGK", mode: "insensitive" } },
          { fileName: { contains: "İBK", mode: "insensitive" } },
          { fileName: { contains: "IBK", mode: "insensitive" } },
        ],
      },
    },
    select: { id: true, fileName: true, type: true, code: true, aiSummary: true, keywords: true, contentLength: true },
  });
}

async function getIbbgkFromNewTable() {
  const rows = await prisma.$queryRaw`
    SELECT id, karar_code, birlesme_no, icerik, ozet, created_at
    FROM public.ibbgk
    ORDER BY created_at DESC
    LIMIT 48
  `;
  return (rows || []).map((r) => ({
    id: r.id,
    karar_code: r.karar_code,
    birlesme_no: r.birlesme_no,
    icerik: r.icerik,
    ozet: r.ozet,
    created_at: r.created_at,
    pdfHref: buildIbkPdfPath(r.karar_code, r.birlesme_no),
    fileName: `ibk-${r.id}`, 
    type: "İçtihadı Birleştirme",
  }));
}

// ——— Page Component ———
export default async function KararlarPage({ searchParams }) {
  const { q, mahkeme, organ, esasYili, esasNo, kararYili, kararNo, kw, aiq, cursor, sort, phrase, qnot } = searchParams;

  const searchField = kw ? "keywords" : aiq ? "aiSummary" : "content";
  const searchTerm = kw || aiq || phrase || q || "";
  const hasSearch = !!(q || phrase || qnot || mahkeme || organ || esasYili || esasNo || kararYili || kararNo || kw || aiq);

  let searchResults = [];
  let nextCursor = undefined;

  if (hasSearch) {
    const { data, nextCursor: nc } = await getKararlarFromDB(
      { q, phrase, qnot, mahkeme, organ, esasYili, esasNo, kararYili, kararNo, kw, aiq, sort },
      cursor
    );
    searchResults = data;
    nextCursor = nc;
  }

  const [featuredRows, newRows, ibbgkRows] = await Promise.all([
    getFeaturedDecisions(),
    getNewDecisions(),
    getIbbgkFromNewTable(),
  ]);

  return (
    // ZEMİN: Analiz sayfasıyla aynı (#020617)
    <div className="relative min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden">
      
      {/* --- BACKGROUND FX (Analiz Sayfası Stili) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      </div>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {/* Analiz sayfasındaki logo kutusu stili */}
             <div className="relative w-10 h-10 bg-[#0f172a] rounded-lg border border-slate-700 flex items-center justify-center text-cyan-400 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
             </div>
             <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Karar Arşivi
                </h1>
                <p className="text-[10px] text-cyan-600/80 font-mono tracking-[0.2em] uppercase mt-0.5">
                  INTELLIGENCE SYSTEM
                </p>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f172a] border border-slate-800 text-[10px] text-slate-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_#06b6d4]"></span>
            VERİ TABANI: GÜNCEL
          </div>
        </div>
      </header>

      {/* --- CONTENT LAYOUT --- */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 py-8 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 xl:gap-12">
        
        {/* --- SIDEBAR (FILTER) --- */}
        <aside className="hidden lg:block">
          <div className="lg:sticky lg:top-28 space-y-6">
            {/* Kart Stili: Analiz Sidebar'ı gibi */}
            <div className="rounded-2xl border border-slate-700/50 bg-[#0f172a]/80 backdrop-blur-md shadow-xl">
               <div className="p-5">
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/5">
                    <div className="text-cyan-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Filtreleme</h2>
                  </div>
                  
                  <BasicFilter
                    defaultParams={{ q, phrase, qnot, mahkeme, organ, esasYili, esasNo, kararYili, kararNo, kw, aiq, sort }}
                  />
               </div>
            </div>
          </div>
        </aside>

        {/* --- MAIN FEED --- */}
        <main className="space-y-12 pb-20">
          
          {/* 1. ARAMA SONUÇLARI */}
          {hasSearch && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="mb-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-800"></div>
                  <span className="text-cyan-500 font-mono text-xs font-bold tracking-widest">ARAMA SONUÇLARI</span>
                  <div className="h-px flex-1 bg-slate-800"></div>
               </div>
              <SearchResults
                items={searchResults}
                query={searchTerm}
                field={searchField}
                initialNextCursor={nextCursor}
              />
            </section>
          )}

          {/* 2. ÖNE ÇIKANLAR */}
          <section>
             <SectionRow
                id="featured"
                title="Editörün Seçimi"
                subtitle="Hukuki derinliği yüksek, emsal niteliğindeki kararlar"
                items={featuredRows}
                initialVisible={3}
                perRow={3}
                addRows={3}
              />
          </section>

          {/* 3. SON EKLENENLER */}
          <section>
            <SectionRow
              id="new"
              title="Son Eklenenler"
              subtitle="Arşivimize yeni dahil edilen güncel kararlar"
              items={newRows}
              initialVisible={6}
              perRow={3}
              addRows={3}
              autoLoad={false}
            />
          </section>

          {/* 4. İÇTİHADI BİRLEŞTİRME */}
          {Array.isArray(ibbgkRows) && ibbgkRows.length > 0 && (
            <section>
              <SectionRow
                id="ibk"
                title="İçtihadı Birleştirme"
                subtitle="Yargıtay'ın en üst düzey normatif kararları (IBK)"
                items={ibbgkRows}
                variant="ibk"
                initialVisible={6}
                perRow={3}
                addRows={6}
              />
            </section>
          )}
          
        </main>
      </div>
    </div>
  );
}
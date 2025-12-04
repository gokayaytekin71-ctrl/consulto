export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getKararlarFromDB } from "@/lib/data";
import BasicFilter from "@/components/BasicFilter";
import SectionRow from "@/components/SectionRow";
import SearchResults from "@/components/SearchResults";
import MobileFilterDrawer from "@/components/MobileFilterDrawer"; // YENİ EKLENDİ

// ... (Helper fonksiyonlar aynı kalacak: orderBySlugList, parseEsasText vb.)
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
          { fileName: { contains: "İBK", mode: "insensitive" } },
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

export default async function KararlarPage({ searchParams = {} }) {
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

  // Filtreleme parametreleri (Her iki BasicFilter'a da geçmek için)
  const filterParams = { q, phrase, qnot, mahkeme, organ, esasYili, esasNo, kararYili, kararNo, kw, aiq, sort };

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-300 font-sans selection:bg-cyan-500/30 selection:text-white overflow-x-hidden">
      
      {/* Arkaplan Efektleri */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:30px_30px] lg:bg-[size:40px_40px]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] lg:h-[700px] bg-gradient-to-b from-slate-800/80 via-slate-900/20 to-transparent pointer-events-none"></div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-xl">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4">
             <div className="relative w-9 h-9 lg:w-10 lg:h-10 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center text-cyan-400 shadow-sm shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
             </div>
             <div>
                <h1 className="text-lg lg:text-xl font-bold text-slate-100 tracking-tight leading-none">
                  Karar Arşivi
                </h1>
                <p className="text-[9px] lg:text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">
                  INTELLIGENCE SYSTEM
                </p>
             </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-medium tracking-wide shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            VERİ TABANI: GÜNCEL
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 lg:px-4 py-6 lg:py-10 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 xl:gap-10">
        
        {/* SIDEBAR: Sadece Desktopta Görünür */}
        <aside className="hidden lg:block">
          <div className="lg:sticky lg:top-28 space-y-6">
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 backdrop-blur-md shadow-xl">
               <div className="p-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50">
                    <div className="text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Filtreleme</h2>
                  </div>
                  
                  <BasicFilter defaultParams={filterParams} />
               </div>
            </div>
          </div>
        </aside>

        <main className="space-y-8 lg:space-y-12 pb-16 lg:pb-24">
          
          {/* MOBİL FİLTRE BUTONU: Sadece Mobilde Görünür */}
          {/* Drawer içine BasicFilter'ı koyuyoruz. */}
          <MobileFilterDrawer>
            <BasicFilter defaultParams={filterParams} />
          </MobileFilterDrawer>

          {hasSearch && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="mb-6 lg:mb-8 flex items-center gap-3 lg:gap-4">
                  <div className="h-px flex-1 bg-slate-700"></div>
                  <span className="text-cyan-500 font-mono text-[10px] lg:text-xs font-bold tracking-widest bg-slate-800 px-3 py-1 lg:px-4 lg:py-1.5 rounded-full border border-slate-700">ARAMA SONUÇLARI</span>
                  <div className="h-px flex-1 bg-slate-700"></div>
               </div>
               {/* SearchResults içine class geçilebiliyorsa grid-cols ayarları oradan da yapılabilir */}
              <SearchResults
                items={searchResults}
                query={searchTerm}
                field={searchField}
                initialNextCursor={nextCursor}
              />
            </section>
          )}

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
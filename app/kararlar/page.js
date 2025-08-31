export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getKararlarFromDB } from "@/lib/data";
import BasicFilter from "@/components/BasicFilter";
import SectionRow from "@/components/SectionRow";
import SearchResults from "@/components/SearchResults";

function orderBySlugList(rows, slugs) {
  const map = new Map(rows.map((r) => [r.fileName?.replace(/\.txt$/, ""), r]));
  return slugs.map((s) => map.get(s)).filter(Boolean);
}

// —— IBK helpers (build PDF path from "YYYY/N Esas" + "YYYY/N Karar") ——
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

// ——— Editörden Seçmeler ———
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
  return orderBySlugList(rows, featuredSlugs);
}

// ——— Yeni Kararlar ———
async function getNewDecisions() {
  // Sadece Karar tablosu; İBK/İBGK içerikleri hariç
  return prisma.karar.findMany({
    take: 36,
    orderBy: { createdAt: "desc" },
    where: {
      NOT: {
        OR: [
          // type alanında izler
          { type: { contains: "Birleş", mode: "insensitive" } },
          { type: { contains: "Birles", mode: "insensitive" } },
          { type: { contains: "İçtihad", mode: "insensitive" } },
          { type: { contains: "Ictihad", mode: "insensitive" } },
          { type: { contains: "İBGK", mode: "insensitive" } },
          { type: { contains: "IBGK", mode: "insensitive" } },
          { type: { contains: "İBK", mode: "insensitive" } },
          { type: { contains: "IBK", mode: "insensitive" } },
          // code alanında ibk
          { code: { contains: "İBK", mode: "insensitive" } },
          { code: { contains: "IBK", mode: "insensitive" } },
          // fileName'de ibk/ibgk/içtihad/birleştirme izleri
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
}

// ——— İBGK (yeni tablo: public.ibbgk) ———
async function getIbbgkFromNewTable() {
  // public.ibbgk sadece IBK alanlarını tutuyor; Karar tablosu ile join yok.
  const rows = await prisma.$queryRaw`
    SELECT id, karar_code, birlesme_no, icerik, ozet, created_at
    FROM public.ibbgk
    ORDER BY created_at DESC
    LIMIT 36
  `;
  return (rows || []).map((r) => ({
    id: r.id,
    karar_code: r.karar_code,
    birlesme_no: r.birlesme_no,
    icerik: r.icerik,
    ozet: r.ozet,
    created_at: r.created_at,
    pdfHref: buildIbkPdfPath(r.karar_code, r.birlesme_no),
  }));
}

export default async function KararlarPage({ searchParams }) {
  const {
    q,
    mahkeme,
    organ,
    esasYili,
    esasNo,
    kararYili,
    kararNo,
    kw,
    aiq,
    cursor,
    sort,
    phrase,
    qnot,
  } = searchParams;

  const searchField = kw ? "keywords" : aiq ? "aiSummary" : "content";
  const searchTerm = kw || aiq || phrase || q || "";

  const hasSearch = !!(
    q ||
    phrase ||
    qnot ||
    mahkeme ||
    organ ||
    esasYili ||
    esasNo ||
    kararYili ||
    kararNo ||
    kw ||
    aiq
  );

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
    getIbbgkFromNewTable(),  // İBGK: ibbgk tablosu
  ]);

  return (
    <div className="bg-[#001f3f] min-h-screen">
      {/* HEADER */}
      <header className="w-full bg-blue-900/30 border-b border-blue-700/60 shadow-xl py-4">
        <div className="max-w-screen-2xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-200">
            Karar Arşivi
          </h1>
          <p className="text-sm text-blue-300/90 mt-1">
            Yargıtay içtihatlarına hızlı erişim
          </p>
        </div>
      </header>

      {/* LAYOUT: grid + sticky sidebar */}
      <div className="max-w-screen-2xl mx-auto px-4 py-8 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
        {/* SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-300" />
                <h2 className="text-lg font-semibold text-blue-100">Arama</h2>
              </div>
              <BasicFilter
                defaultParams={{
                  q,
                  phrase,
                  qnot,
                  mahkeme,
                  organ,
                  esasYili,
                  esasNo,
                  kararYili,
                  kararNo,
                  kw,
                  aiq,
                  sort,
                }}
              />
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="space-y-12">
          {hasSearch && (
            <SearchResults
              items={searchResults}
              query={searchTerm}
              field={searchField}
              initialNextCursor={nextCursor}
            />
          )}

          <SectionRow
            id="featured"
            title="Nitelikli Kararlar"
            subtitle="Özenle seçilmiş, referans niteliğindeki kararlar"
            items={featuredRows}
            initialVisible={3}
            perRow={3}
            addRows={2}
          />

          <SectionRow
            id="new"
            title="Yeni Kararlar"
            subtitle="Arşive yeni eklenen kararlar"
            items={newRows}
            initialVisible={3}
            perRow={3}
            addRows={2}
          />

          {Array.isArray(ibbgkRows) && ibbgkRows.length ? (
            <section id="ibk" className="space-y-3 scroll-mt-24" aria-labelledby="ibk-title">
              <header className="mb-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-300" />
                  <h2 id="ibk-title" className="text-lg md:text-2xl font-bold text-blue-100">
                    İçtihadı Birleştirme Kararları
                  </h2>
                </div>
              </header>
              <div className="space-y-4">
                {ibbgkRows.map((r) => {
                  const href = r.pdfHref || "#";
                  const badgeClass =
                    "inline-flex items-center rounded-full border border-blue-600/60 px-3 py-1 text-blue-100 font-semibold text-sm";
                  const content = (
                    <article
                      key={`ibbgk-${r.id}`}
                      className="rounded-xl border border-blue-700/50 bg-blue-900/20 p-4 hover:bg-blue-900/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className={badgeClass}>{r.karar_code || "—/— Esas"}</span>
                        <span className={badgeClass}>{r.birlesme_no || "—/— Karar"}</span>
                      </div>

                      <p className="mt-3 text-[15px] leading-7 text-blue-100 text-justify">
                        <span className="font-semibold text-blue-200">Özet: </span>
                        {r.ozet || "Özet ekli değil."}
                      </p>
                    </article>
                  );

                  // Tıklanınca PDF'e gitsin (yoksa tıklanamaz kutu)
                  return r.pdfHref ? (
                    <a
                      key={`ibbgk-link-${r.id}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                    >
                      {content}
                    </a>
                  ) : (
                    content
                  );
                })}
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
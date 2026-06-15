export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { getKararlarFromDB } from "@/lib/data";
import BasicFilter from "@/components/BasicFilter";
import SectionRow from "@/components/SectionRow";
import SearchResults from "@/components/SearchResults";
import MobileFilterDrawer from "@/components/MobileFilterDrawer";
import HeroSearch from "@/components/HeroSearch";

/* ============================================================
   GLOBAL CSS — "Editorial Law Review" (liste sayfası)
   Detay sayfasıyla (kararlar/[id]) birebir görsel dil:
   sıcak kağıt zemin · lacivert + amber · serif tipografi · grain
   ============================================================ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --paper:        #f6f3ec;
    --paper-2:      #efebe1;
    --surface:      #ffffff;
    --ink:          #1a1f2b;
    --ink-soft:     #4a5160;
    --ink-faint:    #8a8f9c;
    --navy:         #0f2a4a;
    --navy-2:       #163a63;
    --amber:        #b8860b;
    --amber-soft:   #c79a2e;
    --line:         #e3ddd0;
    --line-strong:  #d3ccba;
  }

  .law-root {
    background-color: var(--paper);
    color: var(--ink);
    font-family: 'Inter', system-ui, sans-serif;
    background-image:
      radial-gradient(900px 500px at 100% -5%, rgba(15,42,74,0.05), transparent 60%),
      radial-gradient(700px 400px at -10% 110%, rgba(184,134,11,0.06), transparent 60%);
    background-attachment: fixed;
    min-height: 100vh;
    position: relative;
  }

  /* grain dokusu */
  .law-root::before {
    content: "";
    position: fixed; inset: 0;
    pointer-events: none; z-index: 0;
    opacity: 0.5;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  }
  .law-root > * { position: relative; z-index: 1; }

  /* ---------------- HEADER ---------------- */
  .law-header {
    position: sticky; top: 0; z-index: 40;
    width: 100%;
    border-bottom: 1px solid var(--line);
    background: rgba(246,243,236,0.82);
    backdrop-filter: blur(14px);
  }
  .law-header-inner {
    max-width: 1240px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 28px;
  }
  .brand { display: flex; align-items: center; gap: 13px; text-decoration: none; }
  .brand-mark {
    width: 42px; height: 42px; border-radius: 12px;
    background: var(--navy); color: #f3d27a;
    display: grid; place-items: center; flex-shrink: 0;
    box-shadow: 0 5px 16px -5px rgba(15,42,74,0.45);
  }
  .brand-name {
    font-family: 'Fraunces', serif;
    font-weight: 700; font-size: 1.15rem; letter-spacing: -0.01em;
    color: var(--navy); line-height: 1; display: block;
  }
  .brand-sub {
    font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.22em;
    color: var(--ink-faint); margin-top: 6px; display: block;
  }
  .db-pill {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 0.68rem; font-weight: 600; letter-spacing: 0.04em;
    color: var(--ink-soft);
    background: var(--surface);
    border: 1px solid var(--line-strong);
    padding: 7px 14px; border-radius: 999px;
  }
  .db-pill .dot { width: 7px; height: 7px; border-radius: 50%; background: #2f9e6b; box-shadow: 0 0 0 3px rgba(47,158,107,0.15); }

  /* ---------------- LAYOUT ---------------- */
  .law-wrap {
    max-width: 1240px; margin: 0 auto;
    padding: 44px 28px 120px;
  }
  .law-grid {
    display: grid;
    grid-template-columns: 296px 1fr;
    gap: 48px;
    align-items: start;
  }

  /* ---------------- SIDEBAR / PANEL ---------------- */
  .panel {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
  }
  .panel-head {
    display: flex; align-items: center; gap: 11px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--line);
  }
  .panel-head .ic {
    display: grid; place-items: center;
    width: 30px; height: 30px; border-radius: 9px;
    background: rgba(184,134,11,0.08); color: var(--amber);
    flex-shrink: 0;
  }
  .panel-title {
    font-size: 0.66rem; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--navy);
  }
  .sidebar-sticky { position: sticky; top: 96px; max-height: calc(100vh - 7rem); overflow-y: auto; overscroll-behavior: contain; padding-right: 2px; }

  /* ---------------- HERO SEARCH ---------------- */
  .hero { margin-bottom: 40px; }
  .hero-kicker {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.24em;
    color: var(--amber); margin-bottom: 12px;
  }
  .hero-title {
    font-family: 'Fraunces', serif;
    font-weight: 600;
    font-size: clamp(1.7rem, 3.2vw, 2.5rem);
    line-height: 1.12; letter-spacing: -0.018em;
    color: var(--navy); max-width: 16ch;
    margin-bottom: 24px;
  }
  .hero-form { position: relative; }
  .hero-form .ic-search {
    position: absolute; inset-block: 0; left: 0; display: flex; align-items: center;
    padding-left: 18px; color: var(--ink-faint); pointer-events: none;
  }
  .hero-input {
    height: 60px; width: 100%;
    border-radius: 4px;
    border: 1px solid var(--line-strong);
    background: var(--surface);
    padding: 0 124px 0 50px;
    font-family: 'Newsreader', Georgia, serif;
    font-size: 1.08rem; color: var(--ink);
    box-shadow: 0 1px 0 var(--line), 0 24px 48px -38px rgba(26,31,43,0.4);
    transition: border-color .18s ease, box-shadow .18s ease;
  }
  .hero-input::placeholder { color: var(--ink-faint); }
  .hero-input:focus {
    outline: none; border-color: var(--navy);
    box-shadow: 0 1px 0 var(--line), 0 0 0 3px rgba(15,42,74,0.1);
  }
  .hero-submit {
    position: absolute; top: 8px; bottom: 8px; right: 8px;
    border: none; cursor: pointer;
    border-radius: 3px;
    background: var(--navy); color: #fff;
    padding: 0 26px;
    font-family: 'Inter', sans-serif;
    font-size: 0.82rem; font-weight: 600; letter-spacing: 0.02em;
    transition: background .18s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
  }
  .hero-submit:hover { background: var(--navy-2); }

  .hero-spinner {
    width: 15px;
    height: 15px;
    border-radius: 999px;
    border: 2px solid rgba(255,255,255,0.38);
    border-top-color: #fff;
    display: none;
    animation: heroSpin .75s linear infinite;
  }
  .hero-form.is-loading .hero-spinner { display: inline-block; }
  .hero-form.is-loading .hero-submit {
    cursor: wait;
    opacity: 0.94;
    pointer-events: none;
  }
  @keyframes heroSpin { to { transform: rotate(360deg); } }

  /* hızlı atlama çipleri */
  .jump { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 16px; }
  .jump a {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 0.74rem; font-weight: 500; color: var(--ink-soft);
    text-decoration: none;
    background: var(--surface);
    border: 1px solid var(--line-strong);
    padding: 7px 14px; border-radius: 999px;
    transition: all .16s ease;
  }
  .jump a:hover { color: var(--navy); border-color: var(--navy); transform: translateY(-1px); }
  .jump .d { width: 6px; height: 6px; border-radius: 50%; }

  /* ---------------- SECTION DIVIDER ---------------- */
  .results-head {
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 22px;
  }
  .results-head .lbl {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.66rem; font-weight: 500; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--amber);
  }
  .results-head .rule { height: 1px; flex: 1; background: var(--line-strong); }

  .stack { display: flex; flex-direction: column; gap: 40px; }

  @keyframes lawIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .anim-in { animation: lawIn .5s ease both; }

  /* ---------------- ARAMA VURGUSU (sarı) ---------------- */
  /* ts_headline / SearchResults <mark> ile sardığı eşleşmeler buradan stillenir.
     NOT: snippet'in dangerouslySetInnerHTML ile basıldığından emin ol. */
  mark,
  .search-snippet mark,
  .highlighted-body mark {
    background: #ffe27a;
    color: var(--ink);
    padding: 0 2px;
    border-radius: 3px;
    font-weight: 500;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }

  /* ---------------- LOADING SKELETON ---------------- */
  .skeleton-card {
    height: 130px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: linear-gradient(90deg, var(--paper-2) 25%, #f1ede3 37%, var(--paper-2) 63%);
    background-size: 400% 100%;
    animation: shimmer 1.4s ease infinite;
  }
  @keyframes shimmer {
    0%   { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }

  /* ---------------- RESPONSIVE ---------------- */
  @media (max-width: 980px) {
    .law-grid { grid-template-columns: 1fr; gap: 28px; }
    .law-wrap { padding: 28px 16px 90px; }
    .law-header-inner { padding: 14px 16px; }
    .sidebar-sticky { position: relative; top: 0; max-height: none; }
    .law-sidebar { display: none; }
  }
`;

/* ----------------------------- Yardımcılar ----------------------------- */
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

/* ------------------------------- Veri ---------------------------------- */
async function _getFeaturedDecisions() {
  const featuredSlugs = [
    "Hukuk_Genel_Kurulu_2020-603E_2024-224K",
    "Hukuk_Genel_Kurulu_2022-1099E_2024-355K",
    "Hukuk_Genel_Kurulu_2022-1241E_2024-9K",
    "Hukuk_Genel_Kurulu_2014-1026E_2015-1765K",
  ];
  const files = featuredSlugs.map((s) => `${s}.txt`);
  const rows = await prisma.karar.findMany({
    where: { fileName: { in: files } },
    select: { id: true, fileName: true, type: true, code: true, aiSummary: true, keywords: true, contentLength: true, createdAt: true },
  });
  return orderBySlugList(rows, featuredSlugs);
}

async function _getNewDecisions() {
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
    select: { id: true, fileName: true, type: true, code: true, aiSummary: true, keywords: true, contentLength: true, createdAt: true },
  });
}

// Postgres bigint -> JS BigInt gelir; JSON.stringify (unstable_cache) ve
// client component prop'ları BigInt'i serileştiremez. String'e çeviriyoruz.
function bigIntToString(v) {
  return typeof v === "bigint" ? v.toString() : v;
}

async function _getIbbgkFromNewTable() {
  const rows = await prisma.$queryRaw`
    SELECT id, karar_code, birlesme_no, icerik, ozet, created_at
    FROM public.ibbgk
    ORDER BY created_at DESC
    LIMIT 48
  `;
  return (rows || []).map((r) => {
    const id = bigIntToString(r.id);
    return {
      id,
      karar_code: r.karar_code,
      birlesme_no: bigIntToString(r.birlesme_no),
      icerik: r.icerik,
      ozet: r.ozet,
      created_at: r.created_at,
      pdfHref: buildIbkPdfPath(r.karar_code, r.birlesme_no),
      fileName: `ibk-${id}`,
      type: "İçtihadı Birleştirme",
    };
  });
}

/* ⚡ Statik bölümler önbelleğe alınır — arama yoksa bile her açılışta
   DB'ye gitmek yerine cache'ten servis edilir. createdAt serileştirme
   sorunlarını önlemek için tarihleri ISO string'e çeviriyoruz. */
const getFeaturedDecisions = unstable_cache(
  async () => {
    const rows = await _getFeaturedDecisions();
    return rows.map((r) => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null }));
  },
  ["kararlar-featured"],
  { revalidate: 3600, tags: ["kararlar"] }
);

const getNewDecisions = unstable_cache(
  async () => {
    const rows = await _getNewDecisions();
    return rows.map((r) => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null }));
  },
  ["kararlar-new"],
  { revalidate: 600, tags: ["kararlar"] }
);

const getIbbgkFromNewTable = unstable_cache(
  async () => {
    const rows = await _getIbbgkFromNewTable();
    return rows.map((r) => ({ ...r, created_at: r.created_at ? new Date(r.created_at).toISOString() : null }));
  },
  ["kararlar-ibbgk"],
  { revalidate: 600, tags: ["kararlar"] }
);

/* ------------------------------- Sayfa --------------------------------- */
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

  const filterParams = { q, phrase, qnot, mahkeme, organ, esasYili, esasNo, kararYili, kararNo, kw, aiq, sort };

  return (
    <div className="law-root">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="law-header">
        <div className="law-header-inner">
          <a href="/kararlar" className="brand">
            <span className="brand-mark">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </span>
            <span>
              <span className="brand-name">Karar Arşivi</span>
              <span className="brand-sub">Yargıtay İçtihat Veritabanı</span>
            </span>
          </a>

          <div className="db-pill">
            <span className="dot" />
            Veritabanı güncel
          </div>
        </div>
      </header>

      {/* ------------------------------ İçerik ------------------------------ */}
      <div className="law-wrap">
        <div className="law-grid">
          {/* SIDEBAR — detaylı filtreler (desktop) */}
          <aside className="law-sidebar">
            <div className="sidebar-sticky">
              <div className="panel">
                <div className="panel-head">
                  <span className="ic">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </span>
                  <h2 className="panel-title">Detaylı Filtreleme</h2>
                </div>
                <div style={{ padding: "20px" }}>
                  <BasicFilter defaultParams={filterParams} />
                </div>
              </div>
            </div>
          </aside>

          <main>
            {/* ARAMA HERO — birincil giriş noktası */}
            <section className="hero">
              <p className="hero-kicker">İçtihat Araması</p>
              <h2 className="hero-title">Yargıtay kararlarında derinlemesine arama</h2>

              {/* client component: useTransition ile pürüzsüz loading, reload yok */}
              <Suspense fallback={<div className="hero-form" aria-hidden="true" />}>
                <HeroSearch defaultQ={q || ""} />
              </Suspense>

              {/* Bölümlere hızlı atlama */}
              <div className="jump">
                {[
                  { id: "featured", label: "Editörün Seçimi", color: "var(--amber)" },
                  { id: "new", label: "Son Eklenenler", color: "#2f9e6b" },
                  { id: "ibk", label: "İçtihadı Birleştirme", color: "var(--navy)" },
                ].map((c) => (
                  <a key={c.id} href={`#${c.id}`}>
                    <span className="d" style={{ background: c.color }} />
                    {c.label}
                  </a>
                ))}
              </div>
            </section>

            {/* MOBİL FİLTRE BUTONU */}
            <div style={{ marginBottom: "40px" }}>
              <MobileFilterDrawer>
                <BasicFilter defaultParams={filterParams} />
              </MobileFilterDrawer>
            </div>

            <div className="stack">
              {hasSearch && (
                <section className="anim-in">
                  <div className="results-head">
                    <span className="lbl">Arama Sonuçları</span>
                    <div className="rule" />
                  </div>

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
                  initialVisible={4}
                  perRow={3}
                  addRows={3}
                />
              </section>

              <section>
                <SectionRow
                  id="new"
                  title="Son Eklenenler"
                  subtitle="Arşive yeni dahil edilen güncel kararlar"
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
                    subtitle="Yargıtay'ın en üst düzey normatif kararları (İBK)"
                    items={ibbgkRows}
                    variant="ibk"
                    initialVisible={6}
                    perRow={3}
                    addRows={6}
                  />
                </section>
              )}
            </div>
          </main>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
    </div>
  );
}
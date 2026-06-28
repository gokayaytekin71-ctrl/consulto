import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import prisma from '@/lib/prisma';
import FavoriteButton from '@/components/FavoriteButton';
import HighlightedKararBody from '@/components/HighlightedKararBody';
import BackButton from '@/components/BackButton';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';

const DownloadPDFButton = dynamicImport(
  () => import('@/components/DownloadPDFButton'),
  { ssr: false }
);

// --- CONFIG ---
// Kararların 30 gün boyunca (2592000 saniye) statik olarak önbellekte kalmasını sağlar
export const revalidate = 2592000;
// İstenmeyen on-demand DB sorgularını kesmek için: bilinmeyen slug'lar 404 (statik) döner,
// veritabanına gitmez. Mevcut kararlar yine ISR ile cache'lenir.
export const dynamicParams = true;

/* ============================================================
   GLOBAL CSS — "Editorial Law Review"
   Sıcak kağıt zemin · lacivert + amber · serif okuma tipografisi
   Liste sayfasıyla (—#0f2a4a / amber) görsel bütünlük
   ============================================================ */
const GLOBAL_CSS = `
  /* Font aileleri app/globals.css içindeki sistem font değişkenlerinden gelir;
     Google Fonts isteği ve woff2 indirmesi yapılmaz. */

  :root {
    /* Zemin & yüzeyler */
    --paper:        #f6f3ec;   /* sıcak kağıt */
    --paper-2:      #efebe1;   /* hafif koyu kağıt */
    --surface:      #ffffff;   /* kart */
    --ink:          #1a1f2b;   /* ana metin */
    --ink-soft:     #4a5160;   /* ikincil metin */
    --ink-faint:    #8a8f9c;   /* üçüncül / etiket */

    /* Marka */
    --navy:         #0f2a4a;   /* liste sayfasıyla aynı lacivert */
    --navy-2:       #163a63;
    --amber:        #b8860b;   /* koyu altın — kağıt üzerinde okunur */
    --amber-soft:   #c79a2e;

    --line:         #e3ddd0;   /* ince ayraç */
    --line-strong:  #d3ccba;
  }

  * { box-sizing: border-box; }

  body {
    background-color: var(--paper);
    color: var(--ink);
    font-family: var(--font-inter), system-ui, sans-serif;
    background-image:
      radial-gradient(900px 500px at 100% -5%, rgba(15,42,74,0.05), transparent 60%),
      radial-gradient(700px 400px at -10% 110%, rgba(184,134,11,0.06), transparent 60%);
    background-attachment: fixed;
  }

  /* İnce grain / kağıt dokusu */
  .grain::before {
    content: "";
    position: fixed; inset: 0;
    pointer-events: none; z-index: 0;
    opacity: 0.5;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  }

  /* ---------------- LAYOUT ---------------- */
  .wrap {
    position: relative; z-index: 1;
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 28px 120px;
  }

  /* ÜST ŞERİT */
  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 0 18px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 38px;
  }
  .brand {
    display: flex; align-items: center; gap: 12px;
    text-decoration: none;
  }
  .brand-mark {
    width: 38px; height: 38px; border-radius: 11px;
    background: var(--navy); color: #f3d27a;
    display: grid; place-items: center;
    box-shadow: 0 4px 14px -4px rgba(15,42,74,0.4);
  }
  .brand-name {
    font-family: var(--font-fraunces), serif;
    font-weight: 700; font-size: 1.05rem; letter-spacing: -0.01em;
    color: var(--navy); line-height: 1;
  }
  .brand-sub {
    font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.2em;
    color: var(--ink-faint); margin-top: 5px;
  }
  .pager {
    display: flex; gap: 6px;
    font-family: var(--font-ibm-plex-mono), monospace; font-size: 0.7rem;
  }
  .pager a, .pager span {
    padding: 7px 13px; border-radius: 9px;
    border: 1px solid var(--line-strong);
    color: var(--ink-soft); text-decoration: none;
    transition: all .18s ease; background: var(--surface);
  }
  .pager a:hover { color: var(--navy); border-color: var(--navy); transform: translateY(-1px); }
  .pager .off { opacity: 0.35; pointer-events: none; }

  /* ---------------- DOC HEADER ---------------- */
  .doc-head { margin-bottom: 30px; }
  .court-pill {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 0.66rem; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--amber);
    background: rgba(184,134,11,0.08);
    border: 1px solid rgba(184,134,11,0.25);
    padding: 6px 12px; border-radius: 999px;
    margin-bottom: 18px;
  }
  .court-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--amber); }

  .doc-title {
    font-family: var(--font-fraunces), serif;
    font-weight: 600;
    font-size: clamp(1.6rem, 3.4vw, 2.55rem);
    line-height: 1.18;
    letter-spacing: -0.015em;
    color: var(--navy);
    max-width: 22ch;
  }
  .doc-meta {
    display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center;
    margin-top: 18px;
    font-family: var(--font-inter), system-ui, sans-serif;
    font-size: 0.78rem; color: var(--ink-soft);
  }
  .doc-meta .k { color: var(--ink-faint); text-transform: uppercase; font-size: 0.62rem; letter-spacing: 0.12em; margin-right: 8px; }
  .doc-meta .code { color: var(--navy); font-weight: 500; }

  /* ---------------- TWO COLUMN ---------------- */
  .grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 56px;
    align-items: start;
  }

  /* ---- READING COLUMN ---- */
  .reader {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 56px clamp(28px, 5vw, 72px);
    box-shadow: 0 1px 0 var(--line), 0 30px 60px -40px rgba(26,31,43,0.25);
    position: relative;
  }
  /* sol kenarda ince renk şeridi — dergi hissi */
  .reader::before {
    content: ""; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: linear-gradient(var(--navy), var(--amber));
    border-radius: 4px 0 0 4px;
  }

  .reader .lead-cap p:first-of-type::first-letter {
    font-family: var(--font-fraunces), serif;
    font-weight: 700;
    font-size: 3.4em; line-height: 0.8;
    float: left; margin: 0.06em 0.12em 0 0;
    color: var(--navy);
  }

  .prose p, .highlighted-body p {
    font-family: "Times New Roman", Times, serif;
    font-size: 1.16rem;
    line-height: 1.92;
    color: var(--ink);
    margin: 0 0 1.4em;
    text-align: justify;
    hyphens: auto;
  }
  .highlighted-body { font-family: "Times New Roman", Times, serif; }

  .reader-foot {
    margin-top: 56px; padding-top: 26px;
    border-top: 1px solid var(--line);
    display: flex; align-items: center; justify-content: center; gap: 16px;
    color: var(--line-strong);
  }
  .reader-foot .rule { height: 1px; width: 60px; background: var(--line-strong); }
  .reader-foot .sym { font-family: var(--font-fraunces), serif; color: var(--amber); letter-spacing: 0.4em; }

  /* ---- SIDE RAIL ---- */
  .rail {
    position: sticky; top: 28px;
    display: flex; flex-direction: column; gap: 18px;
  }

  .panel {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
  }
  .panel-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
  }
  .panel-title {
    display: flex; align-items: center; gap: 8px;
    font-size: 0.66rem; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--navy);
  }
  .panel-title svg { color: var(--amber); }
  .panel-body { padding: 16px; }

  /* AI summary */
  .ai-body { max-height: 46vh; overflow-y: auto; padding-right: 4px; }
  .ai-block { margin-bottom: 16px; }
  .ai-block:last-child { margin-bottom: 0; }
  .ai-heading {
    font-family: var(--font-fraunces), serif;
    font-weight: 600; font-size: 0.9rem;
    color: var(--navy); margin-bottom: 5px;
  }
  .ai-text {
    font-family: var(--font-newsreader), serif;
    font-size: 0.94rem; line-height: 1.62; color: var(--ink-soft);
  }
  .ai-loose {
    border-left: 2px solid var(--line-strong);
    padding-left: 12px; margin-bottom: 12px;
  }

  /* keywords */
  .tags { display: flex; flex-wrap: wrap; gap: 7px; }
  .tag {
    font-size: 0.68rem; font-weight: 500;
    color: var(--navy);
    background: var(--paper-2);
    border: 1px solid var(--line-strong);
    padding: 4px 10px; border-radius: 7px;
    transition: all .15s ease;
  }
  .tag:hover { background: var(--navy); color: #fff; border-color: var(--navy); }

  /* actions */
  .actions { display: flex; flex-direction: column; gap: 10px; }
  .btn-back {
    width: 100%; text-align: left;
    display: flex; align-items: center; gap: 8px;
    font-size: 0.82rem; font-weight: 600; color: var(--ink-soft);
    background: var(--surface);
    border: 1px solid var(--line-strong);
    padding: 11px 14px; border-radius: 11px;
    transition: all .16s ease; cursor: pointer;
  }
  .btn-back:hover { color: var(--navy); border-color: var(--navy); }

  /* fav konumu */
  .fav-slot { transform: scale(0.92); transform-origin: center; }

  /* progress bar üst çizgi */
  .progress-track {
    position: fixed; top: 0; left: 0; width: 100%; height: 3px;
    background: var(--line); z-index: 60;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 3px; }

  /* ---------------- RESPONSIVE ---------------- */
  @media (max-width: 980px) {
    .grid { grid-template-columns: 1fr; gap: 28px; }
    .rail { position: relative; top: 0; flex-direction: column-reverse; }
    .reader { padding: 32px 22px; }
    .wrap { padding: 0 16px 80px; }
  }

  @media print {
    .topbar, .rail, .reader-foot, .progress-track, .no-print { display: none !important; }
    body { background: #fff; }
    .grid { display: block; }
    .reader { border: none; box-shadow: none; padding: 0; }
    .reader::before { display: none; }
    .prose p, .highlighted-body p { color: #000; }
  }
`;

// --- HELPER FUNCTIONS ---
function slugifyType(t = "") {
  const map = {
    ç: "c", Ç: "c",
    ğ: "g", Ğ: "g",
    ı: "i", İ: "i",
    ö: "o", Ö: "o",
    ş: "s", Ş: "s",
    ü: "u", Ü: "u",
  };

  return String(t || "")
    .replace(/[·.]/g, " ")
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (m) => map[m] || m)
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase() || "mahkeme";
}

function codeToSegment(code = "") {
  const s = String(code || "").replace(/\s+/g, " ").trim();
  const m = s.match(/(\d{4})[\/\-]([0-9A-Za-z\-()\/]+)\s*E.*?(\d{4})[\/\-]([0-9A-Za-z\-()\/]+)\s*K/i);

  if (!m) {
    return s.replace(/[^0-9A-Za-z/_\-()]/g, "").replace(/\//g, "-") || "code";
  }

  const eYear = m[1];
  const eNo = m[2].replace(/\//g, "-");
  const kYear = m[3];
  const kNo = m[4].replace(/\//g, "-");

  return `${eYear}-${eNo}E_${kYear}-${kNo}K`;
}

function segmentToCode(seg = "") {
  const m = String(seg || "").match(/^(\d{4})-([0-9A-Za-z\-()\/]+)E_(\d{4})-([0-9A-Za-z\-()\/]+)K$/i);
  return m ? `${m[1]}/${m[2]} E. ${m[3]}/${m[4]} K.` : "";
}

function buildKararIdFromRecord(k) {
  const type = (k?.type || "").trim();
  const code = (k?.code || "").trim();

  if (type && code) {
    return `${slugifyType(type)}__${codeToSegment(code)}`;
  }

  return (k?.fileName || "").replace(/\.txt$/i, "") || "";
}

function parseParamsId(paramsId = "") {
  const id = String(paramsId || "");
  if (id.includes("__")) {
    const [typeSeg, codeSeg] = id.split("__");
    return { typeSeg, code: segmentToCode(codeSeg), mode: "type+code" };
  }
  return { fileNameBase: id, mode: "filename" };
}

/* ============================================================
   TEK NOKTADAN VERİ ÇEKME — React cache()
   Aynı istek içinde generateMetadata + sayfa bileşeni bu fonksiyonu
   çağırır; cache() sayesinde DB'ye SADECE 1 KEZ gidilir.
   Strateji: önce indeksli exact-match (code = ...), bulunamazsa
   son çare olarak yavaş "contains" taraması.
   ============================================================ */
const getKararBySlug = cache(async (kararSlug) => {
  const parsed = parseParamsId(kararSlug);
  let karar = null;

  if (parsed.mode === "type+code" && parsed.code) {
    const rawTypeSeg = String(parsed.typeSeg || "").trim();
    const tBase = rawTypeSeg.replace(/-/g, " ").replace(/\./g, "").trim();

    // 1) İNDEKSLİ exact-match (en hızlı yol — full scan YOK)
    karar = await prisma.karar.findFirst({
      where: {
        code: parsed.code,
        ...(tBase ? { type: { contains: tBase, mode: "insensitive" } } : {}),
      },
    });

    // 2) Tip eşleşmesi tutmadıysa sadece kod ile exact-match
    if (!karar) {
      karar = await prisma.karar.findFirst({ where: { code: parsed.code } });
    }

    // 3) SON ÇARE: yavaş contains taraması (format farklıysa).
    //    code üzerinde indeks olsa bile contains seq-scan yapar; bu yüzden
    //    yalnızca ilk iki exact-match başarısız olduğunda çalışır.
    if (!karar) {
      const m = parsed.code.match(/(\d{4})\/([0-9A-Za-z\-()\/]+)\s*E.*?(\d{4})\/([0-9A-Za-z\-()\/]+)/i);
      if (m) {
        const [, eYear, eNo, kYear, kNo] = m;
        karar = await prisma.karar.findFirst({
          where: {
            AND: [
              { code: { contains: `${eYear}/${eNo}` } },
              { code: { contains: `${kYear}/${kNo}` } },
            ],
          },
        });
      }
    }
  }

  // filename modu — fileName üzerinde unique indeks olmalı (hızlı)
  if (!karar && parsed.mode === "filename") {
    karar = await prisma.karar.findUnique({ where: { fileName: `${parsed.fileNameBase}.txt` } });
  }
  if (!karar && kararSlug && parsed.mode !== "filename") {
    karar = await prisma.karar.findUnique({ where: { fileName: `${kararSlug}.txt` } });
  }

  return { karar, parsed };
});

export async function generateMetadata({ params }) {
  // cache() sayesinde sayfa bileşeniyle AYNI sorguyu paylaşır — ekstra DB yükü yok
  const { karar } = await getKararBySlug(params.id);

  const canonical = `https://consultohukuk.com/kararlar/${params.id}`;

  if (!karar) {
    return {
      title: "Yargıtay Kararı | Consülto Hukuk",
      alternates: { canonical },
      robots: { index: true, follow: true },
    };
  }

  const type = (karar.type || "Yargıtay Kararı").trim();
  const code = (karar.code || "").trim();

  // AI özetinin ilk anlamlı cümlesini description'a koy — her sayfada FARKLI olur
  const summaryClean = (karar.aiSummary || "")
    .replace(/\*\*/g, "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const description = summaryClean
    ? `${type} ${code} sayılı karar. ${summaryClean}`.slice(0, 155)
    : `${type} ${code} — Yargıtay kararının tam metni, yapay zekâ özeti ve emsal değerlendirmesi Consülto'da.`;

  const title = `${type} ${code} – Yargıtay Kararı | Consülto`;

  const kw = typeof karar.keywords === "string"
    ? karar.keywords.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    title,
    description,
    keywords: kw,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      locale: "tr_TR",
      url: canonical,
      siteName: "Consülto",
      title,
      description,
      publishedTime: karar.createdAt,
    },
    twitter: { card: "summary", title, description },
  };
}
export async function generateStaticParams() { return []; }

// --- UI HELPERS ---
const renderAiSummary = (txt) => {
  const lines = (txt || "").split(/\r?\n/).filter((line) => line.trim() !== '');

  return lines.map((line, i) => {
    const cleanLine = line.replace(/\*\*/g, '').trim();
    const lower = cleanLine.toLowerCase();

    if (lower.startsWith("gerekçe ve sonuç") || lower.startsWith("uyuşmazlık") || lower.startsWith("konu")) {
      const parts = cleanLine.split(':');
      const title = parts[0] + (parts.length > 1 ? ':' : '');
      const content = parts.length > 1 ? parts.slice(1).join(':').trim() : '';

      return (
        <div key={i} className="ai-block">
          <div className="ai-heading">{title}</div>
          {content && <p className="ai-text">{content}</p>}
        </div>
      );
    }

    return (
      <div key={i} className="ai-loose">
        <p className="ai-text">{cleanLine}</p>
      </div>
    );
  });
};

// --- PAGE COMPONENT ---
export default async function KararDetayPage({ params }) {
  const { id: kararSlug } = params;

  // cache() ile generateMetadata'nın çektiği kayıt yeniden kullanılır — TEK sorgu
  const { karar, parsed } = await getKararBySlug(kararSlug);
  if (!karar) notFound();

  if (parsed.mode === "filename" && karar?.type && karar?.code) {
    const canonicalId = buildKararIdFromRecord(karar);
    if (canonicalId && canonicalId !== kararSlug) redirect(`/kararlar/${canonicalId}`);
  }

  const type = karar.type || 'Başlık Yok';
  const code = karar.code || 'Dosya No Yok';
  const aiSummary = karar.aiSummary || 'Analiz verisi bulunamadı.';
  const keywordsFromKarar = typeof karar.keywords === 'string'
    ? karar.keywords.split(',').map((kw) => kw.trim()).filter(Boolean)
    : [];

  // Önceki/sonraki — iki ayrı sorgu yerine tek sorgu + uygulama tarafında ayır.
  // (createdAt üzerinde indeks olmalı; aşağıdaki öneriye bakın.)
  const [prevKarar, nextKarar] = await Promise.all([
    prisma.karar.findFirst({
      where: { createdAt: { lt: karar.createdAt } },
      orderBy: { createdAt: 'desc' },
      select: { fileName: true, type: true, code: true },
    }),
    prisma.karar.findFirst({
      where: { createdAt: { gt: karar.createdAt } },
      orderBy: { createdAt: 'asc' },
      select: { fileName: true, type: true, code: true },
    }),
  ]);
  const prevId = prevKarar ? buildKararIdFromRecord(prevKarar) : null;
  const nextId = nextKarar ? buildKararIdFromRecord(nextKarar) : null;

  const courtLabel = type.includes("Genel") ? "Hukuk Genel Kurulu" : "Yargıtay";

  return (
    <main className="grain clean-numerals min-h-screen">

      <Suspense fallback={null}>
        <div className="progress-track">
          <ScrollProgressBar />
        </div>
      </Suspense>

      <div className="wrap">

        {/* ÜST ŞERİT */}
        <header className="topbar no-print">
          <Link href="/kararlar" className="brand">
            <span className="brand-mark">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </span>
            <span>
              <span className="brand-name">Karar Arşivi</span>
              <span className="brand-sub">Yargıtay İçtihat Veritabanı</span>
            </span>
          </Link>

          <nav className="pager">
            {prevId ? <Link href={`/kararlar/${prevId}`}>← Önceki</Link> : <span className="off">← Önceki</span>}
            {nextId ? <Link href={`/kararlar/${nextId}`}>Sonraki →</Link> : <span className="off">Sonraki →</span>}
          </nav>
        </header>

        {/* BAŞLIK BLOĞU */}
        <div className="doc-head">
          <span className="court-pill">
            <span className="dot" />
            {courtLabel}
          </span>
          <h1 className="doc-title">{type}</h1>
          <div className="doc-meta">
            <span><span className="k">Dosya</span><span className="code">{code}</span></span>
          </div>
        </div>

        {/* İKİ KOLON */}
        <div className="grid">

          {/* OKUMA KOLONU */}
          <article className="reader">
            <div className="prose lead-cap">
              <div className="highlighted-body">
                <HighlightedKararBody fullContent={karar.content || ""} />
              </div>
            </div>

            <div className="reader-foot">
              <span className="rule" />
              <span className="sym">§</span>
              <span className="rule" />
            </div>
          </article>

          {/* YAN RAY */}
          <aside className="rail no-print">

            {/* Eylemler + Favori */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  İşlemler
                </span>
                <div className="fav-slot">
                  <FavoriteButton itemId={karar.id} itemType="karar" />
                </div>
              </div>
              <div className="panel-body actions">
                <BackButton className="btn-back">← Geri Dön</BackButton>
                <DownloadPDFButton karar={{
                  type: type,
                  code: code,
                  content: karar.content,
                  keywords: keywordsFromKarar,
                }} />
              </div>
            </div>

            {/* AI ÖZETİ */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Yapay Zekâ Özeti
                </span>
              </div>
              <div className="panel-body">
                <div className="ai-body">
                  {renderAiSummary(aiSummary)}
                </div>
              </div>
            </div>

            {/* ETİKETLER */}
            {keywordsFromKarar.length > 0 && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 11V6a3 3 0 013-3z" /></svg>
                    Etiketler
                  </span>
                </div>
                <div className="panel-body">
                  <div className="tags">
                    {keywordsFromKarar.map((kw, i) => (
                      <span key={i} className="tag">{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </aside>
        </div>
      </div>

      {/* --- STRUCTURED DATA (SEO) — değiştirilmedi --- */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LegalCase",
            name: `${type} ${code}`,
            identifier: code,
            datePublished: karar.createdAt,
            text: (karar.content || "").slice(0, 5000),
            publisher: {
              "@type": "Organization",
              name: "Consulto Hukuk",
              url: "https://consultohukuk.com",
            },
            url: `https://consultohukuk.com/kararlar/${kararSlug}`,
          }),
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
    </main>
  );
}

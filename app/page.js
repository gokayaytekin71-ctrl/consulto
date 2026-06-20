
import Link from "next/link";
import prisma from "@/lib/prisma";
import Script from "next/script";
import dynamic from "next/dynamic";
import DecisionCard from "@/components/DecisionCard";

import { getAllPosts } from "@/lib/blog";

const HomeWorkspace = dynamic(() => import("@/components/HomeWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center bg-slate-50 text-slate-400">
      <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
      </svg>
    </div>
  ),
});

const SITE_URL = "https://consultohukuk.com";
const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Consülto",
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Consülto",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      inLanguage: "tr-TR",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/akilli-arama?kw={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "Consülto",
      applicationCategory: "LegalTechApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description:
        "Hukukçular için yapay zeka destekli Yargıtay karar arama, dilekçe hazırlama, hukuki araştırma, dosya analizi ve hesaplama araçları platformu.",
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/paketler-ucretler`,
        priceCurrency: "TRY",
      },
    },
  ],
};

export const runtime = "nodejs";
// Anasayfa kullanıcıya/session'a özel veri içermiyor (gündem, öne çıkan
// kararlar, makaleler, blog — herkese aynı). force-dynamic her istekte
// DB'ye gidip sıfırdan render ediyordu; ISR ile sayfa 60 saniyede bir
// arka planda yenileniyor, ziyaretçiler cache'den anında alıyor.
export const revalidate = 60;
 
/* =============================================================================
   ÜRÜN MOCKUP — hero sağ kolonu (server component, saf HTML/CSS)
   ============================================================================= */
function ProductMockup() {
  return (
    <div className="relative">
      {/* arka ışık */}
      <div className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-blue-500/20 via-cyan-300/12 to-violet-400/18 blur-3xl" />

      {/* Canlı Demo etiketi — üst sol */}
      <div className="absolute -top-4 left-5 z-10 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3.5 py-1.5 shadow-[0_4px_16px_rgba(37,99,235,0.40)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white">Hukuk AI Chat</span>
      </div>

      {/* Yanıt süresi — sağ üst */}
      <div className="absolute -top-4 -right-4 z-10 flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3.5 py-2 shadow-[0_8px_24px_-4px_rgba(2,42,92,0.18)]">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-base">⚡</span>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Yanıt süresi</div>
          <div className="text-sm font-black text-slate-800">53 sn</div>
        </div>
      </div>

      {/* kart */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_32px_80px_-20px_rgba(2,42,92,0.30),0_0_0_1px_rgba(37,99,235,0.06)]">

        {/* tarayıcı chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="ml-3 flex flex-1 items-center gap-1.5 rounded-md border border-slate-100 bg-white px-3 py-1 shadow-sm">
            <svg className="h-2.5 w-2.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-[11px] text-slate-400">consultohukuk.com/calisma-alani</span>
          </div>
        </div>

        {/* sohbet alanı */}
        <div className="space-y-3.5 overflow-hidden p-4">

          {/* dosya chip */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-3 py-2 shadow-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-50">
              <svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-700">Kira Sözleşmesi.pdf</span>
            <span className="text-xs text-slate-400">· Analiz edildi</span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">✓</span>
          </div>

          {/* kullanıcı mesajı */}
          <div className="flex justify-end">
            <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)]">
              Kira sözleşmesinde kiralayan lehine olan unsurlar neler?
            </div>
          </div>

          {/* AI yanıtı — workspace chat stili */}
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-[12px] leading-6 text-slate-800 shadow-sm">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Sayın Avukat, kiralayan lehine öne çıkan hukuki argümanlar:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                <span className="text-slate-600">Sözleşmenin özel şartlarında yer alan uzama hükmü geçersizdir.TBK m. 347’nin emredici düzenlemesine aykırı olacak şekilde yorumlanamaz. Bu nedenle sözleşme kanun gereği ancak 1 yıl süreyle uzamış sayılır.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Sözleşmede kiralayanın yazılı izni olmaksızın tadilat yapılamayacağı düzenlenmiş olup, kiracının müdahaleleri sözleşmeye aykırıdır.</span>
              </li>
            </ul>

            {/* emsal karar kartı */}
            <div className="mt-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-700 to-blue-500 text-[9px] font-black text-white shadow-sm">YG</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Emsal Karar</span>
                    <span className="rounded-full bg-blue-100 px-1.5 py-px text-[9px] font-bold text-blue-700">5. Hukuk Dairesi</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">Yargıtay · 2023/150 Esas 2024/100 K.</div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-400">&ldquo;TBK m. 347'nin emredici niteliği gözetildiğinde...&rdquo;</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* input bar */}
        <div className="border-t border-slate-100 bg-gradient-to-r from-slate-50/60 to-white px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="flex-1 text-sm text-slate-400">Hukuki soru sorun…</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-sm">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Dilekçe hazırlandı — sol alt */}
      <div className="absolute -bottom-5 left-4 flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-[0_8px_24px_-4px_rgba(2,42,92,0.16)]">
        <span className="flex h-2 w-2">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-sm font-bold text-slate-700">Dilekçe hazırlandı</span>
      </div>
    </div>
  );
}

/* =============================================================================
   GLOBAL STİL — Açık / sinematik aydınlık tema (server-safe)
   ============================================================================= */
function ThemeStyles() {
  const css = `
    @keyframes floaty      { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-16px) } }
    @keyframes auroraA     { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(80px,-50px) scale(1.18) } }
    @keyframes auroraB     { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(-70px,60px) scale(1.25) } }
    @keyframes auroraC     { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(50px,40px) scale(0.85) } }
    @keyframes shineMove   { to { background-position: 200% center } }
    @keyframes marqueeX    { to { transform: translateX(-50%) } }
    @keyframes fadeUp      { from { opacity:0; transform: translateY(20px) } to { opacity:1; transform: translateY(0) } }
    @keyframes glowPulse   { 0%,100% { opacity:.4 } 50% { opacity:.8 } }

    .aurora-a { animation: auroraA 20s ease-in-out infinite; }
    .aurora-b { animation: auroraB 26s ease-in-out infinite; }
    .aurora-c { animation: auroraC 30s ease-in-out infinite; }
    .float-y  { animation: floaty 6s ease-in-out infinite; }
    .glow-pulse { animation: glowPulse 4s ease-in-out infinite; }
    .anim-up  { animation: fadeUp .9s cubic-bezier(.22,1,.36,1) both; }

    @media (prefers-reduced-motion: reduce) {
      .aurora-a, .aurora-b, .aurora-c, .float-y, .glow-pulse, .anim-up, .ticker-track { animation: none !important; }
    }
 
    .text-shine {
      background: linear-gradient(110deg,#0f172a 8%,#2563eb 32%,#06b6d4 48%,#7c3aed 64%,#0f172a 92%);
      background-size: 220% auto;
      -webkit-background-clip: text; background-clip: text; color: transparent;
      animation: shineMove 7s 1.5s linear infinite both;
    }
 
    .ticker-track { animation: marqueeX 40s linear infinite; }
    .ticker-track:hover { animation-play-state: paused; }
 
    /* gradient hairline border via mask (açık tema) */
    .grad-border { position: relative; }
    .grad-border::before {
      content:""; position:absolute; inset:0; border-radius: inherit; padding:1px;
      background: linear-gradient(135deg, rgba(2,6,23,0.12), rgba(2,6,23,0.02) 60%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      pointer-events:none; transition: background .45s ease;
    }
    .grad-border:hover::before {
      background: linear-gradient(135deg, rgba(37,99,235,.75), rgba(6,182,212,.55) 50%, rgba(124,58,237,.65));
    }
    .grad-border-on::before {
      background: linear-gradient(135deg, rgba(37,99,235,.55), rgba(6,182,212,.4) 50%, rgba(124,58,237,.5));
    }
 
    .dot-grid {
      background-image: radial-gradient(rgba(2,6,23,0.10) 1px, transparent 1px);
      background-size: 22px 22px;
    }
    .hide-scrollbar::-webkit-scrollbar { display:none; }
    .hide-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
 
/* =============================================================================
   ARAÇ KARTI — açık varyant
   ============================================================================= */
function ToolCard({ href, title, subtitle, icon }) {
  return (
    <Link
      href={href}
      className="grad-border group relative flex items-center gap-4 rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:bg-white hover:-translate-y-1.5 hover:shadow-[0_24px_55px_-22px_rgba(6,182,212,0.45)]"
    >
      <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-cyan-500 group-hover:text-white group-hover:scale-110">
        {icon}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="font-bold text-slate-800 leading-tight">{title}</div>
        {subtitle && <div className="mt-0.5 text-xs font-medium text-slate-400 line-clamp-1">{subtitle}</div>}
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 -translate-x-2 text-cyan-500 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
 
/* =============================================================================
   BÖLÜM BAŞLIĞI — açık
   ============================================================================= */
function SectionHeading({ kicker, title, accent, desc, action }) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker && (
          <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">
            <span className="h-px w-7 bg-gradient-to-r from-blue-500 to-transparent" />
            {kicker}
          </div>
        )}
        <h2 className="text-3xl font-black tracking-tight text-[#002a5c] md:text-4xl">
          {title} {accent && <span className="text-shine">{accent}</span>}
        </h2>
        {desc && <p className="mt-3 max-w-xl font-medium text-slate-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}
 
/* =============================================================================
   VERİ ÇEKME
   ============================================================================= */
async function getGundemItems() {
  try {
    return await prisma.gundem.findMany({ orderBy: { createdAt: 'desc' }, take: 8 });
  } catch (error) { return []; }
}
 
async function getFeaturedDecisions() {
  try {
    const featuredSlugs = [
      "Hukuk_Genel_Kurulu_2020-603E_2024-224K",
      "Hukuk_Genel_Kurulu_2022-1099E_2024-355K",
      "Hukuk_Genel_Kurulu_2022-1241E_2024-9K",
      "Hukuk_Genel_Kurulu_2014-1026E_2015-1765K"
    ];
    const featured = await prisma.Karar.findMany({
      where: { fileName: { in: featuredSlugs.map(s => `${s}.txt`) } },
      select: { id: true, fileName: true, type: true, code: true, aiSummary: true, keywords: true, contentLength: true }
    });
    const ordered = featuredSlugs
      .map(slug => featured.find(k => k.fileName === `${slug}.txt`))
      .filter(Boolean);
    return ordered.map(k => ({
      id: k.fileName.replace(/\.txt$/, ""),
      type: k.type || "Yargıtay Kararı",
      code: k.code || "",
      aiSummary: k.aiSummary || "",
      keywords: k.keywords || "",
      contentLength: k.contentLength || 0
    }));
  } catch (error) { return []; }
}
 
/* =============================================================================
   ANA SAYFA
   ============================================================================= */
export default async function Home() {
  const [gundemItems, recentDecisions] = await Promise.all([
    getGundemItems(),
    getFeaturedDecisions()
  ]);
 
  let makaleler = [];
  try {
    makaleler = await prisma.makale.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  } catch (error) {
    console.error("Ana sayfa makale sorgusu başarısız:", error);
  }

  const blogPosts = getAllPosts().slice(0, 3); // en yeni 3 yazı (MDX, senkron)
 
  const gundemTexts = (gundemItems || [])
    .map((g) => g?.baslik ?? g?.title ?? g?.text ?? g?.content ?? "")
    .filter((t) => typeof t === "string" && t.trim().length > 0);
 
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#F6F9FC] text-slate-700 antialiased selection:bg-cyan-100 selection:text-cyan-900">
      <ThemeStyles />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
 
      {/* ===== GLOBAL ARKA PLAN ===== */}
      <div className="pointer-events-none fixed inset-0 -z-50" style={{ contain: "strict" }}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:46px_46px]" />
        <div className="aurora-a absolute -top-32 left-[-10%] h-[420px] w-[420px] rounded-full bg-gradient-to-br from-blue-400/25 to-cyan-300/25 blur-[80px]" />
        <div className="aurora-b absolute top-[30%] right-[-12%] h-[380px] w-[380px] rounded-full bg-gradient-to-br from-violet-400/20 to-fuchsia-300/15 blur-[80px]" />
        <div className="aurora-c absolute bottom-[-10%] left-[25%] h-[380px] w-[380px] rounded-full bg-gradient-to-br from-cyan-300/20 to-emerald-300/15 blur-[80px]" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
      </div>
 
      {/* ===== PROMO STRIP ===== */}
      <div className="relative z-10 border-b border-slate-200/60 bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-center text-[12px] font-semibold text-slate-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Sınırsız paketlerde <span className="font-black text-blue-600">Dev İndirim</span> — 6 aylık paket yalnızca <span className="font-black text-[#002a5c]">4.750 TL</span>
          <Link href="/paketler-ucretler" className="ml-1 hidden rounded-full bg-[#002a5c] px-3 py-0.5 text-[11px] font-bold text-white transition hover:bg-blue-700 sm:inline-block">İncele →</Link>
        </div>
      </div>
 
      {/* =====================================================================
          1. HERO — split: sol metin + arama inputu, sağ ürün mockupu
         ===================================================================== */}
      <section className="relative isolate px-4 pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="pointer-events-none absolute left-1/3 top-0 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.18),transparent_65%)] blur-2xl" />

        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_460px] lg:gap-16">

            {/* ---- SOL KOLON ---- */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-slate-200/70 bg-white/90 px-4 py-2 shadow-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400">
                  <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                <span className="text-xs font-bold tracking-wide text-slate-600">Milyonlarca Yargıtay kararıyla eğitildi</span>
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tighter text-[#002a5c] sm:text-5xl lg:text-6xl">
                Hukukçular İçin<br />
                <span className="text-blue-600">Yapay Zeka Destekli</span><br />
                Araştırma ve Dilekçe<br className="hidden sm:block" /> Asistanı
              </h1>

              <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-slate-500">
                Hukuk Chat'e istediğin hukuki soruyu sor, Uyuşmazlıkla ilgili Yargıtay Kararı arattır, dilekçe yazdır.{" "}
                <span className="font-bold text-slate-700">En ucuza en iyi hukuk yapay zekası.</span>
              </p>

              {/* CTA butonları */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/calisma-alani"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_28px_-6px_rgba(37,99,235,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-6px_rgba(37,99,235,0.65)]"
                >
                  Hukuk Chat
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/dilekce"
                  className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  Dilekçe Hazırla
                </Link>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                <span className="font-bold text-emerald-600">2 token ücretsiz</span> · Hemen Dene · Yapay Zeka Avukat Uygulaması ·
              </p>

              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  { val: "7M+", label: "Yargıtay Kararı", cls: "text-cyan-600" },
                  { val: "6",   label: "Çalışma Modu",    cls: "text-blue-600" },
                  { val: "2 dk", label: "Dilekçe Süresi", cls: "text-violet-600" },
                  { val: "∞",   label: "Hukuki Sohbet",   cls: "text-emerald-600" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className={`text-2xl font-black ${s.cls}`}>{s.val}</div>
                    <div className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ---- SAĞ KOLON: ürün mockupu ---- */}
            <div className="hidden lg:block">
              <ProductMockup />
            </div>
          </div>
        </div>

        {/* gündem ticker — tam genişlik */}
        {gundemTexts.length > 0 && (
          <div className="mx-auto mt-14 max-w-6xl overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 shadow-sm">
            <div className="flex items-center">
              <div className="flex flex-shrink-0 items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                Gündem
              </div>
              <div className="relative flex-1 overflow-hidden">
                <div className="ticker-track flex w-max gap-10 whitespace-nowrap py-3 pl-6 text-sm font-medium text-slate-500">
                  {[...gundemTexts, ...gundemTexts].map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-2"><span className="text-cyan-500">◆</span>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
 
      {/* =====================================================================
          2. CANLI ÜRÜN GÖSTERİMİ — HomeWorkspace, parlayan monitör içinde
         ===================================================================== */}
      <section id="canli-demo" className="relative scroll-mt-24 px-4 pb-8 md:pb-14">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-700">Canlı Demo · Gerçek Arayüz</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[#002a5c] md:text-5xl">
            Anlatmıyoruz, <span className="text-shine">gösteriyoruz</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-medium text-slate-500 md:text-lg">
            Aşağıdaki ekran demo değil — uygulamanın ta kendisi. İlk kez deneyenlere tur otomatik başlar.
          </p>
        </div>
 
        {/* parlayan çerçeve */}
        <div className="relative mx-auto max-w-7xl">
          <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.28),transparent_60%)] blur-2xl" />
          <div className="grad-border grad-border-on overflow-hidden rounded-[2rem] bg-white shadow-[0_50px_120px_-35px_rgba(2,42,92,0.45)]">
            {/* tarayıcı üst barı */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <div className="ml-3 flex flex-1 items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
                  <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  consultohukuk.com/calisma-alani
                </div>
              </div>
            </div>
            {/* uygulama (açık tema) */}
            <div className="bg-white text-slate-800">
              <HomeWorkspace />
            </div>
          </div>
        </div>
      </section>
 
      {/* =====================================================================
          3. NASIL ÇALIŞIR — 3 adım
         ===================================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <SectionHeading kicker="Üç Adımda" title="Dosyadan stratejiye," accent="dakikalar içinde" desc="Kurulum yok, öğrenme eğrisi yok. Yükle, sor, kazan." />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Dosyanı Yükle", d: "İddianame, dilekçe, bilirkişi raporu… Belgen AI tarafından profillenir; vakıalar, riskler ve anahtar kelimeler çıkarılır.", icon: "M12 16v-8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2", grad: "from-blue-500 to-cyan-400", glow: "bg-blue-500" },
            { n: "02", t: "Sor & Analiz Et", d: "6 çalışma modundan birini seç. Consülto dosyanı ve ilgili Yargıtay kararlarını birlikte değerlendirip yanıt üretir.", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z", grad: "from-violet-500 to-fuchsia-400", glow: "bg-violet-500" },
            { n: "03", t: "Dilekçeni Al", d: "Emsallerle desteklenen dilekçe, delil yol haritası ve strateji notları çalışma alanında toplanır. İndir, kullan.", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", grad: "from-amber-500 to-orange-400", glow: "bg-amber-500" },
          ].map((s) => (
            <div key={s.n} className="grad-border group relative overflow-hidden rounded-3xl bg-white/70 p-8 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:bg-white">
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${s.glow} opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-25`} />
              <div className="flex items-center justify-between">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.grad} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
                </div>
                <span className="text-5xl font-black text-[#002a5c]/10">{s.n}</span>
              </div>
              <h3 className="mt-6 text-xl font-black text-[#002a5c]">{s.t}</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
 
      {/* =====================================================================
          4. İKİ ASİSTAN — split paneller
         ===================================================================== */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <SectionHeading kicker="İki Güçlü Asistan" title="İşini nasıl" accent="kolaylaştıralım?" />
        <div className="grid gap-6 lg:grid-cols-2">
          {/* DİLEKÇE PRO */}
          <Link href="/dilekce" className="grad-border group relative min-h-[300px] overflow-hidden rounded-[2rem] bg-white/70 p-9 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_40px_90px_-30px_rgba(59,130,246,0.45)]">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-400/20 blur-[80px] transition-all duration-500 group-hover:bg-blue-400/35" />
            <div className="dot-grid absolute inset-0 opacity-[0.04]" />
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-3xl shadow-lg shadow-blue-500/30 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">✍️</div>
              <h3 className="mt-6 text-3xl font-black text-[#002a5c] transition-colors group-hover:text-blue-600">Dilekçe Pro</h3>
              <p className="mt-3 max-w-md text-base font-medium leading-relaxed text-slate-500">
                Sen olayları özetle; emsal kararlarla desteklenen <span className="font-bold text-slate-700">Açıklama</span>, güçlü <span className="font-bold text-slate-700">Deliller</span> ve hak kaybını önleyen <span className="font-bold text-slate-700">Sonuç &amp; İstem</span> bölümleri saniyeler içinde hazır.
              </p>
              <span className="mt-7 inline-flex items-center gap-2 font-bold text-blue-600 transition-all group-hover:gap-3.5">Oluşturmaya Başla <span className="text-xl">→</span></span>
            </div>
          </Link>
 
          {/* ANALİZ PRO */}
          <Link href="/bot" className="grad-border group relative min-h-[300px] overflow-hidden rounded-[2rem] bg-white/70 p-9 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_40px_90px_-30px_rgba(245,158,11,0.4)]">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-orange-400/20 blur-[80px] transition-all duration-500 group-hover:bg-orange-400/35" />
            <div className="dot-grid absolute inset-0 opacity-[0.04]" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-3xl shadow-lg shadow-orange-500/30 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">🧠</div>
                <span className="rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">Tokenli Sistem</span>
              </div>
              <h3 className="mt-6 text-3xl font-black text-[#002a5c] transition-colors group-hover:text-orange-600">Analiz Pro</h3>
              <p className="mt-3 max-w-md text-base font-medium leading-relaxed text-slate-500">
                Uyuşmazlığını kısaca anlat; olası riskler, muhtemel senaryolar ve <span className="font-bold text-slate-700">emsal Yargıtay kararları</span> ışığında stratejini netleştir, doğru adımı at.
              </p>
              <span className="mt-7 inline-flex items-center gap-2 font-bold text-orange-600 transition-all group-hover:gap-3.5">Analize Başla <span className="text-xl">→</span></span>
            </div>
          </Link>
        </div>
 
        {/* fiyat şeridi */}
        <div className="grad-border mt-6 flex flex-col items-center justify-between gap-6 rounded-3xl bg-white/70 p-7 shadow-sm backdrop-blur md:flex-row">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="relative text-lg font-bold text-red-400">
                <span className="relative z-10">₺200</span>
                <span className="absolute inset-0 top-1/2 block rotate-[-12deg] border-t-2 border-red-400" />
              </div>
              <div className="text-4xl font-black text-[#002a5c]">₺150</div>
            </div>
            <div className="text-sm">
              <div className="font-bold text-slate-700">5 Token paketiyle başla</div>
              <div className="text-slate-500">Sınırsız paketlerde <span className="font-bold text-blue-600">%70 indirim</span></div>
            </div>
          </div>
          <Link href="/paketler-ucretler" className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 font-bold text-white shadow-[0_10px_30px_-8px_rgba(34,211,238,0.5)] transition hover:-translate-y-1">
            Tüm Paketleri Gör →
          </Link>
        </div>
      </section>
 
      {/* =====================================================================
          5. KOMUTA MERKEZİ — tile'lar
         ===================================================================== */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <SectionHeading kicker="Çalışma Alanın" title="Komuta" accent="Merkezi" desc="Tüm dosyaların, kararların ve notların tek bir yerde." />
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {[
            { title: "Favori Kararlarım", href: "/profilim/favori-kararlar", grad: "from-blue-500 to-indigo-500", glow: "bg-blue-500", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", desc: "İşaretlediğin emsaller" },
            { title: "Kütüphanem", href: "/profilim/favori-makaleler", grad: "from-teal-400 to-cyan-500", glow: "bg-cyan-500", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25", desc: "Kaydettiğin makaleler" },
            { title: "Ajandam", href: "/profilim/gorevlerim", grad: "from-violet-500 to-fuchsia-500", glow: "bg-violet-500", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", desc: "Duruşma ve görevler" },
            { title: "Notlarım", href: "/profilim/notlarim", grad: "from-amber-400 to-orange-500", glow: "bg-amber-500", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", desc: "Not ve şablonların" },
          ].map((item) => (
            <Link key={item.title} href={item.href} className="grad-border group relative h-44 overflow-hidden rounded-3xl bg-white/70 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:bg-white">
              <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${item.glow} opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-30 group-hover:scale-125`} />
              <div className="relative flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.grad} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                </div>
                <div>
                  <div className="font-bold text-[#002a5c]">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
 
      {/* =====================================================================
          6. HESAPLAMA ARAÇLARI
         ===================================================================== */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <SectionHeading
          kicker="Profesyonel Çözümler"
          title="Hesaplama" accent="Araçları"
          desc="Mevzuata uygun hesaplamalar, saniyeler içinde."
          action={
            <Link href="/araclar" className="grad-border flex items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-sm font-bold text-blue-600 shadow-sm backdrop-blur transition hover:bg-white">
              Tüm Araçları Gör
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ToolCard href="/araclar/arac-deger-kaybi" title="Araç Değer Kaybı" subtitle="Sigorta Tahkim Uyumlu" icon={<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>} />
          <ToolCard href="/araclar/yaralanmali-trafik-kazasi" title="Yaralanmalı Kaza" subtitle="Tazminat Hesabı" icon={<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 0 .3" /><path d="M8 9h2" /><rect x="3" y="14" width="18" height="8" rx="2" /><path d="M12 14v8" /><path d="M3 18h18" /></svg>} />
          <ToolCard href="/araclar/destekten-yoksun-kalma" title="Destekten Yoksun" subtitle="Aktüeryal Hesap" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
          <ToolCard href="/araclar/kidem-tazminati" title="Kıdem Tazminatı" subtitle="İşçilik Alacakları" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
          <ToolCard href="/araclar/infaz-hesaplama" title="İnfaz Hesaplama" subtitle="Yatar Hesabı" icon={<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>} />
          <ToolCard href="/araclar/vekalet-ucreti-hesaplama" title="Vekâlet Ücreti" subtitle="AAÜT 2025-2026" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
          <ToolCard href="/araclar/faiz-hesaplama" title="Faiz Hesaplama" subtitle="Yasal ve Ticari" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>} />
          <ToolCard href="/araclar/islah-harci-hesaplama" title="Islah Harcı" subtitle="Dava Harçları" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19.5 10.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>} />
        </div>
      </section>
 {/* =====================================================================
          6.5 BLOG — Son yazılar
         ===================================================================== */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <SectionHeading
          kicker="Consülto Blog"
          title="Hukukun pratiğine dair"
          accent="rehberler"
          desc="Yargıtay içtihatları, dilekçe stratejileri ve tazminat hesaplamaları üzerine uygulamaya dönük yazılar."
          action={
            <Link href="/blog" className="grad-border flex items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-sm font-bold text-blue-600 shadow-sm backdrop-blur transition hover:bg-white">
              Tüm Yazıları Gör
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          }
        />

        {blogPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="grad-border group relative flex flex-col overflow-hidden rounded-3xl bg-white/70 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_30px_70px_-30px_rgba(37,99,235,0.4)]"
              >
                {/* kapak */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#0f2a4a] to-[#163a63]">
                  {post.cover ? (
                    <img src={post.cover} alt={post.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center font-serif text-6xl font-black text-amber-300/30">§</span>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 backdrop-blur">
                    {post.category}
                  </span>
                </div>

                {/* gövde */}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-black leading-snug text-[#002a5c] transition-colors group-hover:text-blue-600 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-slate-500 line-clamp-2">
                    {post.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-medium text-slate-400">
                    <span>{new Date(post.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>{post.readingTime.text}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grad-border rounded-3xl bg-white/70 p-10 text-center shadow-sm backdrop-blur">
            <p className="font-medium text-slate-500">Yakında ilk yazılar burada olacak.</p>
          </div>
        )}
      </section>


      {/* =====================================================================
          7. ÖNE ÇIKAN EMSALLER
         ===================================================================== */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">
              <span className="h-px w-7 bg-gradient-to-r from-blue-500 to-transparent" />
              Editörden Seçme
            </div>
            <h2 className="text-3xl font-black tracking-tight text-[#002a5c] md:text-4xl">Öne Çıkan <span className="text-shine">Emsaller</span></h2>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {["Nitelikli İçtihatlar", "Editörden Seçme", "Öğretici İçtihatlar"].map((label) => (
                <button key={label} type="button" className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-slate-500 backdrop-blur transition-colors hover:bg-slate-100 hover:text-slate-700">{label}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button id="featuredPrev" type="button" aria-label="Öne çıkan emsallerde önceki karar" className="grad-border flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all hover:bg-[#002a5c] hover:text-white">
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button id="featuredNext" type="button" aria-label="Öne çıkan emsallerde sonraki karar" className="grad-border flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all hover:bg-[#002a5c] hover:text-white">
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
 
        <div className="relative -mx-4 px-4 md:-mx-6 md:px-6">
          <div id="featuredScroller" className="hide-scrollbar overflow-x-auto scroll-smooth pb-10 pt-2">
            <div className="flex w-max gap-6">
              {recentDecisions.map((decision) => (
                <div key={decision.id} className="w-[340px] transform transition-transform duration-300 hover:scale-[1.01]">
                  <DecisionCard {...decision} />
                </div>
              ))}
            </div>
          </div>
        </div>
 
        <Script id="featured-scroller-controls" strategy="afterInteractive">
          {`
            (function () {
              function getScroller() { return document.getElementById('featuredScroller'); }
              function step(dir) {
                var scroller = getScroller();
                if (!scroller) return;
                try { scroller.scrollBy({ left: dir * 360, behavior: 'smooth' }); } catch (e) {}
              }
              document.addEventListener('click', function (ev) {
                if (ev.target.closest('#featuredNext')) { step(1); }
                if (ev.target.closest('#featuredPrev')) { step(-1); }
              }, { passive: true });
            })();
          `}
        </Script>

        <Script id="home-demo-tour-trigger" strategy="afterInteractive">
          {`
            (function () {
              var TOUR_STORAGE_KEY = 'consulto-home-tour-seen';

              document.addEventListener('click', function (ev) {
                var trigger = ev.target.closest('[data-start-home-tour="true"]');
                if (!trigger) return;

                ev.preventDefault();

                var demo = document.getElementById('canli-demo');
                if (demo) {
                  demo.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                var alreadySeen = false;
                try {
                  alreadySeen = window.localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
                } catch (e) {}

                if (alreadySeen) return;

                window.setTimeout(function () {
                  window.dispatchEvent(new CustomEvent('consulto:start-home-tour'));
                }, 650);
              }, false);
            })();
          `}
        </Script>
      </section>
 
      {/* =====================================================================
          8. BİLGİ MERKEZİ
         ===================================================================== */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* RESMÎ GAZETE */}
          <div className="grad-border relative overflow-hidden rounded-[2rem] bg-white/70 p-8 shadow-sm backdrop-blur">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-400/15 blur-3xl" />
            <h2 className="relative z-10 mb-8 flex items-center gap-3 text-2xl font-black text-[#002a5c]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              </span>
              Resmî Gazete
            </h2>
            <div className="relative z-10 space-y-3">
              {[...Array(5)].map((_, i) => {
                const d = new Date(); d.setDate(d.getDate() - i);
                const url = `https://www.resmigazete.gov.tr/eskiler/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.pdf`;
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group/item flex items-center justify-between rounded-2xl border border-slate-100 bg-white/60 p-4 transition-all duration-300 hover:border-red-200 hover:bg-white hover:shadow-lg hover:shadow-red-500/10">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                        <span className="text-[10px] font-bold uppercase text-red-500">{d.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                        <span className="text-lg font-black leading-none text-slate-800">{d.getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 transition-colors group-hover/item:text-red-600">Resmî Gazete</h4>
                        <p className="text-xs font-medium text-slate-500">{d.toLocaleDateString('tr-TR', { weekday: 'long' })} Sayısı</p>
                      </div>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm transition-all group-hover/item:bg-red-500 group-hover/item:text-white">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
 
          {/* MAKALELER */}
          <div className="grad-border relative overflow-hidden rounded-[2rem] bg-white/70 p-8 shadow-sm backdrop-blur">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl" />
            <h2 className="relative z-10 mb-8 flex items-center gap-3 text-2xl font-black text-[#002a5c]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </span>
              Son Makaleler
            </h2>
            <div className="relative z-10 space-y-3">
              {makaleler.map((m) => (
                <Link key={m.doi} href={`https://doi.org/${m.doi}`} target="_blank" className="group/item block rounded-2xl border border-slate-100 bg-white/60 p-5 transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-500/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="mb-2 inline-block rounded bg-blue-100 px-2 py-1 text-[10px] font-bold tracking-wider text-blue-600">AKADEMİK</span>
                      <h4 className="font-bold leading-snug text-slate-800 transition-colors line-clamp-2 group-hover/item:text-blue-700">{m.baslik}</h4>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span>Hukuk Ekibi</span><span className="h-1 w-1 rounded-full bg-slate-300" /><span>2024</span>
                      </div>
                    </div>
                    <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors group-hover/item:border-blue-500 group-hover/item:text-blue-600">
                      <svg className="h-4 w-4 -rotate-45 transition-transform duration-300 group-hover/item:rotate-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
 
      {/* =====================================================================
          9. KAPANIŞ CTA
         ===================================================================== */}
      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        <div className="grad-border grad-border-on relative overflow-hidden rounded-[2.5rem] bg-white/70 px-8 py-16 text-center shadow-sm backdrop-blur md:py-20">
          <div className="absolute left-1/2 top-0 h-72 w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.28),transparent_60%)] blur-2xl" />
          <div className="dot-grid absolute inset-0 opacity-[0.05]" />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-tight text-[#002a5c] md:text-5xl">
              İlk dosyanı bugün yükle,<br /><span className="text-shine">farkı hemen gör.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl font-medium text-slate-500 md:text-lg">
              Giriş yap, 2 token ücretsiz tanımlansın ve Consülto'yu kendi dosyanda dene. Kurulum yok, taahhüt yok.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/calisma-alani" className="group w-full rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-9 py-4 text-lg font-bold text-white shadow-[0_12px_44px_-8px_rgba(34,211,238,0.6)] transition hover:-translate-y-1 sm:w-auto">
                <span className="flex items-center justify-center gap-2">Ücretsiz Başla <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
              </Link>
              <Link href="/paketler-ucretler" className="grad-border w-full rounded-2xl bg-white px-9 py-4 font-bold text-[#002a5c] shadow-sm transition hover:-translate-y-1 sm:w-auto">
                Paketleri İncele
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
 

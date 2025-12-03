import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import FavoriteButton from '@/components/FavoriteButton';
import HighlightedKararBody from '@/components/HighlightedKararBody';
import BackButton from '@/components/BackButton';
import ScrollProgressBar from '@/components/ScrollProgressBar'; // Yeni bileşeni ekledik
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- GLOBAL CSS (Server Component Uyumlu) ---
const GLOBAL_CSS = `
  /* Scrollbar */
  .custom-scrollbar::-webkit-scrollbar { width: 5px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(2, 6, 23, 0.5); }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
  
  /* Animations */
  .animate-fade-in-down { animation: fadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards; }
  
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); filter: blur(5px); }
    to { opacity: 1; transform: translateY(0); filter: blur(0); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); filter: blur(5px); }
    to { opacity: 1; transform: translateY(0); filter: blur(0); }
  }

  /* Glassmorphism */
  .glass-card {
    background: rgba(13, 18, 30, 0.75);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  }

  /* Scanner Effect */
  @keyframes scan {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
    100% { transform: translateX(100%); }
  }
  .scanner-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #38bdf8, transparent);
    animation: scan 4s ease-in-out infinite;
    opacity: 0.7;
  }

  /* Print Styles - Sadece metin basılır */
  @media print {
    body { background: white; color: black; }
    .no-print, header, aside, .glass-card { background: none !important; border: none !important; box-shadow: none !important; color: black !important; }
    .fixed, .absolute { position: static !important; }
    .print-hidden { display: none !important; }
    .prose { font-size: 12pt; line-height: 1.5; color: black !important; }
    .prose * { color: black !important; }
  }
`;

// --- DATA FETCHING ---
export async function generateMetadata({ params }) {
  const { id } = params;
  let canonicalId = id;
  try {
    const parsed = parseParamsId(id);
    let k = null;
    if (parsed.mode === "filename") {
      k = await prisma.karar.findFirst({
        where: { fileName: `${parsed.fileNameBase}.txt` },
        select: { type: true, code: true, fileName: true },
      });
    } else if (parsed.code) {
      const m = parsed.code.match(/(\d{4})\/([0-9A-Za-z-]+)\s*E.*?(\d{4})\/([0-9A-Za-z-]+)/i);
      if (m) {
        const [, eYear, eNo, kYear, kNo] = m;
        k = await prisma.karar.findFirst({
          where: {
            AND: [
              { code: { contains: `${eYear}/${eNo}` } },
              { code: { contains: `${kYear}/${kNo}` } },
            ],
          },
          select: { type: true, code: true, fileName: true },
        });
      }
    }
    if (k) {
      const bid = buildKararIdFromRecord(k);
      if (bid) canonicalId = bid;
    }
  } catch (_) {}

  const canonical = `https://www.consultohukuk.com/kararlar/${canonicalId}`;
  return { alternates: { canonical }, robots: { index: true, follow: true } };
}

function slugifyType(t = "") {
  const map = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };
  return String(t || "").replace(/[·.]/g, " ").replace(/[çÇğĞıİöÖşŞüÜ]/g, m => map[m] || m).replace(/[^a-zA-Z0-9\s-]/g, " ").trim().replace(/\s+/g, "-").replace(/-+/g, "-").toLowerCase() || "mahkeme";
}

function codeToSegment(code = "") {
  const s = String(code || "").replace(/\s+/g, " ").trim();
  const m = s.match(/(\d{4})[\/\-]([0-9A-Za-z\-]+)\s*E.*?(\d{4})[\/\-]([0-9A-Za-z\-]+)\s*K/i);
  if (!m) return s.replace(/[^0-9A-Za-z\/-]/g, "").replace(/[\/]/g, "-") || "code";
  return `${m[1]}-${m[2]}E_${m[3]}-${m[4]}K`;
}

function segmentToCode(seg = "") {
  const m = String(seg || "").match(/^(\d{4})-([0-9A-Za-z\-]+)E_(\d{4})-([0-9A-Za-z\-]+)K$/i);
  return m ? `${m[1]}/${m[2]} E. ${m[3]}/${m[4]} K.` : "";
}

function buildKararIdFromRecord(k) {
  const type = (k?.type || "").trim(); const code = (k?.code || "").trim();
  if (type && code) return `${slugifyType(type)}__${codeToSegment(code)}`;
  return (k?.fileName || "").replace(/\.txt$/i, "") || "";
}

function parseParamsId(paramsId = "") {
  const id = String(paramsId || "");
  if (id.includes("__")) { const [typeSeg, codeSeg] = id.split("__"); return { typeSeg, code: segmentToCode(codeSeg), mode: "type+code" }; }
  return { fileNameBase: id, mode: "filename" };
}

export async function generateStaticParams() {
  const kararlar = await prisma.karar.findMany({ take: 50, orderBy: { createdAt: 'desc' }, select: { fileName: true, type: true, code: true } });
  return kararlar.map(k => ({ id: buildKararIdFromRecord(k) })).filter(k => k.id);
}

// --- PAGE COMPONENT ---
export default async function KararDetayPage({ params }) {
  const { id: kararSlug } = params;
  const parsed = parseParamsId(kararSlug);
  let karar = null;

  if (parsed.mode === "type+code" && parsed.code) {
    const m = parsed.code.match(/(\d{4})\/([0-9A-Za-z-]+)\s*E.*?(\d{4})\/([0-9A-Za-z-]+)/i);
    const rawTypeSeg = String(parsed.typeSeg || "").trim();
    const tBase = rawTypeSeg.replace(/-/g, " ").replace(/\./g, "").trim();
    const typeFilters = [{ type: { contains: tBase, mode: "insensitive" } }];
    if (m) {
      const [, eYear, eNo, kYear, kNo] = m;
      karar = await prisma.karar.findFirst({ where: { AND: [{ code: { contains: `${eYear}/${eNo}` } }, { code: { contains: `${kYear}/${kNo}` } }, ...(typeFilters.length ? [{ OR: typeFilters }] : [])] } });
      if (!karar) karar = await prisma.karar.findFirst({ where: { AND: [{ code: { contains: `${eYear}/${eNo}` } }, { code: { contains: `${kYear}/${kNo}` } }] } });
    } else {
      karar = await prisma.karar.findFirst({ where: { AND: [{ code: { equals: parsed.code } }, ...(typeFilters.length ? [{ OR: typeFilters }] : [])] } });
      if (!karar) karar = await prisma.karar.findFirst({ where: { code: { contains: parsed.code.replace(/\s+/g, " ").trim() } } });
    }
  }
  if (!karar && parsed.mode === "filename") karar = await prisma.karar.findUnique({ where: { fileName: `${parsed.fileNameBase}.txt` } });
  if (!karar && kararSlug) karar = await prisma.karar.findFirst({ where: { fileName: `${kararSlug}.txt` } });
  if (!karar) notFound();
  if (parsed.mode === "filename" && karar?.type && karar?.code) {
    const canonicalId = buildKararIdFromRecord(karar);
    if (canonicalId && canonicalId !== kararSlug) redirect(`/kararlar/${canonicalId}`);
  }

  const session = await getServerSession(authOptions);
  let isInitiallyFavorited = false;
  if (session?.user?.id) {
    const favorite = await prisma.favoriteKarar.findUnique({ where: { userId_kararId: { userId: session.user.id, kararId: karar.id } } });
    isInitiallyFavorited = !!favorite;
  }

  const type = karar.type || 'Başlık Yok';
  const code = karar.code || 'Esas/Karar No Yok';
  const aiSummary = karar.aiSummary || 'Bu karar için yapay zeka özeti oluşturulamadı.';
  const keywordsFromKarar = typeof karar.keywords === 'string' ? karar.keywords.split(',').map(kw => kw.trim()).filter(Boolean) : [];
  
  const prevKarar = await prisma.karar.findFirst({ where: { createdAt: { lt: karar.createdAt } }, orderBy: { createdAt: 'desc' }, select: { fileName: true, type: true, code: true } });
  const nextKarar = await prisma.karar.findFirst({ where: { createdAt: { gt: karar.createdAt } }, orderBy: { createdAt: 'asc' }, select: { fileName: true, type: true, code: true } });
  const prevId = prevKarar ? buildKararIdFromRecord(prevKarar) : null;
  const nextId = nextKarar ? buildKararIdFromRecord(nextKarar) : null;

  // --- UI HELPERS ---
  const summaryKeywords = [
    { phrase: "Konu:", style: "text-sky-400 font-bold tracking-wide" },
    { phrase: "Gerekçe ve Sonuç:", style: "text-sky-400 font-bold tracking-wide" },
    { phrase: "HGK Gerekçesi ve Sonuç:", style: "text-amber-400 font-bold tracking-wide" },
    { phrase: "HGK Gerekçesi:", style: "text-amber-400 font-bold tracking-wide" },
    { phrase: "Uyuşmazlık:", style: "text-sky-400 font-bold tracking-wide" },
  ];
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const renderAiSummary = (txt) => {
    const lines = (txt || "").split(/\r?\n/).filter(line => line.trim() !== '');
    return lines.map((line, index) => {
      for (const kw of summaryKeywords) {
        const match = line.match(new RegExp(`^\\s*(${escapeRegExp(kw.phrase)})(?:\\s|\\b|$)`, 'i'));
        if (match) return (
          <div key={index} className="mb-2 pl-3 border-l border-sky-500/30">
            <span className={`${kw.style} text-[10px] block uppercase opacity-80 mb-0.5`}>{match[1].replace(/:$/, '')}</span>
            <span className="text-slate-300 text-sm leading-relaxed block">{line.substring(match[0].length)}</span>
          </div>
        );
      }
      return <p key={index} className="text-slate-400 text-sm leading-relaxed mb-2 font-light">{line}</p>;
    });
  };

  return (
    <main className="min-h-screen bg-[#02040a] text-gray-100 relative selection:bg-sky-500/30 selection:text-sky-100 font-sans">
       
       {/* OKUMA ÇUBUĞU (Client Component olarak eklendi) */}
       <ScrollProgressBar />

       {/* Cinematic Background */}
       <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden print-hidden">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-900/20 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>
       </div>

       {/* Floating Navigation Buttons */}
       {prevId && ( <Link href={`/kararlar/${prevId}`} className="group fixed top-1/2 left-0 transform -translate-y-1/2 z-30 py-4 px-2 bg-slate-950/50 hover:bg-sky-900/30 border-y border-r border-slate-800/50 backdrop-blur-sm rounded-r-xl transition-all duration-200 print-hidden" aria-label="Önceki"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-500 group-hover:text-sky-400"> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /> </svg> </Link> )}
       {nextId && ( <Link href={`/kararlar/${nextId}`} className="group fixed top-1/2 right-0 transform -translate-y-1/2 z-30 py-4 px-2 bg-slate-950/50 hover:bg-sky-900/30 border-y border-l border-slate-800/50 backdrop-blur-sm rounded-l-xl transition-all duration-200 print-hidden" aria-label="Sonraki"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-500 group-hover:text-sky-400"> <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /> </svg> </Link> )}

      {/* Content Wrapper */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 md:px-6 py-6 print:p-0 print:max-w-none">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-down print-hidden">
            <BackButton className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors group">
                <span className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center bg-slate-900 group-hover:border-slate-500 transition-colors">←</span>
                <span>Geri Dön</span>
            </BackButton>
            
            <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Consulto Legal AI</span>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>
            </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start print:block">
            
            {/* Left Column: Decision Content */}
            <div className="glass-card rounded-2xl overflow-hidden animate-fade-in min-w-0 print:shadow-none print:border-none print:bg-white">
                
                {/* 1. Header Section */}
                <div className="border-b border-white/5 bg-slate-900/30 p-6 md:p-8 print:border-b-2 print:border-black print:bg-white print:p-0 print:mb-6">
                    <div className="flex justify-between items-start mb-4 print:hidden">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Yargıtay Kararı
                        </span>
                        <FavoriteButton itemId={karar.id} itemType="karar" initialIsFavorited={isInitiallyFavorited} />
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight tracking-tight print:text-black print:text-xl">
                        {type}
                    </h1>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5 print:border-black">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 print:text-black">Dosya Numarası</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-lg text-sky-200 tracking-tight print:text-black">{code}</span>
                            </div>
                        </div>
                        {keywordsFromKarar.length > 0 && (
                            <div className="flex flex-col print:hidden">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Anahtar Kelimeler</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {keywordsFromKarar.slice(0, 3).map((kw, i) => (
                                        <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded border border-slate-700/50">{kw}</span>
                                    ))}
                                    {keywordsFromKarar.length > 3 && <span className="text-[10px] text-slate-600 px-1">+{keywordsFromKarar.length - 3}</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Body Section */}
                <div className="p-6 md:p-10 lg:p-12 bg-transparent print:p-0 print:text-black">
                    <div className="font-serif text-slate-300/90 text-lg leading-loose tracking-wide text-justify selection:bg-sky-900/30 selection:text-sky-100 print:text-black print:text-sm print:leading-normal">
                        <HighlightedKararBody fullContent={karar.content || ""} />
                    </div>
                </div>
            </div>

            {/* Right Column: AI Sidebar (Sticky) */}
            <div className="glass-card rounded-2xl overflow-hidden xl:sticky xl:top-6 animate-fade-in print:hidden" style={{animationDelay: '0.1s'}}>
                <div className="relative bg-slate-900/50 border-b border-slate-800/50 p-4 flex items-center justify-between overflow-hidden">
                    {/* Scanner Effect */}
                    <div className="scanner-line"></div>
                    <div className="flex items-center gap-2 text-sky-400 relative z-10">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        <span className="text-xs font-bold uppercase tracking-widest">AI Analiz</span>
                    </div>
                    <div className="flex gap-1 relative z-10">
                        <span className="w-1 h-1 bg-sky-500 rounded-full animate-pulse"></span>
                        <span className="w-1 h-1 bg-sky-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                        <span className="w-1 h-1 bg-sky-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                    </div>
                </div>

                <div className="p-5 max-h-[600px] overflow-y-auto custom-scrollbar bg-[#050810]/40">
                    <div className="space-y-4">
                        {renderAiSummary(aiSummary)}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-white/5 flex gap-3 opacity-60 hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-[10px] text-slate-500 leading-snug">
                            Bu özet Consulto AI tarafından yasal metin üzerinden oluşturulmuştur.
                        </p>
                    </div>
                </div>
            </div>

        </div>
      </div>
      
      {/* CSS Injection */}
      <style dangerouslySetInnerHTML={{__html: GLOBAL_CSS}} />
    </main>
  );
}
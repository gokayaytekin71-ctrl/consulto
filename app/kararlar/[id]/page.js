import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import FavoriteButton from '@/components/FavoriteButton';
import HighlightedKararBody from '@/components/HighlightedKararBody';
import BackButton from '@/components/BackButton';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import { Suspense } from 'react';

// --- CONFIG ---
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- GLOBAL CSS (DARK TECH - FINAL REVISION) ---
const GLOBAL_CSS = `
  :root {
    --bg-main: #0B1121;       
    --bg-sidebar: #0f1629;    
    --bg-card: #141b2d;       
    --border-color: #1e293b; 
    
    --text-primary: #ffffff;  
    --text-secondary: #94a3b8; 
    
    --accent-cyan: #22d3ee; 
    --accent-glow: rgba(34, 211, 238, 0.10);
  }

  body {
    background-color: var(--bg-main);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    background-image: radial-gradient(circle at 50% 0%, #172033, var(--bg-main));
  }

  /* Layout */
  .layout-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 30px;
    max-width: 1600px;
    margin: 0 auto;
    padding: 30px;
    min-height: 100vh;
  }

  /* --- LEFT SIDEBAR --- */
  .sidebar-panel {
    background-color: var(--bg-sidebar);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 24px;
    height: calc(100vh - 48px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  /* Header */
  .sidebar-header {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .header-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    display: block;
    margin-bottom: 4px;
  }
  .court-name {
    font-size: 1rem; /* Biraz daha kompakt */
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  /* Metadata Box (Compact) */
  .meta-compact {
    background-color: rgba(0,0,0,0.2);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 8px 12px;
    margin-bottom: 16px;
  }
  .meta-label-sm {
    font-size: 0.6rem;
    text-transform: uppercase;
    color: var(--text-secondary);
    font-weight: 600;
    display: block;
    margin-bottom: 2px;
  }
  .meta-value-sm {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.75rem;
    color: #e2e8f0;
  }

  /* AI Summary Section */
  .ai-section {
    flex: 1;
    overflow-y: auto;
    padding-right: 6px;
    margin-bottom: 16px;
    /* Anahtar kelimeler altta sıkışmasın diye biraz boşluk */
    padding-bottom: 10px; 
    border-bottom: 1px solid var(--border-color);
  }
  .ai-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    position: sticky;
    top: 0;
    background: var(--bg-sidebar);
    padding-bottom: 8px;
    z-index: 10;
  }
  .ai-title {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--accent-cyan);
    letter-spacing: 0.05em;
  }
  .ai-text {
    font-size: 0.8rem;
    line-height: 1.6;
    color: #cbd5e1;
  }
  .ai-highlight-cyan {
    color: var(--accent-cyan);
    font-weight: 700;
    display: block;
    margin-bottom: 4px;
    margin-top: 12px;
    font-size: 0.85rem;
  }

  /* Anahtar Kelimeler (Geri geldi) */
  .keywords-section {
    margin-bottom: 10px;
  }
  .keyword-tag {
    display: inline-block;
    font-size: 0.65rem;
    color: var(--text-secondary);
    background: rgba(255,255,255,0.03);
    padding: 3px 8px;
    border-radius: 4px;
    margin-right: 6px;
    margin-bottom: 6px;
    border: 1px solid var(--border-color);
  }

  /* --- RIGHT CONTENT --- */
  .main-card {
    background-color: var(--bg-sidebar);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 50px; 
    min-height: 80vh;
  }

  /* Sağ taraftaki başlığı küçülttük */
  .doc-title-small {
    font-size: 1.25rem; /* 3xl'den xl'a indirildi */
    font-weight: 600;
    color: var(--text-secondary); /* Parlak beyazdan griye çekildi */
    line-height: 1.4;
    margin-bottom: 0;
    letter-spacing: -0.01em;
  }

  .prose-dark p {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #cbd5e1;
    margin-bottom: 1.5em;
    text-align: justify;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

  @media (max-width: 1024px) {
    .layout-grid { grid-template-columns: 1fr; padding: 16px; gap: 16px; }
    .sidebar-panel { position: relative; top: 0; height: auto; }
    .main-card { padding: 24px; }
  }
  @media print {
    .layout-grid { display: block; }
    .sidebar-panel, .no-print { display: none; }
    body { background: white; color: black; }
  }
`;

// --- HELPER FUNCTIONS ---
function slugifyType(t = "") { const map = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" }; return String(t || "").replace(/[·.]/g, " ").replace(/[çÇğĞıİöÖşŞüÜ]/g, m => map[m] || m).replace(/[^a-zA-Z0-9\s-]/g, " ").trim().replace(/\s+/g, "-").replace(/-+/g, "-").toLowerCase() || "mahkeme"; }
function codeToSegment(code = "") { const s = String(code || "").replace(/\s+/g, " ").trim(); const m = s.match(/(\d{4})[\/\-]([0-9A-Za-z\-]+)\s*E.*?(\d{4})[\/\-]([0-9A-Za-z\-]+)\s*K/i); if (!m) return s.replace(/[^0-9A-Za-z\/-]/g, "").replace(/[\/]/g, "-") || "code"; return `${m[1]}-${m[2]}E_${m[3]}-${m[4]}K`; }
function segmentToCode(seg = "") { const m = String(seg || "").match(/^(\d{4})-([0-9A-Za-z\-]+)E_(\d{4})-([0-9A-Za-z\-]+)K$/i); return m ? `${m[1]}/${m[2]} E. ${m[3]}/${m[4]} K.` : ""; }
function buildKararIdFromRecord(k) { const type = (k?.type || "").trim(); const code = (k?.code || "").trim(); if (type && code) return `${slugifyType(type)}__${codeToSegment(code)}`; return (k?.fileName || "").replace(/\.txt$/i, "") || ""; }
function parseParamsId(paramsId = "") { const id = String(paramsId || ""); if (id.includes("__")) { const [typeSeg, codeSeg] = id.split("__"); return { typeSeg, code: segmentToCode(codeSeg), mode: "type+code" }; } return { fileNameBase: id, mode: "filename" }; }

export async function generateMetadata({ params }) { return { alternates: { canonical: `https://www.consultohukuk.com/kararlar/${params.id}` }, robots: { index: true, follow: true } }; }
export async function generateStaticParams() { return []; }

// --- UI HELPERS ---
const renderAiSummary = (txt) => {
  const lines = (txt || "").split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map((line, i) => {
    const lower = line.toLowerCase();
    if (lower.startsWith("gerekçe ve sonuç") || lower.startsWith("uyuşmazlık") || lower.startsWith("konu")) {
        const parts = line.split(':');
        const title = parts[0] + (parts.length > 1 ? ':' : '');
        const content = parts.length > 1 ? parts.slice(1).join(':') : '';
        
        return (
            <div key={i} className="mb-4">
                <span className="ai-highlight-cyan">{title}</span>
                <p className="ai-text">{content}</p>
            </div>
        );
    }
    return (
        <div key={i} className="mb-3 pl-2 border-l border-[#334155]">
            <p className="ai-text">{line}</p>
        </div>
    );
  });
};

// --- PAGE COMPONENT ---
export default async function KararDetayPage({ params }) {
  const { id: kararSlug } = params;
  const parsed = parseParamsId(kararSlug);
  let karar = null;

  // --- DATA FETCHING ---
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
  const code = karar.code || 'Dosya No Yok';
  const aiSummary = karar.aiSummary || 'Analiz verisi bulunamadı.';
  const keywordsFromKarar = typeof karar.keywords === 'string' ? karar.keywords.split(',').map(kw => kw.trim()).filter(Boolean) : [];
  
  const prevKarar = await prisma.karar.findFirst({ where: { createdAt: { lt: karar.createdAt } }, orderBy: { createdAt: 'desc' }, select: { fileName: true, type: true, code: true } });
  const nextKarar = await prisma.karar.findFirst({ where: { createdAt: { gt: karar.createdAt } }, orderBy: { createdAt: 'asc' }, select: { fileName: true, type: true, code: true } });
  const prevId = prevKarar ? buildKararIdFromRecord(prevKarar) : null;
  const nextId = nextKarar ? buildKararIdFromRecord(nextKarar) : null;

  return (
    <main className="min-h-screen text-white">
       
       <Suspense fallback={null}>
            <div className="fixed top-0 left-0 w-full h-[2px] z-50 bg-[#1e293b]">
                <ScrollProgressBar />
            </div>
       </Suspense>

       <div className="layout-grid">
           
           {/* --- LEFT SIDEBAR --- */}
           <aside className="sidebar-panel">
                
                {/* Header (Mahkeme + Fav) */}
                <div className="sidebar-header">
                     <div>
                        <span className="header-label">MAHKEME</span>
                        <h2 className="court-name">
                            {type.includes("Genel") ? "HGK" : "YARGITAY"}
                        </h2>
                     </div>
                     <div className="scale-90 origin-top-right">
                        <FavoriteButton itemId={karar.id} itemType="karar" initialIsFavorited={isInitiallyFavorited} />
                     </div>
                </div>

                {/* Metadata Compact */}
                <div className="meta-compact">
                    <span className="meta-label-sm">DOSYA NUMARASI</span>
                    <span className="meta-value-sm block">{code}</span>
                </div>

                {/* AI Summary */}
                <div className="ai-section custom-scrollbar">
                    <div className="ai-header">
                        <svg className="w-4 h-4 text-[var(--accent-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <span className="ai-title">YAPAY ZEKA ÖZETİ</span>
                    </div>
                    <div>
                        {renderAiSummary(aiSummary)}
                    </div>
                </div>

                {/* Keywords (Anahtar Kelimeler - GERİ EKLENDİ) */}
                {keywordsFromKarar.length > 0 && (
                    <div className="keywords-section">
                        <span className="meta-label-sm mb-2">ETİKETLER</span>
                        <div className="flex flex-wrap">
                            {keywordsFromKarar.map((kw, i) => (
                                <span key={i} className="keyword-tag">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="mt-auto pt-4 border-t border-[var(--border-color)] space-y-3">
                     <BackButton className="w-full text-xs font-medium text-[var(--text-secondary)] hover:text-white transition-colors text-left flex items-center gap-2">
                        ← Geri Dön
                     </BackButton>
                     <button className="w-full py-2 bg-[var(--border-color)] hover:bg-[#334155] text-xs font-bold rounded text-white transition-colors">
                        PDF İndir
                     </button>
                </div>
           </aside>


           {/* --- RIGHT CONTENT --- */}
           <div className="main-card">
                
                <div className="mb-6 pb-4 border-b border-[var(--border-color)]">
                    <div className="flex justify-end gap-4 mb-2 text-xs font-mono text-[var(--text-secondary)] print-hidden">
                        {prevId ? <Link href={`/kararlar/${prevId}`} className="hover:text-[var(--accent-cyan)] transition-colors">← ÖNCEKİ</Link> : <span className="opacity-20">← ÖNCEKİ</span>}
                        {nextId ? <Link href={`/kararlar/${nextId}`} className="hover:text-[var(--accent-cyan)] transition-colors">SONRAKİ →</Link> : <span className="opacity-20">SONRAKİ →</span>}
                    </div>

                    {/* Sağ Taraf Başlığı - KÜÇÜLTÜLDÜ */}
                    <h1 className="doc-title-small">
                        {type}
                    </h1>
                </div>

                <article className="prose-dark">
                    <div className="highlighted-body">
                        <HighlightedKararBody fullContent={karar.content || ""} />
                    </div>
                </article>

                <div className="mt-16 flex justify-center text-[#334155] opacity-50 text-sm">
                     ***
                </div>
           </div>

       </div>
      
      <style dangerouslySetInnerHTML={{__html: GLOBAL_CSS}} />
    </main>
  );
}
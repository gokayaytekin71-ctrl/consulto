// app/mevzuat/[slug]/page.js
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";


// --- YARDIMCILAR (Aynen korundu) ---
function slugifyTr(s = "") {
  return String(s).normalize("NFKD").replace(/Ğ/g, "g").replace(/ğ/g, "g").replace(/Ü/g, "u").replace(/ü/g, "u").replace(/Ş/g, "s").replace(/ş/g, "s").replace(/İ/g, "i").replace(/ı/g, "i").replace(/Ö/g, "o").replace(/ö/g, "o").replace(/Ç/g, "c").replace(/ç/g, "c").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function escapeRegex(s = "") { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${escapeRegex(q)})`, "gi");
  const chunks = String(text).split(re);
  return chunks.map((chunk, i) => i % 2 === 1 ? <mark key={i} className="rounded-sm px-0.5 bg-amber-500/30 text-amber-200 font-semibold">{chunk}</mark> : <span key={i}>{chunk}</span>);
}
function withLineBreaks(text, q) {
  const lines = String(text).split("\n");
  const out = [];
  lines.forEach((line, idx) => {
    if (idx > 0) out.push(<br key={`br-${idx}`} />);
    out.push(<span key={`ln-${idx}`} className="whitespace-pre-wrap">{highlight(line, q)}</span>);
  });
  return out;
}
function renderMaddeMetin(text, q) {
  const paras = String(text).trim().split(/\n{2,}/);
  return paras.map((p, i) => (
    <p key={i} className="leading-8 text-slate-300 mb-4 last:mb-0 text-[15px]">{withLineBreaks(p, q)}</p>
  ));
}

// --- DATA FETCH ---
async function getData(slug, q) {
  const mevzuat = await prisma.mevzuat.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, articleCount: true },
  });
  if (!mevzuat) return null;

  const whereMadde = { mevzuatId: mevzuat.id };
  if (q && q.trim()) {
    whereMadde.OR = [
      { maddeNo: { contains: q, mode: "insensitive" } },
      { maddeBaslik: { contains: q, mode: "insensitive" } },
      { maddeMetin: { contains: q, mode: "insensitive" } },
    ];
  }

  const [totalCount, maddeler] = await Promise.all([
    prisma.mevzuatMadde.count({ where: { mevzuatId: mevzuat.id } }),
    prisma.mevzuatMadde.findMany({
      where: whereMadde,
      orderBy: [{ maddeNoOrder: "asc" }, { orderIndex: "asc" }],
      select: { id: true, maddeNo: true, maddeNoOrder: true, maddeBaslik: true, maddeUstBaslik: true, kisim: true, bolum: true, ayrim: true, maddeMetin: true, orderIndex: true },
    }),
  ]);

  return { mevzuat, maddeler, totalCount, filteredCount: maddeler.length };
}

export async function generateMetadata({ params }) {
  const { slug } = params || {};
  const mev = await prisma.mevzuat.findUnique({ where: { slug }, select: { name: true } });
  if (!mev) return {};
  return { title: `${mev.name} | Mevzuat`, description: `${mev.name} metni.` };
}

export default async function Page({ params, searchParams }) {
  const slug = params?.slug;
  const q = (searchParams?.q || "").toString().trim();
  const data = await getData(slug, q);
  if (!data) notFound();
  const { mevzuat, maddeler, totalCount, filteredCount } = data;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Başlık */}
              <div className="flex-1 min-w-0">
                 <h1 className="text-xl md:text-2xl font-bold text-white truncate" title={mevzuat.name}>
                    {mevzuat.name}
                 </h1>
                 <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Toplam {totalCount} Madde 
                    {q && <span className="text-amber-400 font-mono ml-1">(Filtrelenen: {filteredCount})</span>}
                 </p>
              </div>

              {/* Arama */}
              <form method="GET" action="" className="w-full md:w-auto min-w-[300px] relative group">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 <input
                   type="search"
                   name="q"
                   defaultValue={q}
                   placeholder="Madde ara..."
                   className="w-full bg-[#1e293b] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                 />
                 {q && (
                    <a href={`./${""}`} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase">
                       Sil
                    </a>
                 )}
              </form>
           </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-12 gap-8">
        
        {/* --- SIDEBAR (İÇİNDEKİLER) --- */}
        <aside className="hidden lg:block col-span-3">
           <div className="sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar rounded-xl border border-white/5 bg-[#1e293b]/50 p-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                 İçindekiler
              </h2>
              <nav className="space-y-0.5">
                 {maddeler.map((m) => {
                    const base = String(m.maddeNo ?? m.orderIndex);
                    const clean = base.replace(/^madde\s*/i, "");
                    const anchor = `madde-${slugifyTr(clean)}`;
                    return (
                       <a
                         key={m.id}
                         href={`#${anchor}`}
                         className="block px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors truncate"
                         title={`${m.maddeNo} ${m.maddeBaslik || ""}`}
                       >
                          <span className="font-bold text-indigo-400 mr-1.5">{m.maddeNo}</span>
                          {m.maddeBaslik}
                       </a>
                    );
                 })}
              </nav>
           </div>
        </aside>

        {/* --- MAIN CONTENT (MADDELER) --- */}
        <main className="col-span-12 lg:col-span-9 space-y-8">
           {maddeler.length === 0 && (
              <div className="p-12 text-center border border-dashed border-slate-700 rounded-2xl text-slate-500">
                 Aradığınız kriterlere uygun madde bulunamadı.
              </div>
           )}

           {maddeler.map((m) => {
              const base = String(m.maddeNo ?? m.orderIndex);
              const clean = base.replace(/^madde\s*/i, "");
              const anchor = `madde-${slugifyTr(clean)}`;
              
              return (
                 <section
                   key={m.id}
                   id={anchor}
                   className="group relative scroll-mt-32 rounded-2xl border border-white/5 bg-[#1e293b] p-6 md:p-8 shadow-sm transition-all hover:border-indigo-500/20"
                 >
                    {/* Madde Başlığı */}
                    <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                       <div>
                          <div className="flex items-center flex-wrap gap-2 text-lg font-bold text-white">
                             <span className="text-indigo-400">Madde {m.maddeNo}</span>
                             {m.maddeBaslik && (
                                <>
                                   <span className="text-slate-600 mx-1">•</span>
                                   <span className="text-slate-200">{highlight(m.maddeBaslik, q)}</span>
                                </>
                             )}
                          </div>
                          {/* Breadcrumb / Meta */}
                          {(m.maddeUstBaslik || m.kisim || m.bolum || m.ayrim) && (
                             <div className="mt-2 text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                                {[m.kisim, m.bolum, m.ayrim, m.maddeUstBaslik].filter(Boolean).join("  ›  ")}
                             </div>
                          )}
                       </div>
                       <a href={`#${anchor}`} className="text-slate-600 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100 p-2">
                          #
                       </a>
                    </div>

                    {/* Madde Metni */}
                    <div className="prose prose-invert prose-p:text-slate-300 prose-p:leading-relaxed max-w-none">
                       {renderMaddeMetin(m.maddeMetin || "", q)}
                    </div>
                 </section>
              );
           })}
        </main>

      </div>
      
      {/* Footer Nav */}
      <footer className="border-t border-white/5 py-8 mt-12 bg-[#0f172a]">
         <div className="max-w-7xl mx-auto px-4 md:px-8">
            <a href="/mevzuat" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
               Mevzuat Listesine Dön
            </a>
         </div>
      </footer>

    </div>
  );
}
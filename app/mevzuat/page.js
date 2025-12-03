// app/mevzuat/page.js
import prisma from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Mevzuat Kütüphanesi | Karar Platformu",
  description: "Güncel mevzuat arşivi.",
};

export const dynamic = "force-dynamic";

// --- YARDIMCILAR (Aynen korundu) ---
function sanitizeTrText(s = "") {
  return String(s || "").normalize("NFC").replace(/\u0069\u0307/g, "i").replace(/\u0049\u0307/g, "İ");
}
function pickTitle(it) {
  const t = sanitizeTrText((it.shortName || "").trim());
  return t || sanitizeTrText(it.name || "(Başlık Yok)");
}
function pickSubtitle(it) {
  const s = sanitizeTrText((it.shortName || "").trim());
  const n = sanitizeTrText((it.name || "").trim());
  return (s && n && s !== n) ? n : null;
}
function firstLetterTR(s = "") {
  const tr = s.trim();
  if (!tr) return "#";
  return tr[0].replace("İ", "I").replace("ı", "i").toUpperCase();
}

export default async function MevzuatPage() {
  const rows = await prisma.mevzuat.findMany({
    orderBy: [{ shortName: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, shortName: true, year: true, articleCount: true, key: true },
  });

  const items = rows.map((it) => {
    const title = pickTitle(it);
    const kanunNo = String(it.key || "").match(/\d+/)?.[0] || null;
    return {
      id: it.id, slug: it.slug, title, subtitle: pickSubtitle(it), year: it.year,
      articleCount: it.articleCount, letter: firstLetterTR(title), kanunNo,
    };
  });

  items.sort((a, b) => a.title.localeCompare(b.title, "tr"));

  const groups = items.reduce((acc, it) => {
    (acc[it.letter] ||= []).push(it);
    return acc;
  }, {});

  const letters = Object.keys(groups).sort((a, b) => a.localeCompare(b, "tr"));

  return (
    <div lang="tr" className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-8 w-1 bg-gradient-to-b from-indigo-400 to-cyan-500 rounded-full"></div>
             <div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Mevzuat Arşivi</h1>
                <p className="text-xs text-slate-400 hidden md:block">Güncel kanun ve yönetmelikler</p>
             </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-slate-300">
            {items.length} Kayıt
          </span>
        </div>
      </header>

      {/* --- CONTENT --- */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {letters.map((L) => (
          <section key={L} className="relative">
            
            {/* Grup Başlığı (Sol Tarafta Yapışkan Harf) */}
            <div className="flex flex-col md:flex-row gap-6">
               <div className="md:w-12 shrink-0">
                  <div className="sticky top-24 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xl font-black text-indigo-400 shadow-lg backdrop-blur-sm">
                     {L}
                  </div>
               </div>

               {/* Grid Kartlar */}
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                 {groups[L].map((it) => (
                   <Link
                     href={`/mevzuat/${it.slug ?? ""}`}
                     key={it.id}
                     className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-[#1e293b] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:bg-[#1e293b]/80 hover:shadow-xl hover:shadow-indigo-500/10"
                   >
                     <div>
                       <div className="flex justify-between items-start gap-4 mb-2">
                          <h3 className="text-lg font-bold text-slate-100 group-hover:text-white leading-snug line-clamp-2 transition-colors">
                            {it.title}
                          </h3>
                          {it.year && (
                             <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                {it.year}
                             </span>
                          )}
                       </div>
                       
                       {it.subtitle && (
                         <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 group-hover:text-slate-300 transition-colors">{it.subtitle}</p>
                       )}
                     </div>

                     <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                           {it.kanunNo && (
                              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                                 No: {it.kanunNo}
                              </span>
                           )}
                           {it.articleCount > 0 && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                 {it.articleCount} Madde
                              </span>
                           )}
                        </div>
                        <span className="text-indigo-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </span>
                     </div>
                   </Link>
                 ))}
               </div>
            </div>
          </section>
        ))}

        {!items.length && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
             <div className="p-4 rounded-full bg-slate-800 mb-4"><svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>
             <p>Kayıtlı mevzuat bulunamadı.</p>
          </div>
        )}
      </main>
    </div>
  );
}
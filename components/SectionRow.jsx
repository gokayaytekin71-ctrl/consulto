"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DecisionCard from "@/components/DecisionCard";

export default function SectionRow({
  id, title, subtitle, items = [], initialVisible = 3, perRow = 3, addRows = 2,
  isLoading = false, skeletonCount = 6, autoLoad = false, variant = "default",
}) {
  const total = items.length;
  const [visible, setVisible] = useState(Math.min(initialVisible, total));
  
  const canMore = visible < total;
  const canLess = visible > initialVisible;
  
  const isIbk = variant === "ibk";
  const perRowEffective = isIbk ? 1 : perRow;

  const gridClasses = useMemo(() => {
    if (isIbk) return "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6";
    const lgMap = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };
    return `grid grid-cols-1 md:grid-cols-2 ${lgMap[perRow] || "lg:grid-cols-3"} gap-6`;
  }, [perRow, isIbk]);

  const renderItems = useMemo(() => items.slice(0, Math.min(visible, total)), [items, visible, total]);

  const handleMore = () => setVisible((v) => Math.min(total, v + perRowEffective * addRows));
  
  const handleLess = () => {
    setVisible(initialVisible);
    const sectionElement = document.getElementById(id);
    if (sectionElement) sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!autoLoad || !canMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    let ticking = false;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !ticking) {
          ticking = true;
          setTimeout(() => { handleMore(); ticking = false; }, 80);
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [autoLoad, canMore, perRowEffective, addRows]);

  return (
    <section id={id} aria-labelledby={`${id || "section"}-title`} className="scroll-mt-32">
      
      {/* DEĞİŞİKLİK BURADA:
         bg-slate-800/40 -> Arka planı siyahtan griye çektim.
         border-slate-700 -> Kenarlıkları belirginleştirdim.
      */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/40 backdrop-blur-md p-8 shadow-xl">
        
        <header className="mb-8 flex flex-col gap-2 border-b border-slate-700 pb-6">
          <div className="flex items-center gap-4">
             {/* İkon kutusu daha parlak */}
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-cyan-400 border border-slate-600 shadow-sm">
               {isIbk ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
               )}
             </div>
             <div>
                <h2 id={`${id || "section"}-title`} className="text-xl font-bold tracking-tight text-white">
                  {title}
                </h2>
                {subtitle && <p className="text-sm text-slate-400 font-medium mt-0.5">{subtitle}</p>}
             </div>
          </div>
        </header>

        <div className={gridClasses}>
          {renderItems.map((k) => {
            // IBK KARTI - Zemin Rengi Açıldı (Slate-800/60)
            if (isIbk) {
              const href = k?.pdfHref || null;
              
              const CardContent = (
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-5">
                     <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-[11px] font-mono text-cyan-400 tracking-tight shadow-sm">
                          {k.karar_code || "N/A"}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-400 tracking-tight shadow-sm">
                          {k.birlesme_no || "N/A"}
                        </span>
                     </div>
                     <div className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${href ? 'border-cyan-900/50 bg-cyan-950/50 text-cyan-400 group-hover:border-cyan-500/50 group-hover:text-cyan-300' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     </div>
                  </div>

                  <div className="flex-grow">
                     <p className="text-sm leading-7 text-slate-300 line-clamp-4 group-hover:text-white transition-colors font-normal">
                        <span className="text-cyan-500 font-bold text-[10px] uppercase tracking-wider mr-2">Özet:</span>
                        {k.ozet || "Özet bulunamadı."}
                     </p>
                  </div>

                  {href && (
                    <div className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-cyan-500/80 group-hover:text-cyan-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                      <span>PDF İncele</span>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                  )}
                </div>
              );

              const wrapperClass = `group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800/60 p-6 transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-800 hover:shadow-lg ${href ? 'cursor-pointer' : ''}`;

              return href ? (
                <a key={`ibk-link-${k.id}`} href={href} target="_blank" rel="noopener noreferrer" className={wrapperClass}>
                  {CardContent}
                </a>
              ) : (
                <div key={`ibk-${k.id}`} className={wrapperClass}>
                  {CardContent}
                </div>
              );
            }

            return (
              <DecisionCard
                key={k.id}
                id={k.fileName?.replace(/\.txt$/i, "") ?? k.id}
                type={k.type}
                code={k.code}
                aiSummary={k.aiSummary}
                keywords={k.keywords}
                contentLength={k.contentLength || 0}
              />
            );
          })}

          {isLoading &&
            Array.from({ length: Math.max(0, skeletonCount - renderItems.length) }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-4 w-1/3 bg-slate-700 rounded" />
                  <div className="h-5 w-12 bg-slate-700 rounded" />
                </div>
                <div className="h-2.5 w-full bg-slate-700 rounded mb-3" />
                <div className="h-2.5 w-5/6 bg-slate-700 rounded mb-3" />
                <div className="h-2.5 w-4/6 bg-slate-700 rounded mb-6" />
                <div className="h-9 w-full bg-slate-700 rounded-lg mt-auto" />
              </div>
            ))}
        </div>

        {(canMore || canLess) && (
          <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-4 border-t border-slate-700/50 mt-4">
            {canMore && (
              <button onClick={handleMore} className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-slate-700 px-8 py-3 text-xs font-bold text-white transition-all hover:bg-slate-600 hover:text-white active:scale-95 border border-slate-600 shadow-sm">
                <span className="relative z-10 uppercase tracking-widest">Daha Fazla Göster</span>
                <svg className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
            )}
            {canLess && (
              <button onClick={handleLess} className="group inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-transparent px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest transition-all hover:border-slate-500 hover:text-white active:scale-95">
                <span>Daha Az</span>
                <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
              </button>
            )}
          </div>
        )}
      </div>
      {autoLoad && canMore && <div ref={sentinelRef} className="h-10 w-full opacity-0 pointer-events-none" />}
    </section>
  );
}
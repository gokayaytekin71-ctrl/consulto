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
    if (isIbk) return "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5";
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

  // Auto Load Sentinel
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
      {/* Container: Koyu Zemin + Hafif Border */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a]/60 backdrop-blur-sm p-6 shadow-lg">
        
        <header className="mb-6 flex flex-col gap-1 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-cyan-500 border border-slate-700 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
               {isIbk ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
               )}
             </div>
             <h2 id={`${id || "section"}-title`} className="text-lg font-bold tracking-tight text-white shadow-black drop-shadow-md">
               {title}
             </h2>
          </div>
          {subtitle && <p className="text-xs text-slate-400 pl-11 font-medium">{subtitle}</p>}
        </header>

        <div className={gridClasses}>
          {renderItems.map((k) => {
            // --- IBK KARTI (Analiz Yan Panel Stili) ---
            if (isIbk) {
              const href = k?.pdfHref || null;
              
              const CardContent = (
                <div className="relative z-10 flex flex-col h-full">
                  {/* Header: Badges */}
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-[#020617] border border-slate-700 text-[10px] font-mono text-cyan-400 shadow-sm tracking-tight">
                          {k.karar_code || "N/A"}
                        </span>
                        <span className="px-2 py-1 rounded bg-[#020617] border border-slate-700 text-[10px] font-mono text-slate-400 shadow-sm tracking-tight">
                          {k.birlesme_no || "N/A"}
                        </span>
                     </div>
                     {/* Icon */}
                     <div className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${href ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'border-slate-700 bg-slate-800 text-slate-600'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     </div>
                  </div>

                  {/* Body: Summary */}
                  <div className="flex-grow">
                     <p className="text-xs leading-relaxed text-slate-400 line-clamp-4 group-hover:text-slate-200 transition-colors font-medium">
                        <span className="text-cyan-500 font-bold text-[10px] uppercase tracking-wider mr-1">Özet:</span>
                        {k.ozet || "Özet bulunamadı."}
                     </p>
                  </div>

                  {/* Footer: Action */}
                  {href && (
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-cyan-500 opacity-0 -translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                      <span>PDF İncele</span>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                  )}
                </div>
              );

              const wrapperClass = `group relative overflow-hidden rounded-xl border border-slate-700 bg-[#020617] p-5 transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] ${href ? 'cursor-pointer' : ''}`;

              return href ? (
                <a
                  key={`ibk-link-${k.id}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={wrapperClass}
                >
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-indigo-500/0 opacity-0 transition-opacity duration-500 group-hover:from-cyan-500/5 group-hover:to-indigo-500/10 group-hover:opacity-100" />
                  {CardContent}
                </a>
              ) : (
                <div key={`ibk-${k.id}`} className={wrapperClass}>
                  {CardContent}
                </div>
              );
            }

            // --- STANDART KARAR KARTI ---
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

          {/* SKELETON LOADERS (Koyu Tema) */}
          {isLoading &&
            Array.from({ length: Math.max(0, skeletonCount - renderItems.length) }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="rounded-xl border border-slate-800 bg-[#020617] p-5 animate-pulse"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-4 w-1/3 bg-slate-800 rounded" />
                  <div className="h-5 w-12 bg-slate-800 rounded" />
                </div>
                <div className="h-2 w-full bg-slate-800 rounded mb-2" />
                <div className="h-2 w-5/6 bg-slate-800 rounded mb-2" />
                <div className="h-2 w-4/6 bg-slate-800 rounded mb-6" />
                <div className="h-8 w-full bg-slate-800 rounded-lg mt-auto" />
              </div>
            ))}
        </div>

        {/* BUTTONS (More / Less) */}
        {(canMore || canLess) && (
          <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-4">
            {canMore && (
              <button
                type="button"
                onClick={handleMore}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-cyan-600 px-8 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-900/30 transition-all hover:bg-cyan-500 hover:shadow-cyan-500/40 active:scale-95"
              >
                <span className="relative z-10 uppercase tracking-widest">Daha Fazla</span>
                <svg className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {canLess && (
              <button
                type="button"
                onClick={handleLess}
                className="group inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0f172a] px-6 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white active:scale-95"
              >
                <span>Daha Az</span>
                <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Auto Load Sentinel */}
      {autoLoad && canMore && <div ref={sentinelRef} className="h-10 w-full opacity-0 pointer-events-none" />}
    </section>
  );
}
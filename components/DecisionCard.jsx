"use client";

import Link from "next/link";
import FormattedSummary from "@/components/FormattedSummary";
import { useState } from "react";

const MAX_CONTENT_LENGTH_FOR_BAR = 90000;

// Daire isimlerini kısaltan yardımcı fonksiyon
const formatChamberName = (name) => {
  if (!name) return "";
  return name
    .replace(/Hukuk Genel Kurulu/gi, "HGK")
    .replace(/Ceza Genel Kurulu/gi, "CGK")
    .replace(/Hukuk Dairesi/gi, "H.D.")
    .replace(/Ceza Dairesi/gi, "C.D.");
};

export default function DecisionCard({
  id,
  type,
  code,
  aiSummary,
  keywords,
  contentLength = 0,
}) {
  const [isNavigating, setIsNavigating] = useState(false);

  // Kısaltılmış başlık
  const abbreviatedType = formatChamberName(type);

  const keywordList = typeof keywords === 'string'
    ? keywords.split(',').map(kw => kw.trim()).filter(Boolean)
    : [];

  const qualityPercentage = Math.min(100, Math.max(0, (contentLength / MAX_CONTENT_LENGTH_FOR_BAR) * 100));
  
  // Renk Paleti
  let statusColor = "";
  let statusText = "";
  if (qualityPercentage < 30) {
    statusText = "Özet";
    statusColor = "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
  } else if (qualityPercentage < 60) {
    statusText = "Gerekçeli";
    statusColor = "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]";
  } else {
    statusText = "Kapsamlı";
    statusColor = "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
  }

  return (
    <div className="group relative flex flex-col h-[500px] w-full max-w-[340px] mx-auto bg-white rounded-xl border border-slate-200 shadow-lg hover:shadow-[0_20px_50px_-12px_rgba(0,42,92,0.2)] transition-all duration-300 hover:-translate-y-1.5 overflow-hidden">
      
      {/* --- HEADER: Daha kompakt --- */}
      <div className="shrink-0 relative px-5 py-3.5 bg-gradient-to-r from-[#002a5c] to-[#004080] text-white flex items-center justify-between z-10">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
         
         <div className="flex flex-col z-10 min-w-0">
             <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#fbbf24]"></span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-blue-200/80">Karar Merci</span>
             </div>
             {/* Font boyutu biraz küçüldü: text-lg */}
             <h2 className="text-lg font-serif font-bold tracking-tight leading-none text-white drop-shadow-md truncate" title={type}>
               {abbreviatedType}
             </h2>
         </div>

         {code && (
           <div className="shrink-0 ml-3 flex items-center justify-center px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 rounded shadow-sm group-hover:bg-white/20 transition-colors">
             <span className="text-[11px] font-mono font-bold text-amber-300 tracking-wider">
               {code}
             </span>
           </div>
         )}
      </div>

      {/* --- BODY --- */}
      <div className="flex-1 flex flex-col bg-slate-50/30 min-h-0 relative">
        
        {/* 1. UZUNLUK BARI (Sıkılaştırıldı) */}
        <div className="px-5 pt-4 pb-2">
            <div className="flex justify-between items-end mb-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">İçerik Yoğunluğu</span>
                <span className="text-[10px] font-bold text-[#002a5c]">{statusText}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full ${statusColor} rounded-full relative transition-all duration-1000`} style={{ width: `${qualityPercentage}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>
        </div>

        {/* 2. ANAHTAR KELİMELER (Padding ve Font küçüldü) */}
        {keywordList.length > 0 && (
            <div className="px-5 py-2">
                <div className="flex flex-wrap gap-1.5">
                    {keywordList.map((kw, i) => (
                        <span key={i} className="px-2.5 py-0.5 text-[10px] font-semibold text-[#002a5c] bg-white border border-slate-200 rounded-md shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-default">
                            {kw}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* 3. AI SUMMARY */}
        {aiSummary && (
            <div className="flex-1 px-5 pb-2 overflow-y-auto custom-scrollbar-thin relative group/text">
                <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm py-1.5 mb-1 z-10 border-b border-slate-200/50 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-amber-600 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-[#002a5c] uppercase tracking-wider">Yapay Zeka Özeti</span>
                </div>
                
                <div className="text-[12.5px] leading-relaxed text-slate-700 font-medium">
                    <FormattedSummary summary={aiSummary} />
                </div>
                
                <div className="sticky bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none"></div>
            </div>
        )}

      </div>

      {/* --- FOOTER: Daha ince buton --- */}
      <div className="shrink-0 p-3 bg-white border-t border-slate-100 z-20">
        <Link
          href={`/kararlar/${id}`}
          onClick={() => setIsNavigating(true)}
          className="group/btn relative w-full flex items-center justify-center gap-2 overflow-hidden rounded-lg py-2.5 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all duration-200 hover:shadow-orange-500/40"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-[length:200%_100%] transition-[background-position] duration-500 group-hover/btn:bg-right"></div>
          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-[shimmer_2.5s_infinite]"></div>

          <span className="relative z-10 text-xs font-bold text-white tracking-wide uppercase drop-shadow-md">Kararı İncele</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="relative z-10 w-3.5 h-3.5 text-white drop-shadow-md transition-transform group-hover/btn:translate-x-1">
             <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>

      {/* Loading */}
      {isNavigating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[4px] transition-all duration-300">
           <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 border-4 border-slate-200 border-t-[#002a5c] rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold text-[#002a5c] animate-pulse">YÜKLENİYOR</span>
           </div>
        </div>
      )}
    </div>
  );
}
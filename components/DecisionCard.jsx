"use client";

import Link from "next/link";
import FormattedSummary from "@/components/FormattedSummary";
import { useState } from "react";

const MAX_CONTENT_LENGTH_FOR_BAR = 90000;

export default function DecisionCard({
  id,
  type,
  code,
  aiSummary,
  keywords,
  contentLength = 0,
}) {
  const aiSummaryIconPath = "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.197-.398a2.25 2.25 0 001.423-1.423L16.5 15.75l.398 1.197a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.197.398a2.25 2.25 0 00-1.423 1.423z";

  const keywordList = typeof keywords === 'string'
    ? keywords.split(',').map(kw => kw.trim()).filter(Boolean)
    : [];

  const qualityPercentage = Math.min(100, Math.max(0, (contentLength / MAX_CONTENT_LENGTH_FOR_BAR) * 100));
  let qualityText = "";
  let barColorClass = "";

  if (qualityPercentage < 30) {
    qualityText = "Kısa";
    barColorClass = "bg-red-500";
  } else if (qualityPercentage < 60) {
    qualityText = "Orta";
    barColorClass = "bg-yellow-500";
  } else {
    qualityText = "Uzun";
    barColorClass = "bg-green-500";
  }

  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <div className="group relative bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden h-[440px] text-[0.85rem] max-w-[340px] mx-auto mb-8">
      <div className="bg-gradient-to-r from-[#002a5c] via-[#003c7a] to-[#004365] px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18m-7 0h14M5 7l-2 4h4l-2-4zm14 0l-2 4h4l-2-4zM5 7h14" />
            </svg>
          </span>
          <h2 className="text-[12px] font-semibold text-white/95 truncate" title={type}>{type}</h2>
        </div>
        {code && (
          <span className="shrink-0 ml-2 rounded-full bg-white/10 text-[#D8EBFF] px-2 py-0.5 text-[11px] ring-1 ring-white/15" title={code}>
            {code}
          </span>
        )}
      </div>

      <div className="pt-3 px-4 pb-0 flex flex-col flex-1 space-y-4 overflow-y-auto min-h-0">
        {/* Uzunluk Göstergesi */}
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Karar Uzunluğu</span>
            
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0_10px,rgba(255,255,255,0.35)_10px,transparent_11px)] bg-[length:12px_100%] opacity-50"></div>
            <div
              className={`h-2 rounded-full transition-all duration-500 ease-out ${qualityPercentage < 30 ? 'bg-gradient-to-r from-red-500 to-rose-400' : qualityPercentage < 60 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-emerald-500 to-green-400'}`}
              style={{ width: `${qualityPercentage}%` }}
              title={`Karar uzunluğu: ${contentLength} karakter`}
            />
          </div>
        </div>

        {/* Anahtar Kelimeler */}
        {keywordList.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-2">
              {keywordList.map((kw, index) => (
                <Link
                  key={index}
                  href={`/kararlar?kw=${encodeURIComponent(kw)}`}
                  className="bg-sky-50 text-sky-700/90 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-sky-200 hover:bg-sky-100 hover:text-sky-800 transition-colors"
                >
                  {kw}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Özeti */}
        {aiSummary && (
          <div className="flex flex-col flex-1 min-h-0">
            <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700/90 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-700/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={aiSummaryIconPath} />
              </svg>
              <span>AI Özeti</span>
              <span className="ml-auto h-px w-16 bg-blue-200/70"></span>
            </h3>
            <div className="leading-relaxed/6 space-y-2 flex-1 overflow-y-auto pr-1">
              <FormattedSummary summary={aiSummary} />
            </div>
          </div>
        )}

        {/* Detay Butonu - içerik bitti */}
      </div>
      <div className="shrink-0 mt-2">
        <Link
          href={`/kararlar/${id}`}
          onClick={() => setIsNavigating(true)}
          className="block w-full text-center bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-[13px] py-2 hover:from-orange-600 hover:to-amber-600 transition-all duration-200 rounded-b-2xl group-hover:shadow-md"
        >
          Tam Karar Metnini Gör
        </Link>
      </div>
      {isNavigating && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="h-8 w-8 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
            <p className="text-sm font-medium">Yükleniyor…</p>
          </div>
        </div>
      )}
    </div>
  );
}
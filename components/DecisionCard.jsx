"use client";

import Link from "next/link";
import { useState } from "react";
import FormattedSummary from "@/components/FormattedSummary";

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

  const abbreviatedType = formatChamberName(type);

  const keywordList =
    typeof keywords === "string"
      ? keywords.split(",").map((kw) => kw.trim()).filter(Boolean)
      : [];

  // İçerik yoğunluğu sinyali (0–100)
  const density = Math.min(
    100,
    Math.max(0, (contentLength / MAX_CONTENT_LENGTH_FOR_BAR) * 100)
  );

  let densityLabel = "Özet";
  let densityColor = "bg-amber-500";
  if (density >= 60) {
    densityLabel = "Kapsamlı";
    densityColor = "bg-emerald-600";
  } else if (density >= 30) {
    densityLabel = "Gerekçeli";
    densityColor = "bg-sky-600";
  }

  return (
    <article className="group relative mx-auto flex h-[480px] w-full max-w-[360px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_32px_-16px_rgba(15,42,74,0.25)]">
      {/* Üst lacivert şerit (ince, anlamı: karar mercii) */}
      <span className="absolute inset-x-0 top-0 h-[3px] bg-[#0f2a4a]" />

      {/* HEADER */}
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 pb-4 pt-5">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Karar Mercii
          </p>
          <h2
            className="truncate font-serif text-lg font-semibold leading-tight text-[#0f2a4a]"
            title={type}
          >
            {abbreviatedType}
          </h2>
        </div>

        {code && (
          <span className="mt-0.5 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold tracking-wide text-slate-600">
            {code}
          </span>
        )}
      </header>

      {/* BODY */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* İçerik yoğunluğu */}
        <div className="px-5 pb-3 pt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              İçerik Yoğunluğu
            </span>
            <span className="text-[11px] font-semibold text-[#0f2a4a]">
              {densityLabel}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${densityColor} transition-all duration-700`}
              style={{ width: `${density}%` }}
            />
          </div>
        </div>

        {/* Anahtar kelimeler */}
        {keywordList.length > 0 && (
          <div className="px-5 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {keywordList.slice(0, 6).map((kw, i) => (
                <span
                  key={i}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-[#0f2a4a]"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Yapay zekâ özeti */}
        {aiSummary && (
          <div className="custom-scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 pb-4">
            <div className="sticky top-0 z-10 -mx-5 mb-2 flex items-center gap-1.5 border-b border-slate-100 bg-white/95 px-5 py-1.5 backdrop-blur-sm">
              <svg
                className="h-3.5 w-3.5 text-amber-600"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Yapay Zekâ Özeti
              </span>
            </div>

            <div className="text-[13px] font-normal leading-relaxed text-slate-700">
              <FormattedSummary summary={aiSummary} />
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="shrink-0 border-t border-slate-100 p-3">
        <Link
          href={`/kararlar/${id}`}
          onClick={() => setIsNavigating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0f2a4a] py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-[#163a63] active:scale-[0.99]"
        >
          Kararı İncele
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </footer>

      {/* Yükleniyor durumu */}
      {isNavigating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#0f2a4a]" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#0f2a4a]">
              Yükleniyor
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
"use client";

import React, { useEffect, useTransition } from "react";
import Link from "next/link";
import useMeasure from "react-use-measure";
import RelevanceRing from "./RelevanceRing";
import { useRouter } from "next/navigation";
import LoadingOverlay from "./LoadingOverlay";

function HighlightedText({ text, query }) {
  if (!query || !text) {
    return <p className="text-slate-400 leading-relaxed italic">İlgili metin bulunamadı.</p>;
  }
  const terms = query.split(/\s+/).filter(t => /[\p{L}0-9]/u.test(t));
  if (!terms.length) {
    return <p className="text-slate-400 leading-relaxed italic">İlgili metin bulunamadı.</p>;
  }
  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <p className="text-slate-300 leading-relaxed">
      ...{parts.map((part, i) =>
        terms.some(term => term.toLowerCase() === part.toLowerCase()) ? (
          <span key={i} className="bg-yellow-300/20 text-yellow-300 rounded px-1 py-0.5 font-medium">
            {part}
          </span>
        ) : (
          part
        )
      )}...
    </p>
  );
}

// Özet içinde "Anahtar Kelimeler" satırlarını tamamen kaldır
function stripKeywords(text) {
  if (!text) return "";
  let t = String(text);

  // Eğer satır başında/ayrı satırdaysa temizle
  t = t
    .replace(/^\s*Anahtar\s+Kelimeler?:.*$/gmi, "")
    .replace(/^\s*Anahtar\s+Kelimeleri:.*$/gmi, "")
    .replace(/^\s*Anahtar\s+Kelime:.*$/gmi, "");

  // Paragraf içinde geçiyorsa, oradan itibaren kırp
  const idx = t.search(/\bAnahtar\s+Kelimeler?:/i);
  if (idx !== -1) {
    t = t.slice(0, idx);
  }

  return t.trim();
}

const SearchResultItem = ({
  id,
  slug = "",
  // ↓↓↓ EKLENDİ
  typeLabel,       // Prisma/benimdb’den gelen doğru mahkeme/daire adı
  mahkeme,         // Weaviate’te varsa “mahkeme” alanı
  // ↓↓↓ Weaviate’tan gelebilen “type” (çoğu zaman yargi_karari) sadece en sonda yedek
  type,
  code,
  snippet,
  query,
  aiSummary,
  keywords = [],
  score,
  isOpen,
  onToggle,
  onHeightChange,
}) => {
  const [ref, { height }] = useMeasure();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Anahtar kelimeleri tekilleştir
  const uniqueKeywords = Array.isArray(keywords) ? [...new Set(keywords.filter(Boolean))] : [];

  useEffect(() => {
    if (height > 0 && onHeightChange) onHeightChange(id, height);
  }, [height, id, onHeightChange]);

  // ❗Başlık için öncelik: typeLabel → mahkeme → type
  const title = typeLabel || mahkeme || type || "Yargıtay Hukuk Dairesi";
  const displayCode = code || "";
  const hrefId = slug || String(id || "");

  return (
    <>
      {isPending && <LoadingOverlay />}
      <div
        ref={ref}
        className="search-result-item bg-slate-900/40 border border-slate-700/60 rounded-xl p-6 md:p-8 transition-all duration-300 hover:border-slate-600 hover:bg-slate-900/60 shadow-lg flex flex-col relative"
      >
        <div className="absolute top-4 right-4 z-20">
          <RelevanceRing score={score} />
        </div>

        <div className="mb-4 pr-16">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/kararlar/${hrefId}`}
              onClick={(e) => {
                e.preventDefault();
                startTransition(() => router.push(`/kararlar/${hrefId}`));
              }}
            >
              <h3 className="text-xl md:text-2xl font-sans font-semibold tracking-normal text-slate-100 hover:text-sky-400 transition-colors mr-2">
                {title}
              </h3>
            </Link>

            {uniqueKeywords.slice(0, 5).map((kw) => (
              <Link
                key={kw}
                href={`/akilli-arama?q=${encodeURIComponent(kw)}`}
                className="px-2.5 py-1 bg-sky-900/70 text-sky-300 rounded-full text-[11px] md:text-xs font-medium hover:bg-sky-800/90 transition-colors"
              >
                {kw}
              </Link>
            ))}
            {uniqueKeywords.length > 5 && (
              <span className="px-2.5 py-1 bg-slate-800/70 text-slate-300 rounded-full text-[11px] md:text-xs">
                +{uniqueKeywords.length - 5}
              </span>
            )}
          </div>

          {displayCode && (
            <p className="clean-numerals mt-1 text-sm font-semibold tracking-normal text-slate-400">{displayCode}</p>
          )}
        </div>

        <div className="flex-grow">
          <div className="border-l-4 border-sky-500/50 pl-4 mb-5">
            <HighlightedText text={snippet} query={query} />
          </div>
        </div>

        {aiSummary && (
          <button
            onClick={() => onToggle(id)}
            className="flex items-center gap-2 mt-4 text-sm text-blue-400 hover:text-sky-400 font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.636-6.364l-.707-.707M12 21v-1m5.636-4.364l.707.707M6.343 7.657l.707-.707m12.728 0l-.707.707M12 6a3 3 0 100 6 3 3 0 000-6z"></path>
            </svg>
            {isOpen ? "Yapay Zeka Özetini Kapat" : "Yapay Zeka Özetini Aç"}
          </button>
        )}

        {isOpen && aiSummary && (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 animate-fadeIn mt-4">
            {Array.from(
              stripKeywords(aiSummary || "").matchAll(
                /(Uyuşmazlık:|Gerekçe(?: ve Sonuç)?:)([\s\S]*?)(?=(Uyuşmazlık:|Gerekçe(?: ve Sonuç)?:|$))/g
              )
            ).map((match, idx) => {
              const header = match[1];
              const content = stripKeywords(match[2].trim());
              return (
                <div key={idx} className="mb-4 last:mb-0">
                  <p className="text-sm mb-1">
                    <span className="font-serif font-semibold text-slate-200">{header}</span>
                  </p>
                  <p className="text-slate-300 leading-relaxed">{content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(SearchResultItem);

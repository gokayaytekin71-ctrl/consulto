"use client";

import Link from "next/link";
import { useState } from "react";
import {
  chamberStyle,
  toKeywordList,
  parseStructuredSummary,
  extractUyusmazlikLine,
  formatDate,
  highlight,
} from "@/lib/karar-format";

/**
 * Tek tip, tarama-odaklı karar satırı. Editorial Law Review estetiği:
 * kağıt yüzey, serif başlık, lacivert+amber vurgular. Hem öne çıkanlar/son
 * eklenenler (SectionRow) hem arama sonuçları (SearchResults) hem de İBK
 * kayıtları aynı bileşeni kullanır.
 */
export default function DecisionRow({
  slug,
  externalHref,
  type,
  code,
  createdAt,
  aiSummary,
  keywords,
  headline,
  previewText,
  snippet,
  query,
}) {
  const [open, setOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const cs = chamberStyle(type);
  const kws = toKeywordList(keywords);
  const structured = aiSummary ? parseStructuredSummary(aiSummary) : null;

  const title =
    headline || (kws.length ? kws.slice(0, 5).join(" · ") : type || "Karar");

  const dateStr = formatDate(createdAt);
  const showSnippet = !!(query && snippet);
  const uyusmazlik = aiSummary ? extractUyusmazlikLine(aiSummary) : "";
  const preview = uyusmazlik || previewText || "";
  const hasSummary = !!aiSummary;

  const headingStyle = {
    display: "block",
    fontFamily: '"Times New Roman", Times, serif',
    fontWeight: 700,
    fontSize: "1.14rem",
    lineHeight: 1.32,
    letterSpacing: "0",
    color: "var(--navy, #0f2a4a)",
    textDecoration: "none",
    transition: "color .16s ease",
  };

  const Heading = () => {
    if (slug) {
      return (
        <Link
          href={`/kararlar/${slug}`}
          onClick={() => setIsNavigating(true)}
          style={headingStyle}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--navy-2, #163a63)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--navy, #0f2a4a)")}
        >
          {title}
        </Link>
      );
    }
    if (externalHref) {
      return (
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          style={headingStyle}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--navy-2, #163a63)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--navy, #0f2a4a)")}
        >
          {title}
        </a>
      );
    }
    return <span style={headingStyle}>{title}</span>;
  };

  return (
    <article
      className="group"
      style={{
        position: "relative",
        borderRadius: "12px",
        border: "1px solid var(--line, #e3ddd0)",
        background: "var(--surface, #fff)",
        padding: "16px clamp(16px, 2.4vw, 20px)",
        transition: "border-color .18s ease, box-shadow .18s ease, transform .12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--line-strong, #d3ccba)";
        e.currentTarget.style.boxShadow = "0 14px 34px -22px rgba(15,42,74,0.34)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--line, #e3ddd0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Meta satırı */}
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cs.chip}`}>
          {type}
        </span>
        {code && (
          <span className="clean-numerals" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "0.88rem", fontWeight: 700, color: "var(--ink-soft, #4a5160)" }}>
            {code}
          </span>
        )}
        {dateStr && (
          <span
            className="clean-numerals ml-auto inline-flex items-center gap-1"
            style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "0.86rem", fontWeight: 700, color: "var(--ink-soft, #4a5160)" }}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {dateStr}
          </span>
        )}
      </div>

      {/* Başlık (konu) */}
      <h3 style={{ marginTop: "4px" }} className="[&>*]:line-clamp-2">
        <Heading />
      </h3>

      {/* Önizleme: arama snippet'i öncelikli, yoksa uyuşmazlık satırı */}
      {showSnippet ? (
        <p
          className="mt-2 line-clamp-3"
          style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "1rem", lineHeight: 1.62, color: "var(--ink-soft, #4a5160)" }}
          dangerouslySetInnerHTML={{ __html: `… ${highlight(snippet, query)} …` }}
        />
      ) : preview ? (
        <p
          className="mt-2 line-clamp-2"
          style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "1rem", lineHeight: 1.62, color: "var(--ink-soft, #4a5160)" }}
        >
          <span style={{ color: "var(--ink-faint, #8a8f9c)", fontStyle: "italic" }}>Uyuşmazlık: </span>
          {preview}
        </p>
      ) : null}

      {/* Genişletilmiş yapılandırılmış özet */}
      {open && (
        <div
          className="mt-3 grid gap-3 pt-3"
          style={{ borderTop: "1px solid var(--line, #e3ddd0)" }}
        >
          {structured ? (
            structured.map((b, i) => (
              <div key={i}>
                <div
                  className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: i === 0 ? "var(--navy, #0f2a4a)" : "var(--amber, #b8860b)" }}
                >
                  {b.label}
                </div>
                <div style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "1rem", lineHeight: 1.62, color: "var(--ink-soft, #4a5160)" }}>
                  {b.body}
                </div>
              </div>
            ))
          ) : (
            <div
              className="whitespace-pre-line"
              style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "1rem", lineHeight: 1.62, color: "var(--ink-soft, #4a5160)" }}
            >
              {aiSummary || "Özet bulunamadı."}
            </div>
          )}
        </div>
      )}

      {/* Eylemler */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {slug && (
          <Link
            href={`/kararlar/${slug}`}
            onClick={() => setIsNavigating(true)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors"
            style={{
              border: "1px solid rgba(15,42,74,0.18)",
              background: "rgba(15,42,74,0.05)",
              color: "var(--navy, #0f2a4a)",
            }}
          >
            {isNavigating ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#0f2a4a]/30 border-t-[#0f2a4a]" />
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            )}
            Kararı incele
          </Link>
        )}

        {externalHref && (
          <a
            href={externalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors"
            style={{
              border: "1px solid rgba(184,134,11,0.3)",
              background: "rgba(184,134,11,0.08)",
              color: "var(--amber, #b8860b)",
            }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14M19 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5" /></svg>
            PDF'i aç
          </a>
        )}

        {hasSummary && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
            style={{
              border: "1px solid var(--line-strong, #d3ccba)",
              background: "var(--surface, #fff)",
              color: "var(--ink-soft, #4a5160)",
            }}
            aria-expanded={open}
          >
            <svg className="h-3.5 w-3.5" style={{ color: "var(--amber, #b8860b)" }} viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" /></svg>
            {open ? "Özeti kapat" : "Yapay zekâ özeti"}
          </button>
        )}
      </div>
    </article>
  );
}
